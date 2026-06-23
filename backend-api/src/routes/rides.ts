// backend-api/src/routes/rides.ts
import express, { Request, Response } from 'express';
import { PrismaClient, VehicleType, PaymentMethod, RideStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// ── Validation Schemas ──────────────────────────────────────────────────
const createRideSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(1),
  rideType: z.enum(['eco', 'standard', 'premium']),
  fare: z.number().positive(),
  paymentMethod: z.enum(['momo', 'wallet', 'cash']).default('momo'),
  pickupAddress: z.string().optional(),
});

const rateRideSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// ── Helper Functions ──────────────────────────────────────────────────
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Routes ──────────────────────────────────────────────────────────────

// POST /api/rides - Create a new ride request
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const validated = createRideSchema.parse(req.body);

    // Check if user already has an active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        riderId: userId,
        status: { in: ['PENDING', 'ACCEPTED', 'STARTED'] as RideStatus[] },
      },
    });

    if (activeRide) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active ride',
        activeRide,
      });
    }

    // Calculate distance and duration
    const distance = calculateDistance(
      validated.pickupLat,
      validated.pickupLng,
      validated.dropoffLat,
      validated.dropoffLng
    );
    const duration = Math.round(distance / 15 * 60);

    // Create the ride
    const ride = await prisma.ride.create({
      data: {
        riderId: userId,
        pickupLat: validated.pickupLat,
        pickupLng: validated.pickupLng,
        pickupAddress: validated.pickupAddress || 'Current location',
        dropoffLat: validated.dropoffLat,
        dropoffLng: validated.dropoffLng,
        dropoffAddress: validated.dropoffAddress,
        distance: distance,
        duration: duration,
        fare: validated.fare,
        paymentMethod: validated.paymentMethod.toUpperCase() as PaymentMethod,
        status: 'PENDING',
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Find nearby drivers and emit via WebSocket
    const nearbyDrivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isApproved: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      take: 10,
    });

    // Emit ride request to nearby drivers via WebSocket
    if (req.app.get('io')) {
      const io = req.app.get('io');
      nearbyDrivers.forEach(driver => {
        io.to(`driver_${driver.id}`).emit('new-ride-request', {
          rideId: ride.id,
          pickup: ride.pickupAddress,
          dropoff: ride.dropoffAddress,
          fare: ride.fare,
          distance: ride.distance,
          rider: ride.rider,
          rideType: validated.rideType,
        });
      });
    }

    res.status(201).json({
      success: true,
      data: ride,
      message: 'Ride requested successfully',
    });
  } catch (error: any) {
    console.error('Create ride error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues.map((e: any) => ({
          path: Array.isArray(e.path) ? e.path.join('.') : String(e.path),
          message: e.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create ride',
    });
  }
});

// GET /api/rides - Get all rides for a user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { status, limit = '20', offset = '0' } = req.query;

    const where: any = {
      OR: [
        { riderId: userId },
        { driverId: userId },
      ],
    };

    if (status) {
      where.status = status as string;
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        payment: true,
        rating: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.ride.count({ where });

    res.json({
      success: true,
      data: rides,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch rides',
    });
  }
});

// GET /api/rides/:id - Get ride details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        payment: true,
        rating: true,
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.riderId !== userId && ride.driverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this ride',
      });
    }

    res.json({
      success: true,
      data: ride,
    });
  } catch (error: any) {
    console.error('Get ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch ride',
    });
  }
});

// PUT /api/rides/:id/accept - Accept a ride (driver)
router.put('/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!driver) {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can accept rides',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `This ride is no longer available (status: ${ride.status})`,
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        driverId: driver.id,
        status: 'ACCEPTED',
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`rider_${ride.riderId}`).emit('ride-accepted', {
        rideId: id,
        driver: {
          id: driver.id,
          name: driver.user?.name,
          phone: driver.user?.phone,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
        },
      });
    }

    res.json({
      success: true,
      data: updatedRide,
      message: 'Ride accepted successfully',
    });
  } catch (error: any) {
    console.error('Accept ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept ride',
    });
  }
});

// PUT /api/rides/:id/start - Start a ride
router.put('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.driverId !== userId && ride.driver?.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned driver can start this ride',
      });
    }

    if (ride.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: 'Ride must be accepted before starting',
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'STARTED',
        startedAt: new Date(),
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`rider_${ride.riderId}`).emit('ride-started', {
        rideId: id,
        status: 'STARTED',
        driver: {
          name: ride.driver?.user?.name,
          phone: ride.driver?.user?.phone,
          vehicleNumber: ride.driver?.vehicleNumber,
        },
      });
    }

    res.json({
      success: true,
      data: updatedRide,
      message: 'Ride started successfully',
    });
  } catch (error: any) {
    console.error('Start ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start ride',
    });
  }
});

// PUT /api/rides/:id/complete - Complete a ride
router.put('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.driverId !== userId && ride.driver?.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned driver can complete this ride',
      });
    }

    if (ride.status !== 'STARTED') {
      return res.status(400).json({
        success: false,
        message: 'Ride must be started before completing',
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        rideId: id,
        userId: ride.riderId,
        amount: ride.fare,
        method: ride.paymentMethod,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update driver earnings
    if (ride.driverId) {
      await prisma.driver.update({
        where: { id: ride.driverId },
        data: {
          totalTrips: { increment: 1 },
          totalEarnings: { increment: ride.fare * 0.8 },
        },
      });
    }

    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`rider_${ride.riderId}`).emit('ride-completed', {
        rideId: id,
        fare: ride.fare,
        driver: {
          name: ride.driver?.user?.name,
        },
      });
    }

    res.json({
      success: true,
      data: updatedRide,
      message: 'Ride completed successfully',
    });
  } catch (error: any) {
    console.error('Complete ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete ride',
    });
  }
});

// PUT /api/rides/:id/cancel - Cancel a ride
router.put('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.riderId !== userId && ride.driverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this ride',
      });
    }

    if (ride.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed ride',
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (req.app.get('io')) {
      const io = req.app.get('io');
      const otherPartyId = ride.riderId === userId ? ride.driverId : ride.riderId;
      if (otherPartyId) {
        io.to(`user_${otherPartyId}`).emit('ride-cancelled', {
          rideId: id,
          cancelledBy: userId,
        });
      }
    }

    res.json({
      success: true,
      data: updatedRide,
      message: 'Ride cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel ride',
    });
  }
});

// POST /api/rides/:id/rate - Rate a ride
router.post('/:id/rate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const validated = rateRideSchema.parse(req.body);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    if (ride.riderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the rider can rate this ride',
      });
    }

    if (ride.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed rides',
      });
    }

    const existingRating = await prisma.rating.findUnique({
      where: { rideId: id },
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'This ride has already been rated',
      });
    }

    const ratingRecord = await prisma.rating.create({
      data: {
        rideId: id,
        riderId: userId,
        driverId: ride.driverId!,
        rating: validated.rating,
        comment: validated.comment || null,
      },
    });

    // Update driver's average rating
    if (ride.driverId) {
      const driverRatings = await prisma.rating.aggregate({
        where: { driverId: ride.driverId },
        _avg: { rating: true },
      });

      await prisma.driver.update({
        where: { id: ride.driverId },
        data: {
          rating: driverRatings._avg.rating ?? 0,
        },
      });
    }

    res.json({
      success: true,
      data: ratingRecord,
      message: 'Ride rated successfully',
    });
  } catch (error: any) {
    console.error('Rate ride error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to rate ride',
    });
  }
});

export default router;