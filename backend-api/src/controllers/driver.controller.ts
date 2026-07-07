// backend-api/src/controllers/driver.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, RideStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class DriverController {
  
  // ─── GET /drivers/stats ────────────────────────────────────────────
  async getStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const driver = await prisma.driver.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      return res.json({
        success: true,
        stats: {
          driverId: driver.id,
          name: driver.user?.name || 'Driver',
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
          }
        }
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── PUT /drivers/status ────────────────────────────────────────────
  async toggleStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { isOnline } = req.body;

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
      }

      return res.json({
        success: true,
        message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
        data: { isOnline: updatedDriver.isOnline }
      });
    } catch (error: any) {
      console.error('Toggle status error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── POST /drivers/location ─────────────────────────────────────────
  async updateLocation(req: AuthRequest, res: Response) {
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

      return res.json({
        success: true,
        message: 'Location updated successfully',
        data: {
          lat: updatedDriver.currentLat,
          lng: updatedDriver.currentLng,
          isOnline: updatedDriver.isOnline
        }
      });
    } catch (error: any) {
      console.error('Update location error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── GET /drivers/earnings ──────────────────────────────────────────
  async getEarnings(req: AuthRequest, res: Response) {
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
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(today);
      monthStart.setMonth(monthStart.getMonth() - 1);

      const [todayRides, weekRides, monthRides] = await Promise.all([
        prisma.ride.findMany({
          where: {
            driverId: driver.id,
            status: 'COMPLETED' as RideStatus,
            completedAt: { gte: today }
          }
        }),
        prisma.ride.findMany({
          where: {
            driverId: driver.id,
            status: 'COMPLETED' as RideStatus,
            completedAt: { gte: weekStart }
          }
        }),
        prisma.ride.findMany({
          where: {
            driverId: driver.id,
            status: 'COMPLETED' as RideStatus,
            completedAt: { gte: monthStart }
          }
        })
      ]);

      const todayAmount = todayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
      const weekAmount = weekRides.reduce((sum, r) => sum + (r.fare || 0), 0);
      const monthAmount = monthRides.reduce((sum, r) => sum + (r.fare || 0), 0);

      return res.json({
        success: true,
        earnings: {
          today: { amount: todayAmount, trips: todayRides.length },
          week: { amount: weekAmount, trips: weekRides.length },
          month: { amount: monthAmount, trips: monthRides.length },
          total: { amount: driver.totalEarnings || 0, trips: driver.totalTrips || 0 }
        }
      });
    } catch (error: any) {
      console.error('Get earnings error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── GET /drivers/nearby-rides ──────────────────────────────────────
  async getNearbyRides(req: AuthRequest, res: Response) {
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

      // Get nearby pending rides within radius
      const radius = 0.05; // ~5km
      const nearbyRides = await prisma.ride.findMany({
        where: {
          status: 'PENDING' as RideStatus,
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

      return res.json({
        success: true,
        rides: formattedRides,
        count: formattedRides.length
      });
    } catch (error: any) {
      console.error('Get nearby rides error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── GET /drivers/ride-history ──────────────────────────────────────
  async getRideHistory(req: AuthRequest, res: Response) {
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

      const { limit = 20, offset = 0, status } = req.query;

      const where: any = { driverId: driver.id };
      if (status && status !== 'all') {
        where.status = status as RideStatus;
      }

      const [rides, total] = await Promise.all([
        prisma.ride.findMany({
          where,
          include: {
            rider: {
              select: {
                name: true,
                phone: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset),
        }),
        prisma.ride.count({ where })
      ]);

      return res.json({
        success: true,
        data: rides,
        total,
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error: any) {
      console.error('Get ride history error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

const driverController = new DriverController();
export { driverController };
export default driverController;