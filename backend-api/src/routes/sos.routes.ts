import { Router } from 'express';
import { SOSController } from '../controllers/sos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateTriggerSOS } from '../middleware/validation';
import paymentRoutes from '../routes/payment.routes';

const router = Router();
const sosController = new SOSController();

// Public SOS route (no auth needed for emergency)
router.post('/trigger', validateTriggerSOS, sosController.triggerSOS.bind(sosController));

// Authenticated routes
router.use(authenticate);
router.put('/resolve/:id', sosController.resolveSOS.bind(sosController));
router.get('/active', sosController.getActiveSOS.bind(sosController));
router.get('/history', sosController.getUserSOSHistory.bind(sosController));

export default router;