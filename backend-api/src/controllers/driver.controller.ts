// src/controllers/driver.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export class DriverController {
  static getRideHistory(arg0: AuthRequest, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
  static getNearbyRides(arg0: AuthRequest, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
  static getEarnings(arg0: AuthRequest, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
  static updateLocation: any;
  static toggleStatus(arg0: AuthRequest, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
  static getStats(arg0: AuthRequest, res: Response<any, Record<string, any>>) {
    throw new Error('Method not implemented.');
  }
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

      // 1. Update online state and coordinates on the main Driver table
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          currentLat: lat,
          currentLng: lng,
          isOnline: isOnline !== undefined ? isOnline : driver.isOnline,
        },
      });

      // 2. Save coordinate history snapshot (with invalid fields removed)
      await prisma.driverLocation.create({
        data: {
          driverId: driver.id,
          userId,
          lat,
          lng,
          // Removed: isOnline and updatedAt to eliminate TS2353 compilation errors
        },
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
          driverId: null
        },
        include: { rider: true },
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
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      return res.json({
        success: true,
        stats: {
          rating: driver.rating,
          isOnline: driver.isOnline,
          isApproved: driver.isApproved,
          vehicle: {
            type: driver.vehicleType,
            number: driver.vehicleNumber,
            model: driver.vehicleModel,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DriverController;