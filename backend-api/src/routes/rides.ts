// backend-api/src/routes/rides.ts
import { Router, Response, Request, RequestHandler } from 'express';
import { PrismaClient, RideStatus, PaymentMethod, PaymentStatus, VehicleType } from '@prisma/client';
import { authenticate as authenticateMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

type AuthRequest = Request & {
  user?: {
    email?: string | null;
    id: string;
    phone: string;
    role: string;
    name?: string;
  };
};

const router = Router();
const prisma = new PrismaClient();
const authenticate = authenticateMiddleware as unknown as RequestHandler;

// ─── Validation Schemas ──────────────────────────────────────────────
const createRideSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  dropoffAddress: z.string().min(1),
  rideType: z.string(),
  fare: z.number().positive(),
  paymentMethod: z.string(),
  pickupAddress: z.string().optional(),
  distance: z.number().optional(),
  duration: z.number().optional(),
});

const cancelRideSchema = z.object({
  reason: z.string().optional(),
});

// ─── Helper Functions ────────────────────────────────────────────────
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function mapRideType(type: string): string {
  const mapping: Record<string, string> = {
    'eco': 'MOTO',
    'moto': 'MOTO',
    'ride': 'CAR',
    'bus': 'MINIBUS',
    'MOTO': 'MOTO',
    'CAR': 'CAR',
    'BUS': 'BUS',
    'MINIBUS': 'MINIBUS',
  };
  return mapping[type] || 'MOTO';
}

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    'momo': 'MOBILE_MONEY',
    'airtel': 'MOBILE_MONEY',
    'wallet': 'WALLET',
    'cash': 'CASH',
    'MOBILE_MONEY': 'MOBILE_MONEY',
    'WALLET': 'WALLET',
    'CASH': 'CASH',
  };
  return mapping[method] || 'CASH';
}

// ─── GET /api/rides/drivers/nearby ──────────────────────────────────
router.get('/drivers/nearby', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius = '5', vehicleType } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required'
      });
    }

    const whereClause: any = {
      isOnline: true,
      isApproved: true,
    };

    if (vehicleType) {
      const mappedType = mapRideType(vehicleType as string);
      const validEnumValues = Object.values(VehicleType);
      if (!validEnumValues.includes(mappedType as VehicleType)) {
        console.warn(`⚠️ Unrecognized vehicleType "${vehicleType}"`);
      } else {
        whereClause.vehicleType = mappedType as VehicleType;
      }
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } }
      }
    });

    const driversWithDistance = drivers
      .map(driver => {
        let distance = Infinity;
        if (driver.currentLat && driver.currentLng) {
          distance = calculateDistance(
            parseFloat(lat as string),
            parseFloat(lng as string),
            driver.currentLat,
            driver.currentLng
          );
        }
        return {
          ...driver,
          distance,
          distanceText: distance < Infinity ? `${distance.toFixed(1)} km` : 'Unknown',
          eta: distance < Infinity ? `${Math.ceil(distance * 2)} min` : 'Unknown',
        };
      })
      .filter(driver => driver.distance <= parseFloat(radius as string))
      .sort((a, b) => a.distance - b.distance);

    return res.status(200).json({
      success: true,
      data: driversWithDistance,
      count: driversWithDistance.length
    });

  } catch (error) {
    console.error('Get nearby drivers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby drivers'
    });
  }
});

// ─── POST /api/rides ──────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validated = createRideSchema.parse(req.body);
    
    const vehicleType = mapRideType(validated.rideType);
    const paymentMethod = mapPaymentMethod(validated.paymentMethod);
    
    const distance = validated.distance || calculateDistance(
      validated.pickupLat,
      validated.pickupLng,
      validated.dropoffLat,
      validated.dropoffLng
    );

    const ride = await prisma.ride.create({
      data: {
        riderId: req.user!.id,
        pickupLat: validated.pickupLat,
        pickupLng: validated.pickupLng,
        pickupAddress: validated.pickupAddress || 'Current Location',
        dropoffLat: validated.dropoffLat,
        dropoffLng: validated.dropoffLng,
        dropoffAddress: validated.dropoffAddress,
        distance: distance,
        duration: validated.duration || Math.ceil(distance * 2),
        fare: validated.fare,
        paymentMethod: paymentMethod as PaymentMethod,
        status: 'PENDING' as RideStatus,
        paymentStatus: 'PENDING' as PaymentStatus,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    console.log(`✅ Ride created: ${ride.id} for rider ${ride.riderId}`);

    const io = req.app.get('io');
    
    if (io) {
      const rideData = {
        id: ride.id,
        riderName: ride.rider?.name || 'Rider',
        riderPhone: ride.rider?.phone || '',
        pickupAddress: ride.pickupAddress || 'Current Location',
        dropoffAddress: ride.dropoffAddress || 'Unknown destination',
        fare: ride.fare || 0,
        distance: ride.distance ? `${ride.distance.toFixed(1)} km` : '0 km',
        status: ride.status,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        dropoffLat: ride.dropoffLat,
        dropoffLng: ride.dropoffLng,
        createdAt: ride.createdAt,
      };
      
      const onlineDrivers = await prisma.driver.findMany({
        where: { isOnline: true, isApproved: true },
        select: { id: true, userId: true }
      });
      
      console.log(`📢 Found ${onlineDrivers.length} online drivers`);
      
      for (const driver of onlineDrivers) {
        const driverRooms = [
          `driver_${driver.id}`,
          `driver-${driver.id}`,
          driver.id,
          `user_${driver.userId}`,
          `user-${driver.userId}`,
          driver.userId
        ];
        for (const room of driverRooms) {
          io.to(room).emit('new-ride-request', rideData);
        }
        console.log(`📢 Sent ride request to driver ${driver.id}`);
      }
    }

    return res.status(202).json({
      success: true,
      data: ride,
      message: 'Ride created, waiting for driver...',
      searching: true
    });

  } catch (error) {
    console.error('Create ride error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create ride'
    });
  }
});

