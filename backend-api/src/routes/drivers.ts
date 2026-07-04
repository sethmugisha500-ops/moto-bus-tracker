// backend-api/src/routes/drivers.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

console.log('✅ Driver routes loaded');

// ─── GET /api/drivers/stats ────────────────────────────────────────
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ✅ Get driver with user included
    const driver = await prisma.driver.findUnique({
      where: { userId },
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
        message: 'Driver profile not found' 
      });
    }

    // ✅ Get wallet separately
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      stats: {
        driverId: driver.id,
        name: driver.user?.name || 'Unknown',
        phone: driver.user?.phone || '',
        rating: driver.rating || 0,
        isOnline: driver.isOnline || false,
        isApproved: driver.isApproved || false,
        totalTrips: driver.totalTrips || 0,
        totalEarnings: driver.totalEarnings || 0,
        vehicle: {
          type: driver.vehicleType || 'N/A',
          number: driver.vehicleNumber || 'N/A',
          model: driver.vehicleModel || 'N/A',
        },
        walletBalance: wallet?.balance || 0,
      }
    });

  } catch (error: any) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ─── PUT /api/drivers/status ──────────────────────────────────────
router.put('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { isOnline } = req.body;

    console.log(`📡 Toggling driver status to: ${isOnline}`);

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isOnline must be a boolean' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    if (!driver.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account not approved. Please wait for admin approval.' 
      });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline }
    });

    // Broadcast status change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('driver-status-change', {
        driverId: driver.id,
        isOnline,
        name: req.user?.name || 'Driver',
      });
      console.log(`📢 Driver ${driver.id} is now ${isOnline ? 'online' : 'offline'}`);
    }

    res.json({
      success: true,
      message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
      data: { isOnline: updatedDriver.isOnline }
    });

  } catch (error: any) {
    console.error('❌ Update status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── POST /api/drivers/location ───────────────────────────────────
router.post('/location', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { lat, lng, isOnline } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        isOnline: isOnline !== undefined ? isOnline : driver.isOnline,
      }
    });

    // Save location history
    await prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        userId: userId,
        lat: lat,
        lng: lng,
      }
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        lat: updatedDriver.currentLat,
        lng: updatedDriver.currentLng,
        isOnline: updatedDriver.isOnline
      }
    });

  } catch (error: any) {
    console.error('❌ Update location error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/drivers/earnings ─────────────────────────────────────
router.get('/earnings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRides = await prisma.ride.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: {
          gte: today,
          lt: tomorrow,
        }
      }
    });

    const todayAmount = todayRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekRides = await prisma.ride.findMany({
      where: {
        driverId: driver.id,
        status: 'COMPLETED',
        completedAt: {
          gte: weekStart,
        }
      }
    });

    const weekAmount = weekRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

    res.json({
      success: true,
      earnings: {
        today: {
          amount: todayAmount,
          trips: todayRides.length,
        },
        week: {
          amount: weekAmount,
          trips: weekRides.length,
        },
        month: {
          amount: driver.totalEarnings || 0,
          trips: driver.totalTrips || 0,
        },
        total: {
          amount: driver.totalEarnings || 0,
          trips: driver.totalTrips || 0,
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Get earnings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/drivers/nearby-rides ────────────────────────────────
router.get('/nearby-rides', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    if (!driver.isOnline || !driver.isApproved) {
      return res.json({ success: true, rides: [] });
    }

    const radius = 0.05;
    const nearbyRides = await prisma.ride.findMany({
      where: {
        status: 'PENDING',
        driverId: null,
        pickupLat: {
          gte: (driver.currentLat || 0) - radius,
          lte: (driver.currentLat || 0) + radius,
        },
        pickupLng: {
          gte: (driver.currentLng || 0) - radius,
          lte: (driver.currentLng || 0) + radius,
        }
      },
      include: {
        rider: {
          select: {
            name: true,
            phone: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const formattedRides = nearbyRides.map((ride: any) => ({
      id: ride.id,
      riderName: ride.rider?.name || 'Rider',
      riderPhone: ride.rider?.phone || '',
      pickupAddress: ride.pickupAddress || 'Unknown location',
      dropoffAddress: ride.dropoffAddress || 'Unknown destination',
      fare: ride.fare || 0,
      distance: ride.distance ? `${ride.distance.toFixed(1)} km` : '0 km',
      status: ride.status,
      pickupLat: ride.pickupLat,
      pickupLng: ride.pickupLng,
      dropoffLat: ride.dropoffLat,
      dropoffLng: ride.dropoffLng,
      createdAt: ride.createdAt,
    }));

    res.json({
      success: true,
      rides: formattedRides,
      count: formattedRides.length
    });

  } catch (error: unknown) {
    console.error('❌ Get nearby rides error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message });
  }
});

export default router;