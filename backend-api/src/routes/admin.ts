// backend-api/src/routes/admin.ts
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

console.log('✅ Admin routes file loaded');

// ── Helper: Check if user is Admin ──
const isAdmin = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
};

// ─── GET /api/admin/stats ──────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalUsers,
      totalDrivers,
      totalRiders,
      totalRides,
      totalRevenue,
      motoCount,
      busCount,
      minibusCount,
      pendingDrivers,
      activeDrivers,
      completedRides,
      todayRides,
      sosAlerts,
      totalRatings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.driver.count(),
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.ride.count(),
      prisma.payment.aggregate({ 
        where: { status: 'COMPLETED' },
        _sum: { amount: true } 
      }),
      prisma.driver.count({ where: { vehicleType: 'MOTO' } }),
      prisma.driver.count({ where: { vehicleType: 'BUS' } }),
      prisma.driver.count({ where: { vehicleType: 'MINIBUS' } }),
      prisma.driver.count({ where: { isApproved: false } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.ride.count({ 
        where: { 
          createdAt: { 
            gte: today,
            lt: tomorrow
          } 
        } 
      }),
      prisma.sOSAlert.count({ where: { status: 'ACTIVE' } }),
      prisma.rating.aggregate({
        _avg: { rating: true }
      })
    ]);

    const completionRate = totalRides > 0 
      ? (completedRides / totalRides) * 100 
      : 0;

    const stats = {
      totalUsers,
      totalDrivers,
      totalRiders,
      totalRides,
      totalRevenue: totalRevenue._sum.amount || 0,
      motoCount: motoCount || 0,
      busCount: busCount || 0,
      minibusCount: minibusCount || 0,
      pendingDrivers: pendingDrivers || 0,
      activeDrivers: activeDrivers || 0,
      completedRides: completedRides || 0,
      todayRides: todayRides || 0,
      sosAlerts: sosAlerts || 0,
      completionRate: Math.round(completionRate),
      averageRating: Math.round((totalRatings._avg.rating || 0) * 10) / 10
    };

    console.log('✅ Stats fetched successfully');

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// ─── GET /api/admin/drivers ────────────────────────────────────────
router.get('/drivers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('🚗 Fetching all drivers...');
    
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { approved, online, vehicleType, search, page = '1', limit = '20' } = req.query;

    const whereClause: any = {};

    if (approved !== undefined) {
      whereClause.isApproved = approved === 'true';
    }

    if (online !== undefined) {
      whereClause.isOnline = online === 'true';
    }

    if (vehicleType) {
      whereClause.vehicleType = vehicleType as string;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // ✅ CORRECT: Include user relation properly
    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take,
    });

    // ✅ Get wallet balances separately
    const driverUserIds = drivers.map(d => d.userId);
    const wallets = await prisma.wallet.findMany({
      where: {
        userId: {
          in: driverUserIds
        }
      },
      select: {
        userId: true,
        balance: true
      }
    });

    const walletMap = new Map(wallets.map(w => [w.userId, w.balance]));

    // Apply search filter if provided
    let filteredDrivers = drivers;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredDrivers = drivers.filter(driver => 
        driver.user?.name?.toLowerCase().includes(searchLower) ||
        driver.user?.phone?.includes(search as string) ||
        driver.user?.email?.toLowerCase().includes(searchLower) ||
        driver.vehicleNumber?.toLowerCase().includes(searchLower) ||
        driver.vehicleType?.toLowerCase().includes(searchLower)
      );
    }

    const total = await prisma.driver.count({
      where: whereClause
    });

    // ✅ Format drivers with user data and wallet balance
    const formattedDrivers = filteredDrivers.map(driver => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user?.name || 'Unknown',
      phone: driver.user?.phone || '',
      email: driver.user?.email || '',
      licenseNumber: driver.licenseNumber || '',
      vehicleType: driver.vehicleType || '',
      vehicleNumber: driver.vehicleNumber || '',
      vehicleModel: driver.vehicleModel || '',
      isApproved: driver.isApproved || false,
      isOnline: driver.isOnline || false,
      rating: driver.rating || 0,
      totalTrips: driver.totalTrips || 0,
      totalEarnings: driver.totalEarnings || 0,
      joinedAt: driver.createdAt?.toISOString() || new Date().toISOString(),
      isActive: driver.user?.isActive || false,
      walletBalance: walletMap.get(driver.userId) || 0,
      currentLat: driver.currentLat || null,
      currentLng: driver.currentLng || null,
    }));

    console.log(`✅ Found ${formattedDrivers.length} drivers`);

    res.status(200).json({
      success: true,
      drivers: formattedDrivers,
      count: formattedDrivers.length,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / take)
    });

  } catch (error) {
    console.error('❌ Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
});

