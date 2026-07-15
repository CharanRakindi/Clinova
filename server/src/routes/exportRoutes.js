import express from 'express';
import { exportMyData } from '../controllers/exportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/me', exportMyData);

export default router;
