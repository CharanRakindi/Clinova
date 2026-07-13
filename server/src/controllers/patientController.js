import crypto from 'crypto';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Get all patients (scoped by role)
// @route   GET /api/v1/patients
// @access  Private/Admin/Doctor/Receptionist
export const getPatients = async (req, res, next) => {
  try {
    let patients;

    if (req.user.role === 'admin' || req.user.role === 'receptionist') {
      patients = await PatientProfile.find({})
        .populate('user', 'name email phone gender dateOfBirth profileImage isActive')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
      const appointmentPatientIds = await Appointment.distinct('patient', {
        doctor: req.user._id,
      });

      const or = [{ user: { $in: appointmentPatientIds } }];
      if (doctorProfile) {
        or.push({ assignedDoctors: doctorProfile._id });
      }

      patients = await PatientProfile.find({ $or: or })
        .populate('user', 'name email phone gender dateOfBirth profileImage isActive')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a patient account without logging the staff session out
// @route   POST /api/v1/patients
// @access  Private/Admin/Receptionist
// Does NOT set auth cookies — preserves the caller's session.
export const createPatientAccount = async (req, res, next) => {
  try {
    const { name, email, phone, gender } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // One-time temporary password; force change on first login
    const temporaryPassword = crypto.randomBytes(4).toString('hex'); // 8 hex chars

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      role: 'patient',
      phone: phone || undefined,
      gender: gender || undefined,
      mustChangePassword: true,
    });

    const profile = await PatientProfile.create({
      user: user._id,
      patientId: `PAT-${Date.now().toString().slice(-8)}`,
    });

    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { createdUserRole: 'patient', email: user.email }
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: profile.patientId,
        temporaryPassword, // return once for staff to share securely
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile by ID (user ID)
// @route   GET /api/v1/patients/:patientId
// @access  Private
export const getPatientProfile = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ user: req.params.patientId })
      .populate('user', 'name email phone gender dateOfBirth profileImage isActive')
      .populate('assignedDoctors');
      
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update patient profile
// @route   POST /api/v1/patients/:patientId
// @access  Private (Patient themselves or Admin)
export const updatePatientProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.patientId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { bloodGroup, emergencyContact, insuranceProvider, insuranceNumber } = req.body;

    let profile = await PatientProfile.findOne({ user: req.params.patientId });

    if (profile) {
      // Update
      profile.bloodGroup = bloodGroup || profile.bloodGroup;
      profile.emergencyContact = emergencyContact || profile.emergencyContact;
      profile.insuranceProvider = insuranceProvider || profile.insuranceProvider;
      profile.insuranceNumber = insuranceNumber || profile.insuranceNumber;
      await profile.save();
    } else {
      // Create
      profile = await PatientProfile.create({
        user: req.params.patientId,
        patientId: `PAT-${Date.now()}`,
        bloodGroup,
        emergencyContact,
        insuranceProvider,
        insuranceNumber,
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Get allergies for a patient
// @route   GET /api/v1/patients/:patientId/allergies
// @access  Private (Patient themselves, assigned Doctor, or Admin)
export const getPatientAllergies = async (req, res, next) => {
  try {
    const Allergy = (await import('../models/Allergy.js')).default;
    const allergies = await Allergy.find({ patient: req.params.patientId })
      .populate('recordedBy', 'name');
    res.status(200).json({ success: true, data: allergies });
  } catch (error) {
    next(error);
  }
};

// @desc    Add allergy for a patient
// @route   POST /api/v1/patients/:patientId/allergies
// @access  Private (Doctor only)
export const addPatientAllergy = async (req, res, next) => {
  try {
    const Allergy = (await import('../models/Allergy.js')).default;
    const { allergen, type, severity, reaction, notes } = req.body;

    if (!allergen) {
      return res.status(400).json({ success: false, message: 'Allergen is required' });
    }

    const allergy = await Allergy.create({
      patient: req.params.patientId,
      allergen,
      type,
      severity,
      reaction,
      notes,
      recordedBy: req.user._id
    });

    res.status(201).json({ success: true, data: allergy });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical conditions for a patient
// @route   GET /api/v1/patients/:patientId/conditions
// @access  Private (Patient themselves, assigned Doctor, or Admin)
export const getPatientConditions = async (req, res, next) => {
  try {
    const MedicalCondition = (await import('../models/MedicalCondition.js')).default;
    const conditions = await MedicalCondition.find({ patient: req.params.patientId })
      .populate('diagnosedBy', 'name');
    res.status(200).json({ success: true, data: conditions });
  } catch (error) {
    next(error);
  }
};

// @desc    Add medical condition for a patient
// @route   POST /api/v1/patients/:patientId/conditions
// @access  Private (Doctor only)
export const addPatientCondition = async (req, res, next) => {
  try {
    const MedicalCondition = (await import('../models/MedicalCondition.js')).default;
    const { conditionName, diagnosisDate, status, severity, notes } = req.body;

    if (!conditionName) {
      return res.status(400).json({ success: false, message: 'Condition name is required' });
    }

    const condition = await MedicalCondition.create({
      patient: req.params.patientId,
      conditionName,
      diagnosisDate: diagnosisDate || new Date(),
      status,
      severity,
      notes,
      diagnosedBy: req.user._id
    });

    res.status(201).json({ success: true, data: condition });
  } catch (error) {
    next(error);
  }
};
