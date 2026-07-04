// backend-api/src/routes/rides.ts
import { Router, Request, Response } from 'express';
import { PrismaClient, RideStatus, PaymentMethod, PaymentStatus, VehicleType } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

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

// ✅ Define cancelRideSchema
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
      whereClause.vehicleType = mappedType as VehicleType;
    }

    const drivers = await prisma.driver.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        }
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
          distance: distance,
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
    
    // Map the ride type and payment method
    const vehicleType = mapRideType(validated.rideType);
    const paymentMethod = mapPaymentMethod(validated.paymentMethod);
    
    const distance = validated.distance || calculateDistance(
      validated.pickupLat,
      validated.pickupLng,
      validated.dropoffLat,
      validated.dropoffLng
    );

    // Create the ride
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

    // Find nearby available drivers
    const nearbyDrivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isApproved: true,
        vehicleType: vehicleType as VehicleType,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          }
        }
      },
      take: 10
    });

    // If drivers found, match with the nearest driver
    if (nearbyDrivers.length > 0) {
      const sortedDrivers = nearbyDrivers.map(driver => {
        let distance = Infinity;
        if (driver.currentLat && driver.currentLng) {
          distance = calculateDistance(
            validated.pickupLat,
            validated.pickupLng,
            driver.currentLat,
            driver.currentLng
          );
        }
        return { ...driver, distance };
      }).sort((a, b) => a.distance - b.distance);

      const matchedDriver = sortedDrivers[0];
      
      const updatedRide = await prisma.ride.update({
        where: { id: ride.id },
        data: {
          driverId: matchedDriver.id,
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

      // Broadcast via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.emit('ride-accepted', {
          ride: updatedRide,
          driver: {
            id: matchedDriver.id,
            name: matchedDriver.user.name,
            phone: matchedDriver.user.phone,
            vehicleNumber: matchedDriver.vehicleNumber,
            vehicleType: matchedDriver.vehicleType,
            vehicleModel: matchedDriver.vehicleModel,
            rating: matchedDriver.rating,
            currentLat: matchedDriver.currentLat,
            currentLng: matchedDriver.currentLng,
          }
        });
      }

      return res.status(201).json({
        success: true,
        data: updatedRide,
        message: 'Ride created and driver matched'
      });
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

// ─── GET /api/rides/:id ──────────────────────────────────────────────
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
            email: true,
          }
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              }
            }
          }
        },
        payment: true,
        rating: true,
        sosAlerts: true,
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
        message: 'Unauthorized to view this ride'
      });
    }

    return res.status(200).json({
      success: true,
      data: ride
    });

  } catch (error) {
    console.error('Get ride error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ride'
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
        driver: true
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check if user is authorized
    if (existingRide.riderId !== req.user?.id && existingRide.driverId !== req.user?.id) {
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

    // If driver was assigned, make them online again
    if (updatedRide.driverId) {
      await prisma.driver.update({
        where: { id: updatedRide.driverId },
        data: { isOnline: true }
      });
    }

    // Broadcast cancellation via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-cancelled', {
        rideId: id,
        ride: updatedRide
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel ride error:', error);
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

// ─── PUT /api/rides/:id/accept ──────────────────────────────────────
router.put('/:id/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is a driver
    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can accept rides'
      });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id }
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

    // Get driver info
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

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    if (!driver.isOnline || !driver.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
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

    // Mark driver as offline while on trip
    await prisma.driver.update({
      where: { id: driver.id },
      data: { isOnline: false }
    });

    // Broadcast driver match via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('ride-accepted', {
        ride: updatedRide,
        driver: {
          id: driver.id,
          name: driver.user.name,
          phone: driver.user.phone,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel,
          rating: driver.rating,
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride accepted successfully'
    });

  } catch (error) {
    console.error('Accept ride error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept ride'
    });
  }
});

// ─── PUT /api/rides/:id/start ──────────────────────────────────────
router.put('/:id/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can start rides'
      });
    }

    const existingRide = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: true
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.id }
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

    const io = req.app.get('io');
    if (io) {
      io.emit('ride-started', {
        ride: updatedRide
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride started successfully'
    });

  } catch (error) {
    console.error('Start ride error:', error);
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
        driver: true
      }
    });

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: req.user!.id }
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
        completedAt: new Date(),
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

    // Update driver stats
    await prisma.driver.update({
      where: { id: driver.id },
      data: {
        isOnline: true,
        totalTrips: { increment: 1 },
        totalEarnings: { increment: existingRide.fare },
      }
    });

    // Create payment record if not exists
    const existingPayment = await prisma.payment.findUnique({
      where: { rideId: id }
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          rideId: id,
          userId: existingRide.riderId,
          amount: existingRide.fare,
          method: existingRide.paymentMethod,
          status: 'COMPLETED' as PaymentStatus,
          completedAt: new Date(),
        }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('ride-completed', {
        ride: updatedRide
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedRide,
      message: 'Ride completed successfully'
    });

  } catch (error) {
    console.error('Complete ride error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete ride'
    });
  }
});

export default router;