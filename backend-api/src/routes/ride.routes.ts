// src/routes/ride.routes.ts
import { Router } from 'express';
import { rideController } from '../controllers/ride.controller'; // Fixed: Named import
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Using 'as any' bypasses the strict Request vs AuthRequest structure mismatch
router.post('/', authenticate as any, rideController.requestRide.bind(rideController));
router.get('/:id', authenticate as any, rideController.getRideById.bind(rideController));
router.put('/:id/status', authenticate as any, rideController.updateRideStatus.bind(rideController));
router.post('/:id/cancel', authenticate as any, rideController.cancelRide.bind(rideController));
router.post('/:id/sos', authenticate as any, rideController.activateSOS.bind(rideController));
router.get('/rider/history', authenticate as any, rideController.getRiderHistory.bind(rideController));
router.get('/driver/history', authenticate as any, rideController.getDriverRides.bind(rideController));

export default router;