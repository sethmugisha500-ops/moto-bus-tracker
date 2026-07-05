// backend-api/src/routes/auth.routes.ts
import express, { Request, Response } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ─── EXISTING ROUTES ──────────────────────────────────────────────
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// ✅ FIXED: Use wrapper function instead of direct authenticate
router.get('/me', (req: Request, res: Response) => {
  authenticate(req as AuthRequest, res, () => {
    authController.getCurrentUser(req as AuthRequest, res);
  });
});

// ─── NEW: Check if phone exists ──────────────────────────────────
router.post('/check-phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, phone: true, role: true }
    });

    return res.json({
      success: true,
      exists: !!user,
      user: user || null
    });

  } catch (error: any) {
    console.error('Check phone error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;