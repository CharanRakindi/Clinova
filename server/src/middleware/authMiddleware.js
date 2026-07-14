import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { doctorHasPatientAccess } from '../utils/careAccess.js';

export const authenticate = async (req, res, next) => {
  let token;

  token = req.cookies.accessToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found or inactive' });
      }

      // Force password reset restriction on first login
      if (req.user.mustChangePassword) {
        const allowedPaths = [
          '/api/v1/auth/update-password',
          '/api/v1/auth/logout',
          '/api/v1/auth/me',
          '/api/v1/auth/profile',
        ];
        const currentPath = req.baseUrl + req.path;
        if (!allowedPaths.includes(currentPath)) {
          return res.status(403).json({
            success: false,
            message: 'First login password change required',
            mustChangePassword: true,
          });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

/** Optional auth — attaches req.user when a valid cookie is present; never fails. */
export const optionalAuthenticate = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive) req.user = user;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

/**
 * Clinical chart access (records, allergies, conditions, full profile PHI).
 * Receptionist is NOT allowed — scheduling only.
 */
export const authorizeDoctorPatientAccess = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required for access check' });
    }

    if (req.user.role === 'admin') return next();

    if (req.user.role === 'patient') {
      if (req.user._id.toString() !== patientId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Can only access your own data' });
      }
      return next();
    }

    if (req.user.role === 'doctor') {
      const ok = await doctorHasPatientAccess(req.user._id, patientId);
      if (ok) return next();
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Doctor is not authorized for this patient',
      });
    }

    // receptionist / lab / others — no clinical chart
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Clinical chart access requires a clinical role',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scheduling / directory profile read: admin, doctor (with care link),
 * patient self, receptionist (basic demographics only — enforced in controller).
 */
export const authorizePatientProfileRead = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }

    if (req.user.role === 'admin' || req.user.role === 'receptionist') {
      req.profileAccessLevel = req.user.role === 'receptionist' ? 'basic' : 'full';
      return next();
    }

    if (req.user.role === 'patient') {
      if (req.user._id.toString() !== patientId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      req.profileAccessLevel = 'full';
      return next();
    }

    if (req.user.role === 'doctor') {
      const ok = await doctorHasPatientAccess(req.user._id, patientId);
      if (!ok) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Doctor is not authorized for this patient',
        });
      }
      req.profileAccessLevel = 'full';
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    next(error);
  }
};
