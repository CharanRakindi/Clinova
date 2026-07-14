import Appointment from '../models/Appointment.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

/** Active clinical relationship statuses (not cancelled / requested alone). */
const ACTIVE_CARE_STATUSES = ['confirmed', 'completed'];

/**
 * Whether a doctor (by User id) may access a patient's clinical data.
 * True if explicitly assigned OR has confirmed/completed appointment history.
 */
export async function doctorHasPatientAccess(doctorUserId, patientUserId) {
  const patientProfile = await PatientProfile.findOne({ user: patientUserId }).select(
    'assignedDoctors'
  );
  const doctorProfile = await DoctorProfile.findOne({ user: doctorUserId }).select('_id');

  if (patientProfile && doctorProfile) {
    const isAssigned = (patientProfile.assignedDoctors || []).some(
      (id) => id.toString() === doctorProfile._id.toString()
    );
    if (isAssigned) return true;
  }

  const hasCareAppointment = await Appointment.findOne({
    patient: patientUserId,
    doctor: doctorUserId,
    status: { $in: ACTIVE_CARE_STATUSES },
  }).select('_id');

  return !!hasCareAppointment;
}

/**
 * Assert access for req.user to patientUserId for clinical operations.
 * Returns null if OK, or { status, message } if denied.
 */
export async function assertClinicalAccess(user, patientUserId) {
  if (!user || !patientUserId) {
    return { status: 400, message: 'Patient ID is required' };
  }

  const pid = patientUserId.toString();
  const uid = user._id.toString();

  // Admin: still allowed, but callers should log break-glass via auditAccess
  if (user.role === 'admin') return null;

  if (user.role === 'patient') {
    if (uid !== pid) {
      return { status: 403, message: 'Forbidden: Can only access your own data' };
    }
    return null;
  }

  if (user.role === 'doctor') {
    const ok = await doctorHasPatientAccess(uid, pid);
    if (!ok) {
      return { status: 403, message: 'Forbidden: Doctor is not authorized for this patient' };
    }
    return null;
  }

  if (user.role === 'lab_technician') {
    return { status: 403, message: 'Forbidden: Lab staff cannot access full clinical chart' };
  }

  if (user.role === 'receptionist') {
    return { status: 403, message: 'Forbidden: Clinical records require clinical role' };
  }

  return { status: 403, message: 'Forbidden' };
}

/**
 * Link doctor↔patient assignment when care is established (confirmed appointment).
 */
export async function ensureDoctorPatientLink(doctorUserId, patientUserId) {
  const patientProfile = await PatientProfile.findOne({ user: patientUserId });
  const doctorProfile = await DoctorProfile.findOne({ user: doctorUserId });
  if (!patientProfile || !doctorProfile) return;

  const assigned = (patientProfile.assignedDoctors || []).some(
    (id) => id.toString() === doctorProfile._id.toString()
  );
  if (!assigned) {
    patientProfile.assignedDoctors = [
      ...(patientProfile.assignedDoctors || []),
      doctorProfile._id,
    ];
    await patientProfile.save();
  }

  const reverse = (doctorProfile.assignedPatients || []).some(
    (id) => id.toString() === patientProfile._id.toString()
  );
  if (!reverse) {
    doctorProfile.assignedPatients = [
      ...(doctorProfile.assignedPatients || []),
      patientProfile._id,
    ];
    await doctorProfile.save();
  }
}
