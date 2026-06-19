// src/routes/users.ts
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current authenticated user profile details
 * @access  Private
 */
router.get('/profile', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        driver: true, // Includes driver profiles dynamically if available
        wallet: {
          select: {
            id: true,
            balance: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile data
 * @access  Private
 */
router.put('/profile', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/users/wallet
 * @desc    Get authenticated user's digital wallet snapshot details
 * @access  Private
 */
router.get('/wallet', authenticate as any, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    // Lazy initialization: if a wallet doesn't exist yet for some reason, create it here safely
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    return res.json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;