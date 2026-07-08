import express from 'express';
import { amendMedicalRecord } from '../controllers/medicalRecordController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Note: creation and fetching by patient is handled in patientRoutes
router.route('/:id/amendments')
  .post(authorizeRoles('doctor'), amendMedicalRecord);

export default router;
