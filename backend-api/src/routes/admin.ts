// backend-api/src/routes/admin.ts
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, VehicleType, RideStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Helper: Check Admin ──────────────────────────────────────────
const isAdmin = async (req: Request): Promise<boolean> => {
  const userId = (req as any).user?.id;
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
};

// ─── Helper: Get Vehicle Type Enum ──────────────────────────────────
const getVehicleType = (type: string): VehicleType | undefined => {
  const upperType = type.toUpperCase();
  if (upperType === 'MOTO') return VehicleType.MOTO;
  if (upperType === 'BUS') return VehicleType.BUS;
  if (upperType === 'MINIBUS') return VehicleType.MINIBUS;
  return undefined;
};

// ─── Apply authentication ────────────────────────────────────────────
router.use((req: Request, res: Response, next) => {
  authenticate(req as AuthRequest, res, next);
});

// ──────────────────────────────────────────────────────────────────────
// ─── STATS ────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const [
      totalUsers,
      totalDrivers,
      totalRides,
      pendingDrivers,
      todayRides,
      activeDrivers,
      todayRevenue,
      avgRating,
      completedRides,
      totalRevenue,
      sosAlerts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.driver.count(),
      prisma.ride.count(),
      prisma.driver.count({ where: { isApproved: false } }),
      prisma.ride.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.driver.count({ where: { isOnline: true, isApproved: true } }),
      prisma.ride.aggregate({
        where: {
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        },
        _sum: { fare: true }
      }),
      prisma.driver.aggregate({ _avg: { rating: true } }),
      prisma.ride.count({ where: { status: 'COMPLETED' as RideStatus } }),
      prisma.ride.aggregate({
        where: { status: 'COMPLETED' as RideStatus },
        _sum: { fare: true }
      }),
      prisma.sOSAlert.count({ where: { status: 'ACTIVE' } })
    ]);

    const vehicleCounts = await prisma.driver.groupBy({
      by: ['vehicleType'],
      _count: true,
      where: { isApproved: true }
    });

    const motoCount = vehicleCounts.find(v => v.vehicleType === VehicleType.MOTO)?._count || 0;
    const busCount = vehicleCounts.find(v => v.vehicleType === VehicleType.BUS)?._count || 0;
    const minibusCount = vehicleCounts.find(v => v.vehicleType === VehicleType.MINIBUS)?._count || 0;

    const completionRate = totalRides > 0 ? (completedRides / totalRides) * 100 : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalDrivers,
        totalRiders: totalUsers - totalDrivers,
        totalRides,
        totalRevenue: totalRevenue._sum?.fare || 0,
        motoCount,
        busCount,
        minibusCount,
        pendingDrivers,
        activeDrivers,
        completedRides,
        todayRides,
        sosAlerts: sosAlerts || 0,
        completionRate,
        avgRating: avgRating._avg?.rating || 0,
      }
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────
// ─── DRIVER MANAGEMENT ──────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

