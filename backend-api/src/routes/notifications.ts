// backend-api/src/routes/notifications.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ✅ Quick fix using as any
router.get('/', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true, notifications: [] });
});

router.put('/:id/read', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

router.put('/read-all', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

router.delete('/:id', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

router.delete('/', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Your logic here
  res.json({ success: true });
});

export default router;