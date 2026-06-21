// src/routes/admin.ts
import express, { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalDrivers, totalTrips, revenueResult] = await Promise.all([
      prisma.user.count(),
      prisma.driver.count(),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        totalTrips,
        totalRevenue: revenueResult._sum.amount || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        wallet: { select: { balance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/drivers
router.get('/drivers', async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, drivers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/rides
router.get('/rides', async (req: AuthRequest, res: Response) => {
  try {
    const rides = await prisma.ride.findMany({
      include: {
        rider: { select: { id: true, name: true, phone: true } },
        driver: {
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // cap it so this doesn't blow up once you have real volume
    });

    res.json({ success: true, rides });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;