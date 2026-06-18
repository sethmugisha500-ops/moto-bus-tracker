import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import { io } from '../../socket/socket.server';

export class RidesController {
  async createRide(req: AuthRequest, res: Response) {
    try {
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
        paymentMethod,
      } = req.body;

      const ride = await prisma.ride.create({
        data: {
          riderId: req.user.id,
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
        },
        include: {
          rider: true,
        },
      });

      // Notify nearby drivers
      this.notifyNearbyDrivers(ride);

      return res.status(201).json(ride);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create ride' });
    }
  }

  async acceptRide(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const driver = await prisma.driver.findUnique({
        where: { userId: req.user.id },
      });

      if (!driver) {
        return res.status(403).json({ error: 'Only drivers can accept rides' });
      }

      const ride = await prisma.ride.update({
        where: { id: rideId, status: 'PENDING' },
        data: {
          driverId: driver.id,
          status: 'ACCEPTED',
        },
        include: {
          rider: true,
          driver: {
            include: { user: true, vehicle: true },
          },
        },
      });

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found or already accepted' });
      }

      // Notify rider
      io.to(`user_${ride.riderId}`).emit('ride_accepted', ride);

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to accept ride' });
    }
  }

  async startRide(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const ride = await prisma.ride.update({
        where: { id: rideId, status: 'ACCEPTED' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      io.to(`user_${ride.riderId}`).emit('ride_started', ride);

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to start ride' });
    }
  }

  async completeRide(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const ride = await prisma.ride.update({
        where: { id: rideId, status: 'IN_PROGRESS' },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          paymentStatus: 'COMPLETED',
        },
      });

      // Process payment
      await this.processPayment(ride);

      // Update driver earnings
      if (ride.driverId) {
        await prisma.driver.update({
          where: { id: ride.driverId },
          data: {
            totalEarnings: { increment: ride.fare * 0.8 }, // 80% to driver
            totalRides: { increment: 1 },
          },
        });
      }

      io.to(`user_${ride.riderId}`).emit('ride_completed', ride);

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to complete ride' });
    }
  }

  async cancelRide(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const { reason } = req.body;

      const ride = await prisma.ride.update({
        where: { id: rideId, status: { in: ['PENDING', 'ACCEPTED'] } },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      io.to(`ride_${rideId}`).emit('ride_cancelled', { rideId, reason });

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to cancel ride' });
    }
  }

  async getRideById(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          rider: true,
          driver: {
            include: { user: true, vehicle: true },
          },
          tracking: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          payment: true,
          rating: true,
        },
      });

      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      return res.json(ride);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch ride' });
    }
  }

  async getUserRides(req: AuthRequest, res: Response) {
    try {
      const rides = await prisma.ride.findMany({
        where: { riderId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            include: { user: true },
          },
          rating: true,
        },
      });

      return res.json(rides);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch rides' });
    }
  }

  private async notifyNearbyDrivers(ride: any) {
    // Find nearby drivers within 2km radius
    const nearbyDrivers = await prisma.$queryRaw`
      SELECT d.*, u.fullName, u.phone 
      FROM "Driver" d
      JOIN "User" u ON d."userId" = u.id
      WHERE d."isOnline" = true 
      AND d."isAvailable" = true
      AND d."currentLat" IS NOT NULL
      AND (6371 * acos(cos(radians(${ride.pickupLat})) * cos(radians(d."currentLat")) * cos(radians(d."currentLng") - radians(${ride.pickupLng})) + sin(radians(${ride.pickupLat})) * sin(radians(d."currentLat")))) <= 2
    `;

    for (const driver of nearbyDrivers as any[]) {
      io.to(`driver_${driver.userId}`).emit('new_ride_request', {
        rideId: ride.id,
        pickupLat: ride.pickupLat,
        pickupLng: ride.pickupLng,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        distance: ride.distance,
        fare: ride.fare,
      });
    }
  }

  private async processPayment(ride: any) {
    // Implement payment processing logic
    // For Mobile Money or Wallet deduction
    if (ride.paymentMethod === 'WALLET') {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: ride.riderId },
          data: { balance: { decrement: ride.fare } },
        }),
        prisma.payment.create({
          data: {
            rideId: ride.id,
            userId: ride.riderId,
            amount: ride.fare,
            method: 'WALLET',
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        }),
      ]);
    }
  }
}