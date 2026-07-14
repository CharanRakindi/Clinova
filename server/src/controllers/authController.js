import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { generateTokens, setTokenCookies, clearTokenCookies } from '../utils/generateToken.js';
import { hashToken, tokenMatches } from '../utils/tokenHash.js';
import jwt from 'jsonwebtoken';
import { logAction } from '../utils/auditLogger.js';
import { issueCsrfToken } from '../middleware/csrf.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender } = req.body;

    const normalizedEmail = String(email || '').toLowerCase().trim();
    // Hospital domain is reserved for staff accounts provisioned by admin
    if (normalizedEmail.endsWith('@clinova.com')) {
      return res.status(400).json({
        success: false,
        message:
          'Emails ending in @clinova.com are reserved for hospital staff. Please use a personal email, or contact an administrator.',
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Public registration is always a patient (ignore any client-supplied role)
    const user = await User.create({
      name,
      email: normalizedEmail,
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
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    issueCsrfToken(res);

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

// @desc    Activate staff-created patient account with invite token + new password
// @route   POST /api/v1/auth/activate
// @access  Public
export const activateAccount = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail || !token || !password || String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Email, invite token, and password (min 8 characters) are required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +inviteTokenHash +inviteExpires'
    );
    if (!user || !user.inviteTokenHash) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite' });
    }
    if (user.inviteExpires && user.inviteExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invite has expired — contact the clinic' });
    }
    if (!tokenMatches(user.inviteTokenHash, token)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invite' });
    }

    user.password = password;
    user.inviteTokenHash = undefined;
    user.inviteExpires = undefined;
    user.mustChangePassword = false;
    user.passwordChangedAt = Date.now();
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    issueCsrfToken(res);

    await logAction(
      user._id,
      user.role,
      'UPDATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'ACTIVATE_ACCOUNT' },
      { critical: true }
    );

    res.status(200).json({
      success: true,
      message: 'Account activated',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    const normalizedEmail = String(email || '').toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +inviteTokenHash +inviteExpires'
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    if (user.inviteTokenHash) {
      return res.status(403).json({
        success: false,
        message: 'Account not activated. Open the invite link from your clinic to set a password.',
        code: 'INVITE_PENDING',
      });
    }

    user.lastLogin = Date.now();
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);
    issueCsrfToken(res);

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

    if (!user || !tokenMatches(user.refreshToken, refreshToken)) {
      clearTokenCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = hashToken(tokens.refreshToken);
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

// @desc    Update own basic profile (name, phone, DOB, gender, address)
// @route   PATCH /api/v1/auth/profile
// @access  Private — email is never changeable here (admin only)
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Explicitly reject email / role attempts from clients
    if (req.body.email !== undefined || req.body.role !== undefined) {
      return res.status(403).json({
        success: false,
        message: 'Email and role can only be changed by an administrator',
      });
    }

    const { name, phone, dateOfBirth, gender, address } = req.body;

    if (name !== undefined) {
      const cleanName = String(name)
        .trim()
        .replace(/^(dr\.?|doctor)\.?\s+/i, '')
        .trim();
      if (cleanName.length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      }
      user.name = cleanName;
    }

    if (phone !== undefined) {
      user.phone = String(phone || '').trim();
    }

    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        user.dateOfBirth = undefined;
      } else {
        const d = new Date(dateOfBirth);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid date of birth' });
        }
        user.dateOfBirth = d;
      }
    }

    if (gender !== undefined) {
      if (!gender) {
        user.gender = undefined;
      } else if (['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
        user.gender = gender;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid gender value' });
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
      user._id,
      user.role,
      'UPDATE',
      'User',
      user._id,
      req.ip,
      req.headers['user-agent'],
      { action: 'UPDATE_PROFILE' }
    );

    const safe = await User.findById(user._id);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: safe,
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
    user.refreshToken = hashToken(refreshToken);
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