router.get('/drivers', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { search, type, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { phone: { contains: search as string, mode: 'insensitive' } } },
        { vehicleNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (type && type !== 'all') {
      const vehicleType = getVehicleType(type as string);
      if (vehicleType) where.vehicleType = vehicleType;
    }
    
    if (status === 'pending') {
      where.isApproved = false;
    } else if (status === 'approved') {
      where.isApproved = true;
    }

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          }
        }
      }),
      prisma.driver.count({ where })
    ]);

    const formattedDrivers = drivers.map((driver: any) => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user?.name || 'N/A',
      phone: driver.user?.phone || 'N/A',
      email: driver.user?.email || '',
      licenseNumber: driver.licenseNumber || 'N/A',
      vehicleType: driver.vehicleType || 'MOTO',
      vehicleNumber: driver.vehicleNumber || 'N/A',
      vehicleModel: driver.vehicleModel || 'N/A',
      isApproved: driver.isApproved,
      isOnline: driver.isOnline,
      rating: driver.rating || 0,
      totalTrips: driver.totalTrips || 0,
      totalEarnings: driver.totalEarnings || 0,
      joinedAt: driver.createdAt,
    }));

    const stats = {
      total: await prisma.driver.count(),
      pending: await prisma.driver.count({ where: { isApproved: false } }),
      approved: await prisma.driver.count({ where: { isApproved: true } }),
      online: await prisma.driver.count({ where: { isOnline: true } }),
    };

    res.json({
      success: true,
      data: formattedDrivers,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error: any) {
    console.error('Get drivers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/drivers/pending', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
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

    const formattedDrivers = pendingDrivers.map((driver: any) => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user?.name || 'N/A',
      phone: driver.user?.phone || 'N/A',
      email: driver.user?.email || '',
      licenseNumber: driver.licenseNumber || 'N/A',
      vehicleType: driver.vehicleType || 'MOTO',
      vehicleNumber: driver.vehicleNumber || 'N/A',
      vehicleModel: driver.vehicleModel || 'N/A',
      isApproved: driver.isApproved,
      isOnline: driver.isOnline,
      rating: driver.rating || 0,
      totalTrips: driver.totalTrips || 0,
      totalEarnings: driver.totalEarnings || 0,
      joinedAt: driver.createdAt,
    }));

    res.json({
      success: true,
      drivers: formattedDrivers,
      total: formattedDrivers.length
    });
  } catch (error: any) {
    console.error('Get pending drivers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;

    const driver = await prisma.driver.update({
      where: { id },
      data: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    // Create wallet if not exists - remove 'currency' field
    await prisma.wallet.upsert({
      where: { userId: driver.userId },
      update: {},
      create: {
        userId: driver.userId,
        balance: 0,
      }
    });

    res.json({
      success: true,
      message: 'Driver approved successfully',
      driver: {
        id: driver.id,
        user: {
          name: driver.user?.name,
          phone: driver.user?.phone,
        }
      }
    });
  } catch (error: any) {
    console.error('Approve driver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/drivers/:id/reject', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;

    const driver = await prisma.driver.update({
      where: { id },
      data: { isApproved: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Driver rejected',
      driver: {
        id: driver.id,
        user: {
          name: driver.user?.name,
          phone: driver.user?.phone,
        }
      }
    });
  } catch (error: any) {
    console.error('Reject driver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/admin/drivers/:id/approve (legacy) ────────────────────
router.put('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { id } = req.params;

    const driver = await prisma.driver.update({
      where: { id },
      data: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Driver approved successfully',
      data: driver
    });
  } catch (error: any) {
    console.error('Approve driver error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────
// ─── USER MANAGEMENT ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

// ─── GET /api/admin/users ──────────────────────────────────────────
router.get('/users', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
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
            rating: true,
            totalTrips: true,
            totalEarnings: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/admin/users ──────────────────────────────────────────
router.post('/users', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required' });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        password: hashedPassword,
        role: role || 'RIDER',
        isVerified: true,
      }
    });

    if (role === 'DRIVER' || role === 'ADMIN') {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: `LIC-${Date.now()}`,
          vehicleType: 'MOTO' as VehicleType,
          vehicleNumber: 'N/A',
          vehicleModel: 'N/A',
          isApproved: role === 'ADMIN',
          isOnline: false,
        }
      });
    }

    // Remove 'currency' field
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      }
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────
// ─── EARNINGS ────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

router.get('/earnings', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(today);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [todayEarnings, weekEarnings, monthEarnings, totalEarnings] = await Promise.all([
      prisma.ride.aggregate({
        where: {
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: today }
        },
        _sum: { fare: true }
      }),
      prisma.ride.aggregate({
        where: {
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: weekStart }
        },
        _sum: { fare: true }
      }),
      prisma.ride.aggregate({
        where: {
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: monthStart }
        },
        _sum: { fare: true }
      }),
      prisma.ride.aggregate({
        where: { status: 'COMPLETED' as RideStatus },
        _sum: { fare: true }
      })
    ]);

    const todayCount = await prisma.ride.count({
      where: {
        status: 'COMPLETED' as RideStatus,
        completedAt: { gte: today }
      }
    });

    res.json({
      success: true,
      data: {
        today: todayEarnings._sum?.fare || 0,
        todayCount,
        week: weekEarnings._sum?.fare || 0,
        month: monthEarnings._sum?.fare || 0,
        total: totalEarnings._sum?.fare || 0,
      }
    });
  } catch (error: any) {
    console.error('Get earnings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;