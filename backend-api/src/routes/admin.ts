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

// ──────────────────────────────────────────────────────────────────────
// ─── REPORTS ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────

// ─── GET /api/admin/reports ──────────────────────────────────────────
router.get('/reports', async (req: Request, res: Response) => {
  try {
    if (!await isAdmin(req)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { period = 'week', vehicleType = 'all', startDate, endDate } = req.query;

    // Calculate date range
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      switch (period) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          end = new Date();
          break;
        case 'week':
          start.setDate(now.getDate() - 7);
          end = new Date();
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          end = new Date();
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          end = new Date();
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          end = new Date();
          break;
        default:
          start.setDate(now.getDate() - 7);
          end = new Date();
      }
    }

    // Build where clause for completed rides
    const rideWhereClause: any = {
      status: 'COMPLETED' as RideStatus,
      completedAt: { gte: start, lte: end }
    };

    // Vehicle type filter - get driver IDs with this vehicle type
    if (vehicleType !== 'all') {
      const vehicleTypeEnum = getVehicleType(vehicleType as string);
      if (vehicleTypeEnum) {
        const drivers = await prisma.driver.findMany({
          where: { vehicleType: vehicleTypeEnum },
          select: { id: true }
        });
        const driverIds = drivers.map(d => d.id);
        if (driverIds.length > 0) {
          rideWhereClause.driverId = { in: driverIds };
        } else {
          // No drivers of this type, return empty data
          return res.json({
            success: true,
            stats: {
              totalTrips: 0,
              totalRevenue: 0,
              averageRating: 0,
              completionRate: 0,
              activeDrivers: 0,
              totalVehicles: 0,
              pendingRides: 0,
              totalUsers: 0,
              tripsGrowth: 0,
              revenueGrowth: 0,
            },
            chartData: [],
            distribution: [],
            topDrivers: [],
            ratings: [
              { rating: 5, count: 0, percentage: 0 },
              { rating: 4, count: 0, percentage: 0 },
              { rating: 3, count: 0, percentage: 0 },
              { rating: 2, count: 0, percentage: 0 },
              { rating: 1, count: 0, percentage: 0 },
            ],
          });
        }
      }
    }

    // ─── Get Stats ──────────────────────────────────────────────────
    const [
      totalTrips,
      totalRevenue,
      avgRatingResult,
      completedRidesCount,
      activeDriversCount,
      totalVehiclesCount,
      pendingRidesCount,
      totalUsersCount
    ] = await Promise.all([
      prisma.ride.count({ where: rideWhereClause }),
      prisma.ride.aggregate({
        where: rideWhereClause,
        _sum: { fare: true }
      }),
      // Get average rating from completed rides' drivers
      prisma.driver.aggregate({
        where: {
          isApproved: true,
          rides: {
            some: {
              status: 'COMPLETED' as RideStatus,
              completedAt: { gte: start, lte: end }
            }
          }
        },
        _avg: { rating: true }
      }),
      prisma.ride.count({
        where: {
          ...rideWhereClause,
          status: 'COMPLETED' as RideStatus
        }
      }),
      // Active drivers - drivers who completed rides in the period
      prisma.driver.count({
        where: {
          isApproved: true,
          isOnline: true,
          rides: {
            some: {
              status: 'COMPLETED' as RideStatus,
              completedAt: { gte: start, lte: end }
            }
          }
        }
      }),
      prisma.driver.count({ where: { isApproved: true } }),
      prisma.ride.count({
        where: {
          status: 'PENDING' as RideStatus,
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.user.count()
    ]);

    const totalRides = totalTrips || 0;
    const completedRides = completedRidesCount || 0;

    // ─── Get previous period for growth calculation ────────────────
    const periodDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodDuration);
    const prevEnd = new Date(start);

    const prevPeriodWhere = {
      ...rideWhereClause,
      completedAt: { gte: prevStart, lte: prevEnd }
    };
    delete prevPeriodWhere.completedAt;

    const [prevTrips, prevRevenue] = await Promise.all([
      prisma.ride.count({
        where: {
          ...prevPeriodWhere,
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: prevStart, lte: prevEnd }
        }
      }),
      prisma.ride.aggregate({
        where: {
          ...prevPeriodWhere,
          status: 'COMPLETED' as RideStatus,
          completedAt: { gte: prevStart, lte: prevEnd }
        },
        _sum: { fare: true }
      })
    ]);

    const prevTripsCount = prevTrips || 0;
    const prevRevenueAmount = prevRevenue._sum?.fare || 0;

    const tripsGrowth = prevTripsCount > 0 
      ? ((totalRides - prevTripsCount) / prevTripsCount) * 100 
      : totalRides > 0 ? 100 : 0;

    const revenueGrowth = prevRevenueAmount > 0 
      ? ((totalRevenue._sum?.fare || 0 - prevRevenueAmount) / prevRevenueAmount) * 100 
      : (totalRevenue._sum?.fare || 0) > 0 ? 100 : 0;

    const stats = {
      totalTrips: totalRides,
      totalRevenue: totalRevenue._sum?.fare || 0,
      averageRating: avgRatingResult._avg?.rating || 0,
      completionRate: totalRides > 0 ? (completedRides / totalRides) * 100 : 0,
      activeDrivers: activeDriversCount || 0,
      totalVehicles: totalVehiclesCount || 0,
      pendingRides: pendingRidesCount || 0,
      totalUsers: totalUsersCount || 0,
      tripsGrowth: Math.round(tripsGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    };

    // ─── Chart Data ──────────────────────────────────────────────────
    // Use raw SQL for date grouping
    const chartData = await prisma.$queryRaw`
      SELECT 
        DATE(completed_at) as name,
        COUNT(*)::int as trips,
        COALESCE(SUM(fare), 0) as revenue
      FROM "Ride"
      WHERE completed_at >= ${start}
        AND completed_at <= ${end}
        AND status = 'COMPLETED'
      GROUP BY DATE(completed_at)
      ORDER BY name ASC
      LIMIT 30
    `;

    // ─── Vehicle Distribution ───────────────────────────────────────
    const vehicleLabels: Record<string, string> = {
      MOTO: 'Motorcycle',
      BUS: 'Bus',
      MINIBUS: 'Minibus',
    };
    const vehicleColors: Record<string, string> = {
      MOTO: '#2563eb',
      BUS: '#10b981',
      MINIBUS: '#f59e0b',
    };
    const vehicleIcons: Record<string, string> = {
      MOTO: 'motorcycle',
      BUS: 'bus',
      MINIBUS: 'minibus',
    };

    const vehicleDist = await prisma.driver.groupBy({
      by: ['vehicleType'],
      _count: {
        id: true
      },
      where: {
        isApproved: true
      }
    });

    const distribution = vehicleDist.map((v: any) => ({
      name: vehicleLabels[v.vehicleType as keyof typeof vehicleLabels] || v.vehicleType,
      value: v._count.id,
      color: vehicleColors[v.vehicleType as keyof typeof vehicleColors] || '#888',
      icon: vehicleIcons[v.vehicleType as keyof typeof vehicleIcons] || 'vehicle',
    }));

    // ─── Top Drivers ─────────────────────────────────────────────────
    const topDrivers = await prisma.driver.findMany({
      where: {
        isApproved: true,
        rides: {
          some: {
            status: 'COMPLETED' as RideStatus,
            completedAt: { gte: start, lte: end }
          }
        }
      },
      select: {
        id: true,
        user: {
          select: { name: true, phone: true }
        },
        vehicleType: true,
        vehicleNumber: true,
        rating: true,
        rides: {
          where: {
            status: 'COMPLETED' as RideStatus,
            completedAt: { gte: start, lte: end }
          },
          select: { fare: true }
        }
      },
      orderBy: {
        rides: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const formattedTopDrivers = topDrivers.map((driver: any) => ({
      id: driver.id,
      name: driver.user?.name || 'Unknown',
      phone: driver.user?.phone || '',
      trips: driver.rides?.length || 0,
      rating: driver.rating || 0,
      earnings: driver.rides?.reduce((sum: number, r: any) => sum + (r.fare || 0), 0) || 0,
      vehicleType: driver.vehicleType,
      vehicleNumber: driver.vehicleNumber || 'N/A',
    }));

    // ─── Rating Distribution ────────────────────────────────────────
    const ratingData = await prisma.rating.groupBy({
      by: ['rating'],
      _count: true,
      where: {
        createdAt: { gte: start, lte: end }
      }
    });

    const totalRatings = ratingData.reduce((sum, r) => sum + r._count, 0);
    const ratings = ratingData.map((r: any) => ({
      rating: r.rating,
      count: r._count,
      percentage: totalRatings > 0 ? Math.round((r._count / totalRatings) * 100) : 0
    }));

    // Ensure all rating levels are present
    const ratingMap = new Map(ratings.map(r => [r.rating, r]));
    const defaultRatings = [
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 },
    ];
    const finalRatings = defaultRatings.map(r => ratingMap.get(r.rating) || r);

    res.json({
      success: true,
      stats,
      chartData: chartData || [],
      distribution,
      topDrivers: formattedTopDrivers,
      ratings: finalRatings,
    });

  } catch (error: any) {
    console.error('Reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;