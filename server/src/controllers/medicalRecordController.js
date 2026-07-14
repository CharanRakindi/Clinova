import MedicalRecord from '../models/MedicalRecord.js';
import { sendToUser } from '../services/socketService.js';
import { logAccess, logAction } from '../utils/auditLogger.js';

// @desc    Get medical records for a patient
// @route   GET /api/v1/patients/:patientId/medical-records
// @access  Private (Patient or Authorized Doctor)
export const getPatientMedicalRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ 
      patient: req.params.patientId,
      status: { $ne: 'archived' }
    })
      .populate('doctor', 'name profileImage')
      .populate('appointment', 'appointmentDate timeSlot')
      .sort({ visitDate: -1 });

    await logAccess(req, 'MedicalRecord', req.params.patientId, {
      count: records.length,
      patientId: req.params.patientId,
      breakGlass: req.user.role === 'admin' ? true : undefined,
    });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a medical record
// @route   POST /api/v1/patients/:patientId/medical-records
// @access  Private (Doctor only)
export const createMedicalRecord = async (req, res, next) => {
  try {
    const { appointment, chiefComplaint, symptoms, diagnosis, clinicalNotes, treatmentPlan, vitals, followUpDate } = req.body;
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can create medical records' });
    }

    const record = await MedicalRecord.create({
      patient: req.params.patientId,
      doctor: req.user._id,
      appointment,
      chiefComplaint,
      symptoms,
      diagnosis,
      clinicalNotes,
      treatmentPlan,
      vitals,
      followUpDate
    });

    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'MedicalRecord',
      record._id,
      req.ip,
      req.headers['user-agent'],
      { patientId: req.params.patientId },
      { critical: true }
    );

    // Notify patient
    sendToUser(req.params.patientId, 'notification', {
      message: `Dr. ${req.user.name} added a new medical record to your file`,
      timestamp: new Date()
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

// @desc    Amend a medical record
// @route   POST /api/v1/medical-records/:id/amendments
// @access  Private (Doctor only)
export const amendMedicalRecord = async (req, res, next) => {
  try {
    const oldRecord = await MedicalRecord.findById(req.params.id);
    if (!oldRecord) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (req.user.role !== 'doctor' || oldRecord.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the original doctor can amend this record' });
    }

    // Soft delete / archive the old record
    oldRecord.status = 'amended';
    await oldRecord.save();

    // Whitelist only amendable clinical fields (never take patient/doctor/version from body)
    const allowed = [
      'chiefComplaint',
      'symptoms',
      'diagnosis',
      'clinicalNotes',
      'treatmentPlan',
      'vitals',
      'followUpDate',
      'attachments',
      'appointment',
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    const base = oldRecord.toObject();
    delete base._id;
    delete base.createdAt;
    delete base.updatedAt;
    delete base.__v;

    const newRecord = await MedicalRecord.create({
      ...base,
      ...patch,
      patient: oldRecord.patient,
      doctor: oldRecord.doctor,
      status: 'active',
      version: oldRecord.version + 1,
      amendedFrom: oldRecord._id,
    });

    await logAction(
      req.user._id,
      req.user.role,
      'UPDATE',
      'MedicalRecord',
      newRecord._id,
      req.ip,
      req.headers['user-agent'],
      { amendedFrom: oldRecord._id },
      { critical: true }
    );

    // Notify patient
    sendToUser(oldRecord.patient, 'notification', {
      message: `Dr. ${req.user.name} amended one of your medical records`,
      timestamp: new Date()
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    next(error);
  }
};
