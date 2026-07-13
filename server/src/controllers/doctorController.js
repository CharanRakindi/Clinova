import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

// @desc    Get all doctors
// @route   GET /api/v1/doctors
// @access  Public/Private
export const getDoctors = async (req, res, next) => {
  try {
    // Public callers get limited fields; authenticated staff get contact info
    const isAuthed = !!req.user;
    const userFields = isAuthed
      ? 'name email phone gender profileImage isActive'
      : 'name profileImage isActive';

    const doctors = await DoctorProfile.find({})
      .populate('user', userFields)
      .populate('department', 'name');
    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor profile by ID (user ID)
// @route   GET /api/v1/doctors/:doctorId
// @access  Public/Private
export const getDoctorProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.params.doctorId })
      .populate('user', 'name email phone gender profileImage isActive')
      .populate('department', 'name');
      
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update doctor profile
// @route   POST /api/v1/doctors/:doctorId
// @access  Private (Doctor themselves or Admin)
export const updateDoctorProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.doctorId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { specialization, department, licenseNumber, experienceYears, qualifications, consultationFee, availability } = req.body;

    let profile = await DoctorProfile.findOne({ user: req.params.doctorId });

    if (profile) {
      profile.specialization = specialization || profile.specialization;
      profile.department = department || profile.department;
      profile.licenseNumber = licenseNumber || profile.licenseNumber;
      profile.experienceYears = experienceYears || profile.experienceYears;
      profile.qualifications = qualifications || profile.qualifications;
      profile.consultationFee = consultationFee || profile.consultationFee;
      profile.availability = availability || profile.availability;
      await profile.save();
    } else {
      profile = await DoctorProfile.create({
        user: req.params.doctorId,
        doctorId: `DOC-${Date.now()}`,
        specialization,
        department,
        licenseNumber,
        experienceYears,
        qualifications,
        consultationFee,
        availability,
      });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};
