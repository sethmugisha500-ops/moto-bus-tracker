// backend-api/src/routes/users.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// ─── ✅ FIXED: Use wrapper functions ──────────────────────────────

// Apply authentication middleware
router.use((req: Request, res: Response, next) => {
  authenticate(req as AuthRequest, res, next);
});

// Apply admin authorization
router.use((req: Request, res: Response, next) => {
  authorize('ADMIN')(req as AuthRequest, res, next);
});

// ─── Routes ──────────────────────────────────────────────────────────
router.get('/', (req: Request, res: Response) => {
  adminController.getAllUsers(req as AuthRequest, res);
});

router.get('/:id', (req: Request, res: Response) => {
  adminController.getUserById(req as AuthRequest, res);
});

router.put('/:id', (req: Request, res: Response) => {
  adminController.updateUser(req as AuthRequest, res);
});

router.delete('/:id', (req: Request, res: Response) => {
  adminController.deleteUser(req as AuthRequest, res);
});

export default router;