import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Create a new prescription
// @route   POST /api/v1/prescriptions
// @access  Private/Doctor
export const createPrescription = async (req, res, next) => {
  try {
    const { patientId, medicines, instructions, startDate, endDate } = req.body;

    if (!patientId || !medicines || medicines.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and at least one medicine are required' });
    }

    const patientExists = await User.findById(patientId);
    if (!patientExists || patientExists.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      medicines,
      instructions,
      startDate: startDate || new Date(),
      endDate,
    });

    // Populate patient and doctor info
    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    // Audit log
    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'Prescription',
      prescription._id,
      req.ip,
      req.headers['user-agent'],
      { patientName: patientExists.name, medicinesCount: medicines.length }
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions
// @route   GET /api/v1/prescriptions
// @access  Private
export const getPrescriptions = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const { patientId } = req.query;

    let query = {};

    if (role === 'patient') {
      query.patient = _id;
    } else if (role === 'doctor') {
      query.doctor = _id;
      if (patientId) query.patient = patientId;
    } else if (role === 'admin') {
      if (patientId) query.patient = patientId;
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescription by ID
// @route   GET /api/v1/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const role = req.user.role;
    const uid = req.user._id.toString();
    const patientId = prescription.patient?._id?.toString() || prescription.patient?.toString();
    const doctorId = prescription.doctor?._id?.toString() || prescription.doctor?.toString();

    if (role === 'patient' && patientId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view this prescription' });
    }
    if (role === 'doctor' && doctorId !== uid) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot view this prescription' });
    }
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prescription status
// @route   PATCH /api/v1/prescriptions/:id/status
// @access  Private/Doctor
export const updatePrescriptionStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Only prescribing doctor can update it
    if (prescription.doctor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only the prescribing doctor can update status' });
    }

    prescription.status = status;
    await prescription.save();

    // Audit log
    await logAction(
      req.user._id,
      req.user.role,
      'UPDATE',
      'Prescription',
      prescription._id,
      req.ip,
      req.headers['user-agent'],
      { newStatus: status }
    );

    res.status(200).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};
