// backend-api/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Get Admin Stats ────────────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // ─── Get all stats ──────────────────────────────────────────────
    const [totalUsers, totalDrivers, totalRides, pendingDrivers, todayRides] = await Promise.all([
      prisma.user.count(),
      prisma.driver.count(),
      prisma.ride.count(),
      prisma.driver.count({ where: { isApproved: false } }),
      prisma.ride.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // ─── Get active drivers ──────────────────────────────────────────
    const activeDrivers = await prisma.driver.count({
      where: { isOnline: true }
    });

    // ─── Get today's revenue ──────────────────────────────────────────
    const todayRevenue = await prisma.ride.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      },
      _sum: { fare: true }
    });

    // ─── Get average rating ──────────────────────────────────────────
    const avgRating = await prisma.driver.aggregate({
      _avg: { rating: true }
    });

    // ─── Get recent rides ─────────────────────────────────────────────
    const recentRides = await prisma.ride.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        rider: { select: { name: true, phone: true } },
        driver: { include: { user: { select: { name: true } } } }
      }
    });

    // ─── Get vehicle types breakdown ──────────────────────────────────
    const vehicleTypes = await prisma.driver.groupBy({
      by: ['vehicleType'],
      _count: true
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDrivers,
          totalRides,
          pendingDrivers,
          activeDrivers,
          todayRides,
          todayRevenue: todayRevenue._sum.fare || 0,
          avgRating: avgRating._avg.rating || 0,
        },
        recentRides,
        vehicleTypes: vehicleTypes.map(v => ({
          type: v.vehicleType,
          count: v._count
        }))
      }
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Get All Users ──────────────────────────────────────────────────
router.get('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        createdAt: true,
        isVerified: true,
        driver: {
          select: {
            id: true,
            isOnline: true,
            isApproved: true,
            vehicleType: true,
            vehicleNumber: true,
            rating: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Get All Drivers ──────────────────────────────────────────────────
router.get('/drivers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const drivers = await prisma.driver.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: drivers
    });

  } catch (error: any) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Get Pending Drivers ─────────────────────────────────────────────
router.get('/drivers/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const pendingDrivers = await prisma.driver.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: pendingDrivers
    });

  } catch (error: any) {
    console.error('Get pending drivers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Approve Driver ──────────────────────────────────────────────────
router.put('/drivers/:id/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { isApproved: true }
    });

    res.json({
      success: true,
      message: 'Driver approved successfully',
      data: driver
    });

  } catch (error: any) {
    console.error('Approve driver error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── Get All Rides ──────────────────────────────────────────────────
router.get('/rides', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const rides = await prisma.ride.findMany({
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: rides
    });

  } catch (error: any) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;