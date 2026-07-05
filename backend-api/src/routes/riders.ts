// backend-api/src/routes/riders.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import riderController, { RiderController } from '../controllers/rider.controller';

const router = Router();

// ─── Apply authentication ──────────────────────────────────────────
router.use((req: Request, res: Response, next) => {
  authenticate(req as AuthRequest, res, next);
});

// ─── Rider Routes ──────────────────────────────────────────────────
router.get('/profile', (req: Request, res: Response) => {
  riderController.getProfile(req as AuthRequest, res);
});

router.put('/profile', (req: Request, res: Response) => {
  riderController.updateProfile(req as AuthRequest, res);
});

router.get('/rides', (req: Request, res: Response) => {
  riderController.getRideHistory(req as AuthRequest, res);
});

router.get('/wallet', (req: Request, res: Response) => {
  riderController.getWallet(req as AuthRequest, res);
});

export default router;