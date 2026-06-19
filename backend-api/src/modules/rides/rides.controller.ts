import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/database';

// Global reference if socket module isn't exported yet
const io = (global as any).io || { to: () => ({ emit: () => {} }) };

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
          riderId: req.user?.id || '',
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

      res.status(201).json(ride);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create ride' });
      return;
    }
  }

  async acceptRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const driver = await prisma.driver.findUnique({
        where: { userId: req.user?.id },
      });

      if (!driver) {
        res.status(403).json({ error: 'Only drivers can accept rides' });
        return;
      }

      const ride = await prisma.ride.update({
        where: { id: id, status: 'PENDING' },
        data: {
          status: 'ACCEPTED',
          driverId: driver.id
        },
        include: {
          rider: true,
        },
      });

      if (!ride) {
        res.status(404).json({ error: 'Ride not found or already accepted' });
        return;
      }

      // Notify rider
      io.to(`user_${ride.riderId}`).emit('ride_accepted', ride);

      res.json(ride);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to accept ride' });
      return;
    }
  }

  async startRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.update({
        where: { id: id, status: 'ACCEPTED' },
        data: {
          status: 'STARTED',
        },
      });

      io.to(`user_${ride.riderId}`).emit('ride_started', ride);

      res.json(ride);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to start ride' });
      return;
    }
  }

  async completeRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.update({
        where: { id: id, status: 'STARTED' },
        data: {
          status: 'COMPLETED',
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
            totalTrips: { increment: 1 },
          },
        });
      }

      io.to(`user_${ride.riderId}`).emit('ride_completed', ride);

      res.json(ride);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete ride' });
      return;
    }
  }

  async cancelRide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const ride = await prisma.ride.update({
        where: { id: id, status: { in: ['PENDING', 'ACCEPTED'] } },
        data: {
          status: 'CANCELLED',
        },
      });

      io.to(`ride_${id}`).emit('ride_cancelled', { id, reason });

      res.json(ride);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel ride' });
      return;
    }
  }

  async getRideById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id: id },
        include: {
          rider: true,
          payment: true,
          rating: true,
        },
      });

      if (!ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      res.json(ride);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch ride' });
      return;
    }
  }

  async getUserRides(req: AuthRequest, res: Response) {
    try {
      const rides = await prisma.ride.findMany({
        where: { riderId: req.user?.id },
        orderBy: { createdAt: 'desc' },
        include: {
          rating: true,
        },
      });

      res.json(rides);
      return;
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rides' });
      return;
    }
  }

  private async notifyNearbyDrivers(ride: any) {
    const nearbyDrivers = await prisma.$queryRaw`
      SELECT d.*, u.name, u.phone 
      FROM "Driver" d
      JOIN "User" u ON d."userId" = u.id
      WHERE d."isOnline" = true 
      AND d."currentLat" IS NOT NULL
      AND (6371 * acos(cos(radians(${ride.pickupLat})) * cos(radians(d."currentLat")) * cos(radians(d."currentLng") - radians(${ride.pickupLng})) + sin(radians(${ride.pickupLat})) * sin(radians(d."currentLat")))) <= 2
    `;

    for (const driver of nearbyDrivers as any[]) {
      io.to(`driver_${driver.userId}`).emit('new_ride_request', {
        id: ride.id,
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
    if (ride.paymentMethod === 'WALLET') {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: ride.riderId },
          data: { balance: { decrement: ride.fare } },
        }),
        prisma.payment.create({
          data: {
            amount: ride.fare,
            method: 'WALLET',
            status: 'COMPLETED',
            ride: { connect: { id: ride.id } },
            user: { connect: { id: ride.riderId } }
          },
        }),
      ]);
    }
  }
}