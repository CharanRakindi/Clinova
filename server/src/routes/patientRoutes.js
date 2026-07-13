import express from 'express';
import { 
  getPatients,
  createPatientAccount,
  getPatientProfile, 
  updatePatientProfile,
  getPatientAllergies,
  addPatientAllergy,
  getPatientConditions,
  addPatientCondition
} from '../controllers/patientController.js';
import { getPatientMedicalRecords, createMedicalRecord } from '../controllers/medicalRecordController.js';
import { authenticate, authorizeRoles, authorizeDoctorPatientAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPatients)
  .post(authorizeRoles('admin', 'receptionist'), createPatientAccount);

router.route('/:patientId')
  .get(authorizeDoctorPatientAccess, getPatientProfile)
  .post(updatePatientProfile);

// Nested routes for medical records
router.route('/:patientId/medical-records')
  .get(authorizeDoctorPatientAccess, getPatientMedicalRecords)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, createMedicalRecord);

// Nested routes for allergies
router.route('/:patientId/allergies')
  .get(authorizeDoctorPatientAccess, getPatientAllergies)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, addPatientAllergy);

// Nested routes for conditions
router.route('/:patientId/conditions')
  .get(authorizeDoctorPatientAccess, getPatientConditions)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, addPatientCondition);

export default router;
