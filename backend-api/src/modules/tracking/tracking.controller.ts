import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import prisma from '../../config/database'; // Fixed Prisma client location path
import redis from '../../config/redis';

export class TrackingController {
    async updateLocation(req: AuthRequest, res: Response) {
        try {
            const { lat, lng } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const driver = await prisma.driver.findUnique({
                where: { userId },
            });

            if (!driver) {
                return res.status(403).json({ error: 'Only drivers can update location' });
            }

            await prisma.driver.update({
                where: { id: driver.id },
                data: {
                    currentLat: lat,
                    currentLng: lng,
                },
            });

            await prisma.trackingData.create({
                data: {
                    userId,
                    rideId: driver.id, // Ensure your TrackingData schema expects driver.id or maps explicitly to a ride record
                    lat,
                    lng,
                },
            });

            return res.json({ success: true });
        } catch (error) {
            console.error('Update location error:', error);
            return res.status(500).json({ error: 'Failed to update location' });
        }
    }

    async getDriverLocation(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const driver = await prisma.driver.findUnique({
                where: { id },
                include: { user: true },
            });

            if (!driver) {
                return res.status(404).json({ error: 'Driver not found' });
            }

            return res.json({ driver });
        } catch (error) {
            console.error('Get driver location error:', error);
            return res.status(500).json({ error: 'Failed to get driver location' });
        }
    }

    async getNearbyDrivers(req: AuthRequest, res: Response) {
        try {
            const { lat, lng, radius = 5 } = req.query;

            const drivers = await prisma.driver.findMany({
                where: {
                    isOnline: true,
                    isApproved: true,
                    currentLat: { not: null },
                    currentLng: { not: null },
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            phone: true,
                        },
                    },
                },
                take: 20,
            });

            return res.json({ drivers });
        } catch (error) {
            console.error('Get nearby drivers error:', error);
            return res.status(500).json({ error: 'Failed to get nearby drivers' });
        }
    }

    async startTracking(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const ride = await prisma.ride.findUnique({
                where: { id },
                include: { driver: true },
            });

            if (!ride || !ride.driver) {
                return res.status(404).json({ error: 'Ride or driver not found' });
            }

            await redis.setex(`tracking_ride:${id}`, 3600, 'active');

            return res.json({ success: true, message: 'Tracking started' });
        } catch (error) {
            console.error('Start tracking error:', error);
            return res.status(500).json({ error: 'Failed to start tracking' });
        }
    }

    async stopTracking(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            await redis.del(`tracking_ride:${id}`);

            return res.json({ success: true, message: 'Tracking stopped' });
        } catch (error) {
            console.error('Stop tracking error:', error);
            return res.status(500).json({ error: 'Failed to stop tracking' });
        }
    }
}

export const trackingController = new TrackingController();