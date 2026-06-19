import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import adminController from '../controllers/admin.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', adminController.getAllUsers.bind(adminController));
router.get('/:id', adminController.getUserById.bind(adminController));

export default router;
