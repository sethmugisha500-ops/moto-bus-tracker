import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../prisma/client';

export class RideController {
  // Basic ride controller methods
  async getRideById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id },
        include: {
          rider: true,
          driver: { include: { user: true } },
          payment: true,
          rating: true
        }
      });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }
      return res.json({ success: true, data: ride });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get ride' });
    }
  }

  async getUserRides(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const rides = await prisma.ride.findMany({
        where: { riderId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          driver: { include: { user: true } }
        }
      });
      return res.json({ success: true, data: rides });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get rides' });
    }
  }
}

export const rideController = new RideController();