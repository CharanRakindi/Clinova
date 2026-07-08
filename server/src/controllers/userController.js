import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

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
