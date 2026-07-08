import express from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getAppointments)
  .post(createAppointment);

router.route('/:id/status')
  .patch(updateAppointmentStatus);

export default router;
