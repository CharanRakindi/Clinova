import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';

// @desc    Get all patients
// @route   GET /api/v1/patients
// @access  Private/Admin/Doctor
export const getPatients = async (req, res, next) => {
  try {
    const query = {};
    
    // If doctor, only return assigned patients or patients they have seen. 
    // For simplicity in this endpoint, we might let doctors search all patients to assign them, 
    // or restrict it. Let's restrict to all for search, but viewing details is restricted by ABAC.
    
    const patients = await PatientProfile.find(query).populate('user', 'name email phone gender dateOfBirth profileImage');
    res.status(200).json({ success: true, data: patients });
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
