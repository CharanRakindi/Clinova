import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

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
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

export const authorizeDoctorPatientAccess = async (req, res, next) => {
  try {
    const { patientId } = req.params; // Expect patient ID in params
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required for access check' });
    }

    if (req.user.role === 'admin') return next(); // Admins bypass
    if (req.user.role === 'patient') {
      // Patient can only access their own records
      if (req.user._id.toString() !== patientId) {
        return res.status(403).json({ success: false, message: 'Forbidden: Can only access your own data' });
      }
      return next();
    }

    if (req.user.role === 'doctor') {
      // Check if doctor is assigned to this patient
      const patientProfile = await PatientProfile.findOne({ user: patientId });
      const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
      
      if (!patientProfile || !doctorProfile) {
        return res.status(404).json({ success: false, message: 'Profiles not found' });
      }

      const isAssigned = patientProfile.assignedDoctors.includes(doctorProfile._id);
      
      // OR check if there is an appointment history
      const hasAppointment = await Appointment.findOne({
        patient: patientId,
        doctor: req.user._id,
      });

      if (isAssigned || hasAppointment) {
        return next();
      }

      return res.status(403).json({ success: false, message: 'Forbidden: Doctor is not authorized for this patient' });
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    next(error);
  }
};
