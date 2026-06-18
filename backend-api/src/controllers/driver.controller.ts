import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export class DriverController {
  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, isOnline } = req.body;
      const userId = req.user!.id;

      const driver = await prisma.driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          currentLat: lat,
          currentLng: lng,
          isOnline: isOnline !== undefined ? isOnline : driver.isOnline,
          isAvailable: isOnline !== undefined ? isOnline : driver.isAvailable,
        },
      });

      // Save to driver location history
      await prisma.driverLocation.upsert({
        where: { driverId: driver.id },
        update: { lat, lng, isActive: isOnline !== undefined ? isOnline : true, updatedAt: new Date() },
        create: { driverId: driver.id, lat, lng, isActive: true },
      });

      res.json({ success: true, message: 'Location updated' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getNearbyRides(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const driver = await prisma.driver.findUnique({
        where: { userId },
      });

      if (!driver || !driver.currentLat || !driver.currentLng) {
        return res.json({ success: true, rides: [] });
      }

      const rides = await prisma.ride.findMany({
        where: {
          status: 'PENDING',
          pickupLat: { gte: driver.currentLat - 0.05, lte: driver.currentLat + 0.05 },
          pickupLng: { gte: driver.currentLng - 0.05, lte: driver.currentLng + 0.05 },
        },
        include: {
          rider: { include: { user: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      res.json({ success: true, rides });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDriverStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const driver = await prisma.driver.findUnique({
        where: { userId },
        include: { vehicle: true },
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      res.json({
        success: true,
        stats: {
          rating: driver.rating,
          totalRides: driver.totalRides,
          totalEarnings: driver.totalEarnings,
          isOnline: driver.isOnline,
          isApproved: driver.isApproved,
          vehicle: driver.vehicle,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DriverController;