import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/database';
import redisClient from '../../config/redis';
import { io } from '../../socket/socket.server';

export class TrackingController {
  async updateLocation(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, heading, speed, rideId } = req.body;
      const driver = await prisma.driver.findUnique({
        where: { userId: req.user.id },
      });

      if (!driver) {
        return res.status(403).json({ error: 'Only drivers can update location' });
      }

      // Update driver's current location
      await prisma.driver.update({
        where: { id: driver.id },
        data: { currentLat: lat, currentLng: lng },
      });

      // Store location in Redis for real-time access
      await redisClient.setEx(
        `driver_location:${driver.id}`,
        30,
        JSON.stringify({ lat, lng, heading, speed, timestamp: Date.now() })
      );

      // Store tracking data for active ride
      if (rideId) {
        await prisma.trackingData.create({
          data: {
            rideId,
            driverId: driver.id,
            lat,
            lng,
            speed,
            heading,
          },
        });

        // Emit real-time location to rider
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
          select: { riderId: true },
        });

        if (ride) {
          io.to(`user_${ride.riderId}`).emit('driver_location_update', {
            rideId,
            lat,
            lng,
            heading,
            speed,
          });
        }
      }

      // Emit to admin dashboard for fleet monitoring
      io.to('admin_dashboard').emit('fleet_update', {
        driverId: driver.id,
        driverName: req.user.fullName,
        lat,
        lng,
        heading,
        status: driver.isOnline ? 'ONLINE' : 'OFFLINE',
        rideId: rideId || null,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to update location' });
    }
  }

  async getDriverLocation(req: AuthRequest, res: Response) {
    try {
      const { driverId } = req.params;
      const cachedLocation = await redisClient.get(`driver_location:${driverId}`);

      if (cachedLocation) {
        return res.json(JSON.parse(cachedLocation));
      }

      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { currentLat: true, currentLng: true },
      });

      return res.json(driver);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get driver location' });
    }
  }

  async getNearbyDrivers(req: AuthRequest, res: Response) {
    try {
      const { lat, lng, radius = 2 } = req.query;

      const nearbyDrivers = await prisma.$queryRaw`
        SELECT 
          d.*,
          u."fullName",
          u."profileImage",
          v."plateNumber",
          v."model",
          v."color",
          (6371 * acos(cos(radians(${parseFloat(lat as string)})) * cos(radians(d."currentLat")) * cos(radians(d."currentLng") - radians(${parseFloat(lng as string)})) + sin(radians(${parseFloat(lat as string)})) * sin(radians(d."currentLat")))) as distance
        FROM "Driver" d
        JOIN "User" u ON d."userId" = u.id
        LEFT JOIN "Vehicle" v ON d."vehicleId" = v.id
        WHERE d."isOnline" = true 
        AND d."isAvailable" = true
        AND d."currentLat" IS NOT NULL
        HAVING distance <= ${parseFloat(radius as string)}
        ORDER BY distance ASC
        LIMIT 20
      `;

      return res.json(nearbyDrivers);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get nearby drivers' });
    }
  }

  async startTracking(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: { driver: true },
      });

      if (!ride || !ride.driver) {
        return res.status(404).json({ error: 'Ride or driver not found' });
      }

      // Start location streaming
      const interval = setInterval(async () => {
        const location = await redisClient.get(`driver_location:${ride.driverId}`);
        if (location) {
          io.to(`user_${ride.riderId}`).emit('live_tracking', JSON.parse(location));
        }
      }, 3000);

      // Store interval ID for cleanup
      await redisClient.setEx(`tracking_ride:${rideId}`, 3600, interval.id);

      return res.json({ success: true, message: 'Tracking started' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to start tracking' });
    }
  }

  async stopTracking(req: AuthRequest, res: Response) {
    try {
      const { rideId } = req.params;
      const intervalId = await redisClient.get(`tracking_ride:${rideId}`);

      if (intervalId) {
        clearInterval(parseInt(intervalId));
        await redisClient.del(`tracking_ride:${rideId}`);
      }

      return res.json({ success: true, message: 'Tracking stopped' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to stop tracking' });
    }
  }
}