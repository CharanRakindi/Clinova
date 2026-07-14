import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { logAction } from '../utils/auditLogger.js';

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { parsePagination } = await import('../utils/pagination.js');
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.status(200).json({
      success: true,
      data: users,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit) || 1) },
    });
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

// @desc    Update user fields (admin) — including email
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone, dateOfBirth, gender, address, employeeId, isActive } = req.body;

    if (name !== undefined) {
      user.name = String(name)
        .trim()
        .replace(/^(dr\.?|doctor)\.?\s+/i, '')
        .trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email || '').toLowerCase().trim();
      if (!normalizedEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }
      // Staff / admin accounts must stay on hospital domain when currently staff
      const staffRoles = ['doctor', 'receptionist', 'lab_technician', 'admin'];
      if (staffRoles.includes(user.role) && !normalizedEmail.endsWith('@clinova.com')) {
        return res.status(400).json({
          success: false,
          message: 'Staff accounts must use a @clinova.com email address',
        });
      }
      if (user.role === 'patient' && normalizedEmail.endsWith('@clinova.com')) {
        return res.status(400).json({
          success: false,
          message: '@clinova.com emails are reserved for hospital staff',
        });
      }
      const taken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (taken) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = normalizedEmail;
    }

    if (phone !== undefined) user.phone = String(phone || '').trim();
    if (employeeId !== undefined) user.employeeId = String(employeeId || '').trim();
    if (typeof isActive === 'boolean') user.isActive = isActive;

    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) user.dateOfBirth = undefined;
      else {
        const d = new Date(dateOfBirth);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid date of birth' });
        }
        user.dateOfBirth = d;
      }
    }

    if (gender !== undefined) {
      if (!gender) user.gender = undefined;
      else if (['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        user.gender = gender;
      }
    }

    if (address !== undefined && typeof address === 'object') {
      user.address = {
        street: String(address.street || '').trim(),
        city: String(address.city || '').trim(),
        state: String(address.state || '').trim(),
        zipCode: String(address.zipCode || '').trim(),
        country: String(address.country || '').trim(),
      };
    }

    await user.save();

    await logAction(
      req.user._id,
      req.user.role,
      'UPDATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'ADMIN_UPDATE_USER', emailChanged: email !== undefined }
    );

    const safe = await User.findById(user._id).select('-password');
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: safe,
    });
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
