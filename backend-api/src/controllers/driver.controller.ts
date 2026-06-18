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
          isOnline: isOnline !== undefined ? isOnline : driver.isOnline,
        },
      });

      // Save to driver location history
      await prisma.driverLocation.upsert({
        where: {  },
        update: { lat, lng, isOnline: isOnline !== undefined ? isOnline : true, updatedAt: new Date() },
        create: {  lat, lng, isOnline: true },
      });

      return res.json({ success: true, message: 'Location updated' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
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
          rider: true,
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      return res.json({ success: true, rides });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDriverStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const driver = await prisma.driver.findUnique({
        where: { userId },
        include: {  },
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      return res.json({
        success: true,
        stats: {
          rating: driver.rating,
          totalTrips: driver.totalTrips,
          totalEarnings: driver.totalEarnings,
          isOnline: driver.isOnline,
          isApproved: driver.isApproved,
          vehicle: driver.vehicle,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DriverController;