import express from 'express';
import {
  getAppointments,
  getAvailableSlots,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
} from '../validators/clinicalValidators.js';

const router = express.Router();

router.use(authenticate);

// Static path before /:id
router.get('/slots', getAvailableSlots);

router.route('/')
  .get(getAppointments)
  .post(validateRequest(createAppointmentSchema), createAppointment);

router.route('/:id/status')
  .patch(validateRequest(updateAppointmentStatusSchema), updateAppointmentStatus);

router.route('/:id/reschedule')
  .patch(validateRequest(rescheduleAppointmentSchema), rescheduleAppointment);

export default router;
