import { RideStatus } from '@prisma/client';
import { Router } from 'express';
import rideController from '../controllers/ride.controller';
import { authenticate } from '../middleware/auth.middleware';
import paymentRoutes from '../routes/payment.routes';

const router = Router();
// rideController is exported as an instance from the controller file

router.post('/', authenticate, rideController.requestRide.bind(rideController));
router.get('/:id', authenticate, rideController.getRides.bind(rideController));
router.put('/:id/status', authenticate, rideController.updateRideStatus.bind(rideController));
router.post('/:id/cancel', authenticate, rideController.cancelRide.bind(rideController));
router.post('/:id/sos', authenticate, rideController.activateSOS.bind(rideController));
router.get('/rider/history', authenticate, rideController.getRiderHistory.bind(rideController));
router.get('/driver/history', authenticate, rideController.getRiderHistory.bind(rideController));

export default router;