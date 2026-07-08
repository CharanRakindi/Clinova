import MedicalRecord from '../models/MedicalRecord.js';
import AuditLog from '../models/AuditLog.js';

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

    // Create Audit Log
    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'CREATE',
      resourceType: 'MedicalRecord',
      resourceId: record._id,
      ipAddress: req.ip,
      metadata: { patientId: req.params.patientId }
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

    // Create new record with incremented version
    const newRecordData = {
      ...oldRecord.toObject(),
      ...req.body,
      _id: undefined,
      status: 'active',
      version: oldRecord.version + 1,
      amendedFrom: oldRecord._id,
    };
    delete newRecordData.createdAt;
    delete newRecordData.updatedAt;

    const newRecord = await MedicalRecord.create(newRecordData);

    await AuditLog.create({
      actor: req.user._id,
      actorRole: req.user.role,
      action: 'UPDATE',
      resourceType: 'MedicalRecord',
      resourceId: newRecord._id,
      ipAddress: req.ip,
      metadata: { amendedFrom: oldRecord._id }
    });

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    next(error);
  }
};
