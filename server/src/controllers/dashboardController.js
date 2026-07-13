import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

// @desc    Get dashboard stats
// @route   GET /api/v1/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    let data = {};

    if (role === 'admin') {
      const [totalUsers, totalPatients, totalDoctors, totalAppointments] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'patient' }),
        User.countDocuments({ role: 'doctor' }),
        Appointment.countDocuments()
      ]);
      data = { totalUsers, totalPatients, totalDoctors, totalAppointments };
    } 
    else if (role === 'doctor') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const doctorProfile = await DoctorProfile.findOne({ user: _id });
      const [todaysAppointments, totalAssignedPatients, completedConsultations] = await Promise.all([
        Appointment.countDocuments({
          doctor: _id,
          appointmentDate: { $gte: startOfDay, $lte: endOfDay },
        }),
        doctorProfile
          ? PatientProfile.countDocuments({ assignedDoctors: doctorProfile._id })
          : Promise.resolve(0),
        Appointment.countDocuments({ doctor: _id, status: 'completed' }),
      ]);
      data = { todaysAppointments, totalAssignedPatients, completedConsultations };
    } 
    else if (role === 'patient') {
      const [upcomingAppointments, totalRecords] = await Promise.all([
        Appointment.countDocuments({
          patient: _id,
          status: { $in: ['requested', 'confirmed'] }
        }),
        MedicalRecord.countDocuments({ patient: _id, status: 'active' })
      ]);
      data = { upcomingAppointments, totalRecords };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
