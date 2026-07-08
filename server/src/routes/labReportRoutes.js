import express from 'express';
import { orderLabTest, uploadLabResult, getLabReports, getLabReportById, updateLabReportStatus } from '../controllers/labReportController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(authorizeRoles('doctor'), orderLabTest)
  .get(getLabReports);

router.route('/:id')
  .get(getLabReportById);

router.route('/:id/status')
  .patch(authorizeRoles('lab_technician', 'admin', 'doctor'), updateLabReportStatus);

router.route('/:id/results')
  .patch(authorizeRoles('lab_technician', 'admin'), uploadLabResult);

export default router;
