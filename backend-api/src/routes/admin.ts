// src/routes/admin.ts
import express, { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
// import { adminController } from '../controllers/admin.controller';

const router = express.Router();

// Admin routes
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: 'Admin stats endpoint' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: 'All users endpoint' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/drivers', async (req: AuthRequest, res: Response) => {
  try {
    res.json({ success: true, message: 'All drivers endpoint' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;