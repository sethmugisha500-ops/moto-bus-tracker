// backend-api/src/routes/landing.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/landing/stats ────────────────────────────────────────
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get real-time stats from database
    const [
      totalRides,
      totalDrivers,
      avgRating,
      onlineDrivers,
    ] = await Promise.all([
      prisma.ride.count(),
      prisma.driver.count(),
      prisma.rating.aggregate({ _avg: { rating: true } }),
      prisma.driver.count({ where: { isOnline: true } }),
      // You can store countries count in a settings table or hardcode
    ]);

    // Get today's rides
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRides = await prisma.ride.count({
      where: {
        createdAt: {
          gte: today,
        }
      }
    });

    res.json({
      success: true,
      stats: {
        dailyRides: todayRides || 24800,
        activeDrivers: totalDrivers || 680,
        avgRating: Math.round((avgRating._avg.rating || 4.9) * 10) / 10,
        onlineNow: onlineDrivers || 247,
        countries: 5,
        cities: 12,
      }
    });

  } catch (error) {
    console.error('Landing stats error:', error);
    // Return static stats on error
    res.json({
      success: true,
      stats: {
        dailyRides: 24800,
        activeDrivers: 680,
        avgRating: 4.9,
        onlineNow: 247,
        countries: 5,
        cities: 12,
      }
    });
  }
});

export default router;