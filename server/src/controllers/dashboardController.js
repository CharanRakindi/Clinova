import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import LabReport from '../models/LabReport.js';
import Prescription from '../models/Prescription.js';

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
      const [upcomingAppointments, totalRecords, labReports] = await Promise.all([
        Appointment.countDocuments({
          patient: _id,
          status: { $in: ['requested', 'confirmed'] }
        }),
        MedicalRecord.countDocuments({ patient: _id, status: 'active' }),
        LabReport.countDocuments({ patient: _id }),
      ]);
      data = { upcomingAppointments, totalRecords, labReports };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Recent activity feed for dashboards
// @route   GET /api/v1/dashboard/activity
// @access  Private
export const getActivityFeed = async (req, res, next) => {
  try {
    const { role, _id } = req.user;
    const items = [];

    if (role === 'patient') {
      const [apts, labs, rxs] = await Promise.all([
        Appointment.find({ patient: _id }).sort({ updatedAt: -1 }).limit(8)
          .populate('doctor', 'name'),
        LabReport.find({ patient: _id }).sort({ updatedAt: -1 }).limit(6)
          .populate('doctor', 'name'),
        Prescription.find({ patient: _id }).sort({ updatedAt: -1 }).limit(4)
          .populate('doctor', 'name'),
      ]);
      for (const a of apts) {
        items.push({
          id: `apt-${a._id}`,
          type: 'appointment',
          title: `Appointment ${a.status}`,
          detail: `Dr. ${a.doctor?.name || '—'} · ${a.timeSlot || ''}`,
          at: a.updatedAt || a.createdAt,
        });
        if (a.visitSummary && a.status === 'completed') {
          items.push({
            id: `sum-${a._id}`,
            type: 'visit_summary',
            title: 'Visit summary ready',
            detail: a.visitSummary.slice(0, 120),
            at: a.updatedAt,
          });
        }
      }
      for (const l of labs) {
        items.push({
          id: `lab-${l._id}`,
          type: 'lab',
          title: l.testName,
          detail: `Status: ${String(l.status).replace(/_/g, ' ')}`,
          at: l.updatedAt || l.orderedDate,
        });
      }
      for (const r of rxs) {
        items.push({
          id: `rx-${r._id}`,
          type: 'prescription',
          title: 'Prescription',
          detail: `Dr. ${r.doctor?.name || '—'} · ${r.medicines?.[0]?.medicineName || 'Medication'}`,
          at: r.updatedAt || r.createdAt,
        });
      }
    } else if (role === 'doctor') {
      const apts = await Appointment.find({ doctor: _id })
        .sort({ updatedAt: -1 })
        .limit(12)
        .populate('patient', 'name');
      for (const a of apts) {
        items.push({
          id: `apt-${a._id}`,
          type: 'appointment',
          title: `${a.patient?.name || 'Patient'} · ${a.status}`,
          detail: `${a.timeSlot || ''} · ${a.reason || ''}`.trim(),
          at: a.updatedAt || a.createdAt,
        });
      }
    } else if (role === 'admin' || role === 'receptionist') {
      const apts = await Appointment.find({})
        .sort({ updatedAt: -1 })
        .limit(15)
        .populate('patient', 'name')
        .populate('doctor', 'name');
      for (const a of apts) {
        items.push({
          id: `apt-${a._id}`,
          type: 'appointment',
          title: `${a.patient?.name || 'Patient'} → Dr. ${a.doctor?.name || '—'}`,
          detail: `${a.status} · ${a.queueStatus || 'not_arrived'}`,
          at: a.updatedAt || a.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.at) - new Date(a.at));
    res.status(200).json({ success: true, data: items.slice(0, 20) });
  } catch (error) {
    next(error);
  }
};
