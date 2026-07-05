// backend-api/src/routes/support.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ✅ Quick fix using as any
router.post('/contact', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

router.get('/tickets', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true, tickets: [] });
});

router.post('/tickets', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

export default router;