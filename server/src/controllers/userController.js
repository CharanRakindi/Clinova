import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PATCH /api/v1/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({ success: true, message: 'User status updated', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new staff user (Admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, employeeId, department, specialization } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }

    if (!['doctor', 'receptionist', 'lab_technician'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid staff role specified' });
    }

    if (role === 'doctor' && !department) {
      return res.status(400).json({ success: false, message: 'Department is required for doctors' });
    }

    const normalizedEmail = String(email || '').toLowerCase().trim();
    // Staff accounts should use the hospital domain
    if (!normalizedEmail.endsWith('@clinova.com')) {
      return res.status(400).json({
        success: false,
        message: 'Staff accounts must use a @clinova.com email address',
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Strip accidental Dr. prefix; display layer formats titles
    const cleanName = String(name || '')
      .trim()
      .replace(/^(dr\.?|doctor)\.?\s+/i, '')
      .trim();

    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      password,
      role,
      phone,
      employeeId,
      department,
      mustChangePassword: true, // Force password reset on first login
    });

    if (role === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        doctorId: employeeId || `DOC-${Date.now()}`,
        specialization: specialization || 'General Medicine',
        department: department,
        licenseNumber: `LIC-${employeeId || Date.now()}`,
        experienceYears: 1
      });
    }

    // Audit log
    await logAction(
      req.user._id,
      req.user.role,
      'CREATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { createdUserRole: role, email }
    );

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    next(error);
  }
};
