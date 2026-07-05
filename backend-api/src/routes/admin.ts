// backend-api/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { adminController } from '../controllers/admin.controller';

const router = Router();

// ─── Apply authentication and admin authorization ──────────────────
router.use((req: Request, res: Response, next) => {
  authenticate(req as AuthRequest, res, next);
});

// ─── Admin Routes ──────────────────────────────────────────────────
router.get('/dashboard', (req: Request, res: Response) => {
  adminController.getDashboardStats(req as AuthRequest, res);
});

router.get('/users', (req: Request, res: Response) => {
  adminController.getAllUsers(req as AuthRequest, res);
});

router.get('/users/:id', (req: Request, res: Response) => {
  adminController.getUserById(req as AuthRequest, res);
});

router.put('/users/:id', (req: Request, res: Response) => {
  adminController.updateUser(req as AuthRequest, res);
});

router.delete('/users/:id', (req: Request, res: Response) => {
  adminController.deleteUser(req as AuthRequest, res);
});

router.get('/drivers', (req: Request, res: Response) => {
  adminController.getAllDrivers(req as AuthRequest, res);
});

router.put('/drivers/:id/approve', (req: Request, res: Response) => {
  adminController.approveDriver(req as AuthRequest, res);
});

router.get('/rides', (req: Request, res: Response) => {
  adminController.getAllRides(req as AuthRequest, res);
});

router.get('/earnings', (req: Request, res: Response) => {
  adminController.getEarningsStats(req as AuthRequest, res);
});

export default router;