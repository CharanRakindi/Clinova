import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/stats').get(getDashboardStats);

export default router;
