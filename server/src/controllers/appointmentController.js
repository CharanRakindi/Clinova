import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { sendToUser } from '../services/socketService.js';
import { ensureDoctorPatientLink } from '../utils/careAccess.js';
import { parsePagination } from '../utils/pagination.js';

const VALID_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'no-show'];

// @desc    Get appointments (scoped by role)
// @route   GET /api/v1/appointments
// @access  Private
export const getAppointments = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'receptionist' || req.user.role === 'admin') {
      query = {};
    } else {
      // lab_technician and others: no appointment list access
      return res.status(200).json({ success: true, data: [] });
    }

    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patient', 'name email profileImage')
        .populate('doctor', 'name email profileImage')
        .sort({ appointmentDate: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: appointments,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit) || 1) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment
// @route   POST /api/v1/appointments
// @access  Private (patient, doctor, receptionist, admin)
export const createAppointment = async (req, res, next) => {
  try {
    const allowed = ['patient', 'doctor', 'receptionist', 'admin'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { doctor, appointmentDate, timeSlot, reason } = req.body;
    // Accept legacy patientId from older clients
    const patientId =
      req.user.role === 'patient'
        ? req.user._id
        : req.body.patient || req.body.patientId;
    const doctorId = doctor || req.body.doctorId;

    if (!patientId || !doctorId || !appointmentDate || !timeSlot || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Allow today and future dates; reject past calendar days
    const day = new Date(appointmentDate);
    if (Number.isNaN(day.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date' });
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const apptDay = new Date(day);
    apptDay.setHours(0, 0, 0, 0);
    if (apptDay < startOfToday) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be booked for today or a future date',
      });
    }

    const patientUser = await User.findById(patientId);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(400).json({ success: false, message: 'Invalid patient' });
    }

    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(400).json({ success: false, message: 'Invalid doctor' });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: doctorId });
    if (doctorProfile && doctorProfile.isAcceptingPatients === false && req.user.role === 'patient') {
      return res.status(400).json({
        success: false,
        message: 'This doctor is not currently accepting new appointment requests',
      });
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      status: { $in: ['requested', 'confirmed'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked for this doctor',
      });
    }

    const status =
      req.user.role === 'patient' ? 'requested' : req.body.status || 'confirmed';

    let appointment;
    try {
      appointment = await Appointment.create({
        patient: patientId,
        doctor: doctorId,
        appointmentDate,
        timeSlot,
        reason,
        status: VALID_STATUSES.includes(status) ? status : 'requested',
        createdBy: req.user._id,
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Time slot is already booked for this doctor',
        });
      }
      throw err;
    }

    // Chart access only after confirmed care (not mere request)
    if (appointment.status === 'confirmed') {
      await ensureDoctorPatientLink(doctorId, patientId);
    }

    if (req.user.role === 'patient') {
      sendToUser(doctorId, 'notification', {
        message: `New appointment requested by ${req.user.name}`,
        timestamp: new Date(),
      });
    } else {
      sendToUser(patientId, 'notification', {
        message: `An appointment was scheduled for you with Dr. ${doctorUser.name}`,
        timestamp: new Date(),
      });
    }

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email profileImage')
      .populate('doctor', 'name email profileImage');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status
// @route   PATCH /api/v1/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const role = req.user.role;
    const userId = req.user._id.toString();

    if (role === 'patient') {
      if (appointment.patient.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Patients can only cancel appointments',
        });
      }
    } else if (role === 'doctor') {
      if (appointment.doctor.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    } else if (role === 'receptionist' || role === 'admin') {
      // allowed
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${appointment.status}`,
      });
    }

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason || 'Cancelled';
    }

    await appointment.save();

    if (status === 'confirmed') {
      await ensureDoctorPatientLink(appointment.doctor, appointment.patient);
    }

    const patientMessages = {
      confirmed: 'Your appointment request was accepted by the doctor',
      cancelled: 'Your appointment was cancelled',
      completed: 'Your appointment was marked completed',
      'no-show': 'Your appointment was marked as no-show',
    };
    sendToUser(appointment.patient, 'notification', {
      message: patientMessages[status] || `Your appointment status was updated to ${status}`,
      timestamp: new Date(),
    });

    if (appointment.doctor.toString() !== userId) {
      sendToUser(appointment.doctor, 'notification', {
        message: `Appointment status updated to ${status}`,
        timestamp: new Date(),
      });
    }

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email profileImage')
      .populate('doctor', 'name email profileImage');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