// ─── ✅ FIXED: GET /api/rides/:id ────────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is authorized
    if (ride.riderId !== req.user?.id && ride.driverId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Format response with driver data
    const response = {
      success: true,
      data: {
        ...ride,
        driver: ride.driver ? {
          id: ride.driver.id,
          driverId: ride.driver.id,
          name: ride.driver.user?.name || 'Driver',
          phone: ride.driver.user?.phone || '',
          vehicleNumber: ride.driver.vehicleNumber || 'N/A',
          vehicleType: ride.driver.vehicleType || 'MOTO',
          rating: ride.driver.rating || 0,
          currentLat: ride.driver.currentLat || ride.pickupLat,
          currentLng: ride.driver.currentLng || ride.pickupLng,
          user: ride.driver.user
        } : null
      }
    };

    console.log(`📤 GET ride ${id}: status=${ride.status}, hasDriver=${!!ride.driver}`);

    return res.json(response);

  } catch (error: any) {
    console.error('❌ Get ride error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── PUT /api/rides/:id/accept ──────────────────────────────────────
router.put('/:id/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log(`📡 Accept ride request - Ride ID: ${id}, User ID: ${userId}`);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can accept rides'
      });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (existingRide.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be accepted in ${existingRide.status} status`
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
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

    if (!driver.isOnline) {
      return res.status(400).json({
        success: false,
        message: 'Driver is offline. Please go online first.'
      });
    }

    if (!driver.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Driver account is not approved'
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        driverId: driver.id,
        status: 'ACCEPTED' as RideStatus,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: false }
    });

    console.log(`✅ Ride ${id} accepted by driver ${driver.user?.name || 'Unknown'}`);

    const emitToRider = req.app.get('emitToRider');
    const io = req.app.get('io');

    if (emitToRider) {
      const driverData = {
        id: driver.id,
        driverId: driver.id,
        name: driver.user?.name || 'Driver',
        phone: driver.user?.phone || '',
        vehicleNumber: driver.vehicleNumber || 'N/A',
        vehicleType: driver.vehicleType || 'MOTO',
        rating: driver.rating || 4.8,
        currentLat: driver.currentLat || updatedRide.pickupLat,
        currentLng: driver.currentLng || updatedRide.pickupLng,
      };

      const eventData = {
        rideId: updatedRide.id,
        ride: updatedRide,
        driver: driverData,
        timestamp: new Date().toISOString()
      };

      emitToRider(updatedRide.riderId, 'ride-accepted', eventData);
      emitToRider(updatedRide.riderId, 'ride-status-update', {
        rideId: updatedRide.id,
        status: 'ACCEPTED',
        driver: driverData
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride accepted successfully'
    });

  } catch (error: any) {
    console.error('❌ Accept ride error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── PUT /api/rides/:id/start ──────────────────────────────────────
router.put('/:id/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`🚗 Starting ride: ${id}`);

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can start rides'
      });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: { 
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!driver || existingRide.driverId !== driver.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this ride'
      });
    }

    if (existingRide.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be started in ${existingRide.status} status`
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'STARTED' as RideStatus,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    console.log(`✅ Ride ${id} started`);

    const emitToRider = req.app.get('emitToRider');

    if (emitToRider) {
      const driverData = {
        id: driver.id,
        driverId: driver.id,
        name: driver.user?.name || 'Driver',
        phone: driver.user?.phone || '',
        vehicleNumber: driver.vehicleNumber || 'N/A',
        vehicleType: driver.vehicleType || 'MOTO',
        rating: driver.rating || 4.8,
        currentLat: driver.currentLat || updatedRide.pickupLat,
        currentLng: driver.currentLng || updatedRide.pickupLng,
      };

      const eventData = {
        rideId: updatedRide.id,
        ride: updatedRide,
        driver: driverData,
        timestamp: new Date().toISOString()
      };

      emitToRider(updatedRide.riderId, 'ride-started', {
        rideId: updatedRide.id,
        ride: updatedRide
      });
      
      emitToRider(updatedRide.riderId, 'ride-accepted', eventData);
      emitToRider(updatedRide.riderId, 'ride-status-update', {
        rideId: updatedRide.id,
        status: 'STARTED',
        driver: driverData
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride started successfully'
    });

  } catch (error) {
    console.error('❌ Start ride error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start ride'
    });
  }
});

