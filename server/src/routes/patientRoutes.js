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
import {
  authenticate,
  authorizeRoles,
  authorizeDoctorPatientAccess,
  authorizePatientProfileRead,
} from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createPatientSchema } from '../validators/clinicalValidators.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(authorizeRoles('admin', 'doctor', 'receptionist'), getPatients)
  .post(
    authorizeRoles('admin', 'receptionist'),
    validateRequest(createPatientSchema),
    createPatientAccount
  );

// Profile: receptionist gets basic demographics only (controller strips PHI)
router.route('/:patientId')
  .get(authorizePatientProfileRead, getPatientProfile)
  .post(authorizeDoctorPatientAccess, updatePatientProfile);

// Clinical chart — no receptionist
router.route('/:patientId/medical-records')
  .get(authorizeDoctorPatientAccess, getPatientMedicalRecords)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, createMedicalRecord);

router.route('/:patientId/allergies')
  .get(authorizeDoctorPatientAccess, getPatientAllergies)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, addPatientAllergy);

router.route('/:patientId/conditions')
  .get(authorizeDoctorPatientAccess, getPatientConditions)
  .post(authorizeRoles('doctor'), authorizeDoctorPatientAccess, addPatientCondition);

export default router;
