// backend-api/src/routes/support.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// ─── POST /api/support/contact ─────────────────────────────────────
router.post('/contact', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { name, email, phone, subject, message } = req.body;

    // Here you would save to database or send email
    console.log('Support message:', { userId, name, email, phone, subject, message });

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error: any) {
    console.error('Support contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;