import crypto from 'crypto';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { logAction } from '../utils/auditLogger.js';
import { parsePagination } from '../utils/pagination.js';
import { generateSecureToken, hashToken } from '../utils/tokenHash.js';

// @desc    Get all patients (scoped by role)
// @route   GET /api/v1/patients
// @access  Private/Admin/Doctor/Receptionist
export const getPatients = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    let filter = {};

    if (req.user.role === 'admin' || req.user.role === 'receptionist') {
      filter = {};
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
      const appointmentPatientIds = await Appointment.distinct('patient', {
        doctor: req.user._id,
        status: { $in: ['confirmed', 'completed'] },
      });

      const or = [{ user: { $in: appointmentPatientIds } }];
      if (doctorProfile) {
        or.push({ assignedDoctors: doctorProfile._id });
      }
      filter = { $or: or };
    } else {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Receptionist: basic directory fields only (no clinical PHI expansion later)
    const userFields =
      req.user.role === 'receptionist'
        ? 'name email phone gender isActive'
        : 'name email phone gender dateOfBirth profileImage isActive';

    const [patients, total] = await Promise.all([
      PatientProfile.find(filter)
        .populate('user', userFields)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PatientProfile.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit) || 1) },
    });
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

    const normalizedEmail = String(email).toLowerCase().trim();
    if (normalizedEmail.endsWith('@clinova.com')) {
      return res.status(400).json({
        success: false,
        message:
          'Emails ending in @clinova.com are reserved for hospital staff. Use a personal patient email.',
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Unusable random password until patient activates via one-time invite token
    const placeholderPassword = crypto.randomBytes(32).toString('hex');
    const inviteToken = generateSecureToken(32);
    const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: placeholderPassword,
      role: 'patient',
      phone: phone || undefined,
      gender: gender || undefined,
      mustChangePassword: false,
      inviteTokenHash: hashToken(inviteToken),
      inviteExpires,
      isActive: true,
    });

    const profile = await PatientProfile.create({
      user: user._id,
      patientId: `PAT-${Date.now().toString().slice(-8)}`,
      // bloodGroup intentionally unset until documented
    });

    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { createdUserRole: 'patient', email: user.email, invite: true },
      { critical: true }
    );

    const clientBase = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    const activationPath = `/activate?token=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(normalizedEmail)}`;

    res.status(201).json({
      success: true,
      message: 'Patient registered. Share the one-time activation link (expires in 48h).',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        patientId: profile.patientId,
        // One-time secret — never a login password; hash only stored server-side
        inviteToken,
        inviteExpires,
        activationUrl: `${clientBase}${activationPath}`,
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
    const isBasic = req.profileAccessLevel === 'basic';
    const userFields = isBasic
      ? 'name email phone gender isActive'
      : 'name email phone gender dateOfBirth profileImage isActive';

    let profileQuery = PatientProfile.findOne({ user: req.params.patientId }).populate(
      'user',
      userFields
    );
    if (!isBasic) {
      profileQuery = profileQuery.populate('assignedDoctors');
    }
    const profile = await profileQuery;

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    // Strip clinical fields for receptionist scheduling view
    if (isBasic) {
      const plain = profile.toObject();
      delete plain.bloodGroup;
      delete plain.insuranceProvider;
      delete plain.insuranceNumber;
      delete plain.emergencyContact;
      delete plain.assignedDoctors;
      return res.status(200).json({ success: true, data: plain, access: 'basic' });
    }

    res.status(200).json({ success: true, data: profile, access: 'full' });
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
