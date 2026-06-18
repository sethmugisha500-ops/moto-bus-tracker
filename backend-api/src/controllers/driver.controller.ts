import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../prisma/client';

export class DriverController {
  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, isOnline } = req.body;
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

      // Update driver location
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          currentLat: lat,
          currentLng: lng,
          isOnline: isOnline !== undefined ? isOnline : driver.isOnline
        }
      });

      // Create driver location record
      await prisma.driverLocation.create({
        data: {
          driverId: driver.id,
          userId: userId,
          lat: lat,
          lng: lng
        }
      });

      return res.json({ success: true, message: 'Location updated' });
    } catch (error) {
      console.error('Update location error:', error);
      return res.status(500).json({ success: false, message: 'Failed to update location' });
    }
  }

  async getNearbyRides(req: AuthRequest, res: Response) {
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

      const rides = await prisma.ride.findMany({
        where: {
          status: 'PENDING',
          driverId: null
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });

      return res.json({ success: true, rides });
    } catch (error) {
      console.error('Get nearby rides error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get rides' });
    }
  }

  async getDriverStats(req: AuthRequest, res: Response) {
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

      const rides = await prisma.ride.findMany({
        where: { driverId: driver.id }
      });

      const stats = {
        totalTrips: driver.totalTrips,
        totalEarnings: driver.totalEarnings,
        rating: driver.rating,
        completedRides: rides.filter(r => r.status === 'COMPLETED').length,
        cancelledRides: rides.filter(r => r.status === 'CANCELLED').length,
        activeRides: rides.filter(r => r.status === 'STARTED' || r.status === 'ACCEPTED').length
      };

      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Get driver stats error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
  }
}

export const driverController = new DriverController();