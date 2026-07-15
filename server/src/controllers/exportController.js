import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import LabReport from '../models/LabReport.js';
import Allergy from '../models/Allergy.js';
import MedicalCondition from '../models/MedicalCondition.js';
import Message from '../models/Message.js';

// @desc    Export current patient's clinical data (JSON download)
// @route   GET /api/v1/export/me
// @access  Private/Patient
export const exportMyData = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can export their care data from this endpoint',
      });
    }

    const patientId =
      req.user.role === 'admin' && req.query.patientId
        ? req.query.patientId
        : req.user._id;

    if (req.user.role === 'patient' && patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [user, appointments, records, prescriptions, labs, allergies, conditions, messages] =
      await Promise.all([
        User.findById(patientId).select('-password -refreshToken -inviteTokenHash'),
        Appointment.find({ patient: patientId }).sort({ appointmentDate: -1 }).limit(200),
        MedicalRecord.find({ patient: patientId }).sort({ visitDate: -1 }).limit(100),
        Prescription.find({ patient: patientId }).sort({ createdAt: -1 }).limit(100),
        LabReport.find({ patient: patientId }).sort({ orderedDate: -1 }).limit(100),
        Allergy.find({ patient: patientId }),
        MedicalCondition.find({ patient: patientId }),
        Message.find({
          $or: [{ from: patientId }, { to: patientId }],
        })
          .sort({ createdAt: -1 })
          .limit(200)
          .select('-__v'),
      ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      format: 'clinova-patient-export-v1',
      notice:
        'This file is for your personal records. Clinova is a portfolio/demo product — not a certified EHR.',
      profile: user,
      appointments,
      medicalRecords: records,
      prescriptions,
      labReports: labs,
      allergies,
      conditions,
      messages,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="clinova-export-${patientId}-${Date.now()}.json"`
    );
    res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    next(error);
  }
};
