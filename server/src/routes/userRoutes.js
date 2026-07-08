import express from 'express';
import { getUsers, getUserById, updateUserStatus } from '../controllers/userController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('admin'));

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById);

router.route('/:id/status')
  .patch(updateUserStatus);

export default router;
