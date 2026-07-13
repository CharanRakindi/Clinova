import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import { logAction } from '../utils/auditLogger.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Public registration is always a patient (ignore any client-supplied role)
    const user = await User.create({
      name,
      email,
      password,
      role: 'patient',
      phone,
      gender,
    });

    await PatientProfile.create({
      user: user._id,
      patientId: `PAT-${Date.now().toString().slice(-8)}`,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // In a real app, save refreshToken hash to DB if needed for invalidation
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    // Audit log
    await logAction(
      user._id,
      user.role,
      'REGISTER',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { name: user.name, email: user.email }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    user.lastLogin = Date.now();
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    // Audit log
    await logAction(
      user._id,
      user.role,
      'LOGIN',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { email: user.email }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: !!user.mustChangePassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Public
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();

        // Audit log
        await logAction(
          user._id,
          user.role,
          'LOGOUT',
          'User',
          user._id,
          req.ip,
          req.headers['user-agent'],
          { email: user.email }
        );
      }
    }
    clearTokenCookies(res);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
// @access  Public
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      clearTokenCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(200).json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    clearTokenCookies(res);
    res.status(401).json({ success: false, message: 'Token refresh failed' });
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PATCH /api/v1/auth/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user || !(await user.matchPassword(oldPassword))) {
      return res.status(401).json({ success: false, message: 'Invalid current password' });
    }
    
    user.password = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt = Date.now();

    // Rotate session: issue new tokens and invalidate prior refresh token
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();
    setTokenCookies(res, accessToken, refreshToken);

    // Audit log
    await logAction(
      user._id,
      user.role,
      'UPDATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'UPDATE_PASSWORD' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
