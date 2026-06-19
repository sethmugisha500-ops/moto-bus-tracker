import { Request, Response } from 'express';
import { RideService } from '../services/ride.service';
import { LocationService } from '../services/location.service';
import prisma from '../config/database';
import { VehicleType } from '@prisma/client';
const rideService = new RideService();
const locationService = new LocationService();

export class RiderController {
  async requestRide(req: Request, res: Response) {
    try {
      const riderId = req.user!.id;
      const rideData = req.body;

      const ride = await rideService.requestRide(riderId, rideData);

      return res.json({ success: true, ride });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getNearbyDrivers(req: Request, res: Response) {
    try {
      const { lat, lng, vehicleType } = req.query;

      if (!lat || !lng) {
        return res.json({ success: true, drivers: [] });
      }

      const drivers = await prisma.driver.findMany({
        where: {
          isOnline: true,
          isApproved: true,
          currentLat: { gte: Number(lat) - 0.05, lte: Number(lat) + 0.05 },
          currentLng: { gte: Number(lng) - 0.05, lte: Number(lng) + 0.05 },
          ...(vehicleType ? { vehicleType: (vehicleType as string) as VehicleType } : {}),
        },
        include: {
          user: true,
        },
        take: 20,
      });

      const formattedDrivers = drivers.map(driver => ({
        id: driver.id,
        name: (driver as any).user?.name || '',
        vehicleNumber: driver.vehicleNumber || '',
        rating: driver.rating,
        distance: '500m',
        eta: '3 min',
      }));

      return res.json({ success: true, drivers: formattedDrivers });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRideHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [rides, total] = await Promise.all([
        prisma.ride.findMany({
          where: { riderId: userId },
          include: {
            driver: { include: {} },
            rating: true,
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.ride.count({ where: { riderId: userId } }),
      ]);

      return res.json({
        success: true,
        rides,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRideDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const ride = await prisma.ride.findFirst({
        where: { id, riderId: userId },
        include: {
          driver: { include: {} },
          locations: { orderBy: { timestamp: 'asc' } },
          payment: true,
          rating: true,
        },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      return res.json({ success: true, ride });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async rateRide(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user!.id;

      const ride = await prisma.ride.findFirst({
        where: { id: id, riderId: userId, status: 'COMPLETED' },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found or not completed' });
      }

      const existingRating = await prisma.rating.findUnique({
        where: { id },
      });

      if (existingRating) {
        return res.status(400).json({ success: false, message: 'Already rated' });
      }

      const newRating = await prisma.rating.create({
        data: {
          rideId: ride.id, // Fixed: Added mandatory schema relation property link
          riderId: userId, // Fixed: Stripped duplicate, broken riderId references
          driverId: ride.driverId!,
          rating: Number(rating), 
          comment: comment || '',
        },
      });

      // Update driver rating
      const driverRatings = await prisma.rating.aggregate({
        where: { driverId: ride.driverId! },
        _avg: { rating: true },
      });

      await prisma.driver.update({
        where: { id: ride.driverId! },
        data: { rating: driverRatings._avg.rating || 0 },
      });

      return res.json({ success: true, rating: newRating });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}