// ─── PUT /api/rides/:id/complete ──────────────────────────────────
router.put('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can complete rides'
      });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: { 
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!driver || existingRide.driverId !== driver.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this ride'
      });
    }

    if (existingRide.status !== 'STARTED') {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be completed in ${existingRide.status} status`
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'COMPLETED' as RideStatus,
        paymentStatus: 'COMPLETED' as PaymentStatus,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        isOnline: true,
        totalTrips: { increment: 1 },
        totalEarnings: { increment: existingRide.fare },
      }
    });

    const emitToRider = req.app.get('emitToRider');

    if (emitToRider) {
      emitToRider(updatedRide.riderId, 'ride-completed', {
        rideId: updatedRide.id,
        ride: updatedRide
      });
      
      emitToRider(updatedRide.riderId, 'ride-status-update', {
        rideId: updatedRide.id,
        status: 'COMPLETED'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride completed successfully'
    });

  } catch (error) {
    console.error('❌ Complete ride error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete ride'
    });
  }
});

// ─── PUT /api/rides/:id/cancel ──────────────────────────────────────
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = cancelRideSchema.parse(req.body);

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: { 
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (existingRide.riderId !== req.user?.id && existingRide.driverId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this ride'
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(existingRide.status)) {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be cancelled in ${existingRide.status} status`
      });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'CANCELLED' as RideStatus,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    if (updatedRide.driverId) {
      await prisma.driver.update({
        where: { id: updatedRide.driverId },
        data: { isOnline: true }
      });
    }

    const emitToRider = req.app.get('emitToRider');

    if (emitToRider) {
      emitToRider(updatedRide.riderId, 'ride-cancelled', {
        rideId: id,
        ride: updatedRide,
        reason: reason || 'Ride was cancelled'
      });
      
      emitToRider(updatedRide.riderId, 'ride-status-update', {
        rideId: updatedRide.id,
        status: 'CANCELLED',
        reason: reason || 'Ride was cancelled'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Cancel ride error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel ride'
    });
  }
});
// backend-api/src/routes/rides.ts

// ─── GET /api/rides/history ──────────────────────────────────────────
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rides = await prisma.ride.findMany({
      where: { riderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      },
      take: 50
    });

    return res.json({
      success: true,
      data: rides
    });
  } catch (error: any) {
    console.error('Get ride history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// backend-api/src/routes/rides.ts

// ─── PUT /api/rides/:id/cancel ──────────────────────────────────────
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Get the ride
    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is authorized (rider OR driver)
    const isRider = existingRide.riderId === userId;
    const isDriver = existingRide.driverId === userId;

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this ride'
      });
    }

    // Check if ride can be cancelled
    if (['COMPLETED', 'CANCELLED'].includes(existingRide.status)) {
      return res.status(400).json({
        success: false,
        message: `Ride cannot be cancelled in ${existingRide.status} status`
      });
    }

    // Update ride
    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: 'CANCELLED' as RideStatus,
        cancelledAt: new Date(),
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              }
            }
          }
        }
      }
    });

    // Set driver back online if assigned
    if (updatedRide.driverId) {
      await prisma.driver.update({
        where: { id: updatedRide.driverId },
        data: { isOnline: true }
      });
    }

    // ─── EMIT SOCKET EVENT ──────────────────────────────────────────
    const emitToRider = req.app.get('emitToRider');

    if (emitToRider) {
      emitToRider(updatedRide.riderId, 'ride-cancelled', {
        rideId: id,
        ride: updatedRide,
        reason: reason || 'Ride was cancelled',
        cancelledBy: isRider ? 'rider' : 'driver'
      });
    }

    return res.json({
      success: true,
      message: 'Ride cancelled successfully',
      data: updatedRide
    });

  } catch (error: any) {
    console.error('❌ Cancel ride error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;