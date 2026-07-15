import express from 'express';
import { getDashboardStats, getActivityFeed } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/stats').get(getDashboardStats);
router.route('/activity').get(getActivityFeed);

export default router;
