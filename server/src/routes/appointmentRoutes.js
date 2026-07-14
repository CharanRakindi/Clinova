import express from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from '../validators/clinicalValidators.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getAppointments)
  .post(validateRequest(createAppointmentSchema), createAppointment);

router.route('/:id/status')
  .patch(validateRequest(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
