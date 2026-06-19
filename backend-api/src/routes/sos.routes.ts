// src/routes/sos.routes.ts
import { Router } from 'express';
import { SOSController } from '../controllers/sos.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateTriggerSOS } from '../middleware/validation';

const router = Router();
const sosController = new SOSController();

// Public SOS route (no auth needed for emergency)
router.post('/trigger', validateTriggerSOS, sosController.triggerSOS.bind(sosController));

// Authenticated routes - explicitly injected to satisfy TypeScript overloads
router.put('/resolve/:id', authenticate as any, sosController.resolveSOS.bind(sosController));
router.get('/active', authenticate as any, sosController.getActiveSOS.bind(sosController));
router.get('/history', authenticate as any, sosController.getUserSOSHistory.bind(sosController));

export default router;