// ─── GET /api/admin/drivers/pending ────────────────────────────────
router.get('/drivers/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('⏳ Fetching pending drivers...');
    
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const pendingDrivers = await prisma.driver.findMany({
      where: {
        isApproved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // ✅ Get wallet balances separately
    const driverUserIds = pendingDrivers.map(d => d.userId);
    const wallets = await prisma.wallet.findMany({
      where: {
        userId: {
          in: driverUserIds
        }
      },
      select: {
        userId: true,
        balance: true
      }
    });

    const walletMap = new Map(wallets.map(w => [w.userId, w.balance]));

    const formattedDrivers = pendingDrivers.map(driver => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.user?.name || 'Unknown',
      phone: driver.user?.phone || '',
      email: driver.user?.email || '',
      licenseNumber: driver.licenseNumber || '',
      vehicleType: driver.vehicleType || '',
      vehicleNumber: driver.vehicleNumber || '',
      vehicleModel: driver.vehicleModel || '',
      isApproved: driver.isApproved || false,
      isOnline: driver.isOnline || false,
      rating: driver.rating || 0,
      totalTrips: driver.totalTrips || 0,
      totalEarnings: driver.totalEarnings || 0,
      joinedAt: driver.createdAt?.toISOString() || new Date().toISOString(),
      isActive: driver.user?.isActive || false,
      walletBalance: walletMap.get(driver.userId) || 0,
    }));

    console.log(`✅ Found ${formattedDrivers.length} pending drivers`);

    res.status(200).json({
      success: true,
      drivers: formattedDrivers,
      count: formattedDrivers.length
    });

  } catch (error) {
    console.error('❌ Get pending drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending drivers'
    });
  }
});

// ─── PUT /api/admin/drivers/:driverId/approve ──────────────────────
router.put('/drivers/:driverId/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    console.log(`✅ Approving driver: ${driverId}`);
    
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        isApproved: true,
        isOnline: true,
      },
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
    });

    console.log(`✅ Driver ${driverId} approved successfully`);

    res.status(200).json({
      success: true,
      message: `Driver ${driver.user?.name || 'Unknown'} approved successfully`,
      driver: updatedDriver
    });

  } catch (error) {
    console.error('❌ Approve driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve driver'
    });
  }
});
// ─── PUT /api/admin/drivers/approve-all ──────────────────────────
router.put('/drivers/approve-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const result = await prisma.driver.updateMany({
      where: { isApproved: false },
      data: { isApproved: true },
    });

    res.json({
      success: true,
      message: `Approved ${result.count} drivers`,
      count: result.count,
    });

  } catch (error) {
    console.error('Approve all drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve drivers'
    });
  }
});

// ─── PUT /api/admin/drivers/:driverId/reject ───────────────────────
router.put('/drivers/:driverId/reject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { driverId } = req.params;
    console.log(`❌ Rejecting driver: ${driverId}`);
    
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        isApproved: false,
        isOnline: false,
      },
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
    });

    await prisma.user.update({
      where: { id: driver.userId },
      data: { isActive: false }
    });

    console.log(`❌ Driver ${driverId} rejected`);

    res.status(200).json({
      success: true,
      message: `Driver ${driver.user?.name || 'Unknown'} rejected and deactivated`,
      driver: updatedDriver
    });

  } catch (error) {
    console.error('❌ Reject driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject driver'
    });
  }
});

// ─── GET /api/admin/activity/recent ─────────────────────────────────
// backend-api/src/routes/admin.ts - Add this endpoint

// ─── GET /api/admin/users/recent ──────────────────────────────────
router.get('/users/recent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!(await isAdmin(req.user?.id || ''))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const limit = parseInt(req.query.limit as string) || 20;

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['RIDER', 'DRIVER']
        }
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
              }
            }
          }
        },
        wallet: {
          select: {
            balance: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      joinedAt: user.createdAt,
      walletBalance: user.wallet?.balance || 0,
      isApproved: user.role === 'DRIVER' ? user.driver?.isApproved || false : true,
      vehicleType: user.role === 'DRIVER' ? user.driver?.vehicleType || null : null,
      vehicleNumber: user.role === 'DRIVER' ? user.driver?.vehicleNumber || null : null,
    }));

    res.status(200).json({
      success: true,
      users: formattedUsers,
      count: formattedUsers.length,
    });

  } catch (error) {
    console.error('❌ Get recent users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

export default router;