import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';

// @desc    Get all appointments
// @route   GET /api/v1/appointments
// @access  Private
export const getAppointments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    // admin gets all

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email profileImage')
      .populate('doctor', 'name email profileImage')
      .sort({ appointmentDate: 1 });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment
// @route   POST /api/v1/appointments
// @access  Private
export const createAppointment = async (req, res, next) => {
  try {
    const { doctor, appointmentDate, timeSlot, reason } = req.body;
    const patientId = req.user.role === 'patient' ? req.user._id : req.body.patient;

    if (!patientId || !doctor || !appointmentDate || !timeSlot || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check for conflict
    const existing = await Appointment.findOne({
      doctor,
      appointmentDate,
      timeSlot,
      status: { $in: ['requested', 'confirmed'] },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Time slot is already booked for this doctor' });
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor,
      appointmentDate,
      timeSlot,
      reason,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: appointment });
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
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Auth check
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Business rules
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: `Cannot change status from ${appointment.status}` });
    }
    if (req.user.role === 'patient' && status === 'completed') {
      return res.status(403).json({ success: false, message: 'Patients cannot mark appointments as completed' });
    }

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
