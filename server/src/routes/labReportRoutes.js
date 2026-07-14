import express from 'express';
import { orderLabTest, uploadLabResult, getLabReports, getLabReportById, updateLabReportStatus } from '../controllers/labReportController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { orderLabSchema, labResultSchema } from '../validators/clinicalValidators.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .post(authorizeRoles('doctor'), validateRequest(orderLabSchema), orderLabTest)
  .get(getLabReports);

router.route('/:id')
  .get(getLabReportById);

router.route('/:id/status')
  .patch(authorizeRoles('lab_technician', 'admin', 'doctor'), updateLabReportStatus);

router.route('/:id/results')
  .patch(authorizeRoles('lab_technician', 'admin'), validateRequest(labResultSchema), uploadLabResult);

export default router;
