import express from 'express';
import { getPatients, getPatientProfile, updatePatientProfile } from '../controllers/patientController.js';
import { getPatientMedicalRecords, createMedicalRecord } from '../controllers/medicalRecordController.js';
import { authenticate, authorizeRoles, authorizeDoctorPatientAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(authorizeRoles('admin', 'doctor'), getPatients);

router.route('/:patientId')
  .get(authorizeDoctorPatientAccess, getPatientProfile)
  .post(updatePatientProfile);

// Nested routes for medical records
router.route('/:patientId/medical-records')
  .get(authorizeDoctorPatientAccess, getPatientMedicalRecords)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, createMedicalRecord);

export default router;
