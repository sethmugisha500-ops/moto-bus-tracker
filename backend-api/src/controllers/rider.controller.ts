import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

export class RiderController {
  // ============================================
  // REQUEST RIDE
  // ============================================
  async requestRide(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const {
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        distance,
        duration,
        fare,
        paymentMethod
      } = req.body;

      // Create ride
      const ride = await prisma.ride.create({
        data: {
          riderId: userId,
          pickupLat,
          pickupLng,
          pickupAddress,
          dropoffLat,
          dropoffLng,
          dropoffAddress,
          distance,
          duration,
          fare,
          paymentMethod,
          status: 'PENDING',
          paymentStatus: 'PENDING'
        },
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

      return res.status(201).json({ success: true, data: ride });
    } catch (error: any) {
      console.error('Request ride error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to request ride' });
    }
  }

  // ============================================
  // GET NEARBY DRIVERS
  // ============================================
  async getNearbyDrivers(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, vehicleType } = req.query;

      if (!lat || !lng) {
        return res.json({ success: true, drivers: [] });
      }

      const latNum = Number(lat);
      const lngNum = Number(lng);

      // Find nearby drivers
      const drivers = await prisma.driver.findMany({
        where: {
          isOnline: true,
          isApproved: true,
          currentLat: {
            gte: latNum - 0.05,
            lte: latNum + 0.05
          },
          currentLng: {
            gte: lngNum - 0.05,
            lte: lngNum + 0.05
          },
          ...(vehicleType ? { vehicleType: vehicleType as VehicleType } : {})
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        take: 20
      });

      // Format response
      const formattedDrivers = drivers.map((driver: any) => ({
        id: driver.id,
        name: driver.user?.name || '',
        phone: driver.user?.phone || '',
        vehicleType: driver.vehicleType,
        vehicleNumber: driver.vehicleNumber || '',
        rating: driver.rating,
        distance: '500m',
        eta: '3 min'
      }));

      return res.json({ success: true, drivers: formattedDrivers });
    } catch (error: any) {
      console.error('Get nearby drivers error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get nearby drivers' });
    }
  }

  // ============================================
  // GET RIDE HISTORY
  // ============================================
  async getRideHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [rides, total] = await Promise.all([
        prisma.ride.findMany({
          where: { riderId: userId },
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                }
              }
            },
            rating: true,
            payment: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.ride.count({ where: { riderId: userId } })
      ]);

      return res.json({
        success: true,
        data: rides,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('Get ride history error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get ride history' });
    }
  }

  // ============================================
  // GET RIDE DETAILS
  // ============================================
  async getRideDetails(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const ride = await prisma.ride.findFirst({
        where: {
          id,
          riderId: userId
        },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          locations: {
            orderBy: { timestamp: 'asc' }
          },
          payment: true,
          rating: true
        }
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      return res.json({ success: true, data: ride });
    } catch (error: any) {
      console.error('Get ride details error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get ride details' });
    }
  }

  // ============================================
  // RATE RIDE
  // ============================================
  async rateRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Check if ride exists and is completed
      const ride = await prisma.ride.findFirst({
        where: {
          id,
          riderId: userId,
          status: 'COMPLETED'
        }
      });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found or not completed'
        });
      }

      // Check if already rated
      const existingRating = await prisma.rating.findUnique({
        where: { rideId: id }
      });

      if (existingRating) {
        return res.status(400).json({
          success: false,
          message: 'Already rated'
        });
      }

      // Create rating
      const newRating = await prisma.rating.create({
        data: {
          rideId: ride.id,
          riderId: userId,
          driverId: ride.driverId!,
          rating: Number(rating),
          comment: comment || ''
        }
      });

      // Update driver's average rating
      const driverRatings = await prisma.rating.aggregate({
        where: { driverId: ride.driverId! },
        _avg: { rating: true }
      });

      await prisma.driver.update({
        where: { id: ride.driverId! },
        data: { rating: driverRatings._avg.rating || 0 }
      });

      return res.json({
        success: true,
        message: 'Rating submitted successfully',
        data: newRating
      });
    } catch (error: any) {
      console.error('Rate ride error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to rate ride' });
    }
  }

  // ============================================
  // CANCEL RIDE
  // ============================================
  async cancelRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const ride = await prisma.ride.findFirst({
        where: {
          id,
          riderId: userId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        }
      });

      if (!ride) {
        return res.status(404).json({
          success: false,
          message: 'Ride not found or cannot be cancelled'
        });
      }

      const cancelledRide = await prisma.ride.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Ride cancelled successfully',
        data: cancelledRide
      });
    } catch (error: any) {
      console.error('Cancel ride error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to cancel ride' });
    }
  }
}

export default RiderController;