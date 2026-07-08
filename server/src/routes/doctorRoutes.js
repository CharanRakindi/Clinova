import express from 'express';
import { getDoctors, getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for searching doctors
router.get('/', getDoctors);

router.use(authenticate);

router.route('/:doctorId')
  .get(getDoctorProfile)
  .post(updateDoctorProfile);

export default router;
