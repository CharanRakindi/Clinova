import express from 'express';
import {
  listConversations,
  getThread,
  sendMessage,
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/conversations', listConversations);
router.get('/with/:userId', getThread);
router.post('/', sendMessage);

export default router;
