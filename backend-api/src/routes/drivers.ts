// backend-api/src/routes/drivers.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import driverController, { DriverController } from '../controllers/driver.controller';

const router = Router();

// ─── Apply authentication ──────────────────────────────────────────
router.use((req: Request, res: Response, next) => {
  authenticate(req as AuthRequest, res, next);
});

// ─── Driver Routes ──────────────────────────────────────────────────
router.get('/stats', (req: Request, res: Response) => {
  driverController.getStats(req as AuthRequest, res);
});

router.put('/status', (req: Request, res: Response) => {
  driverController.toggleStatus(req as AuthRequest, res);
});

router.post('/location', (req: Request, res: Response) => {
  driverController.updateLocation(req as AuthRequest, res);
});

router.get('/earnings', (req: Request, res: Response) => {
  driverController.getEarnings(req as AuthRequest, res);
});

router.get('/nearby-rides', (req: Request, res: Response) => {
  driverController.getNearbyRides(req as AuthRequest, res);
});

router.get('/ride-history', (req: Request, res: Response) => {
  driverController.getRideHistory(req as AuthRequest, res);
});

export default router;