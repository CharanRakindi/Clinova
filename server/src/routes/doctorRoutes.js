import express from 'express';
import { getDoctors, getDoctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public directory (limited fields) — staff cookies get fuller contact info
router.get('/', optionalAuthenticate, getDoctors);

// Get all departments
router.get('/departments', async (req, res, next) => {
  try {
    const Department = (await import('../models/Department.js')).default;
    const depts = await Department.find({});
    res.json({ success: true, data: depts });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

router.route('/:doctorId')
  .get(getDoctorProfile)
  .post(updateDoctorProfile);

export default router;
