import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../prisma/client';

export class RideController {
    async requestRide(req: AuthRequest, res: Response) {
        try {
            const ride = await prisma.ride.create({
                data: {
                    riderId: req.user!.id,
                    ...req.body,
                    status: 'PENDING'
                }
            });
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getUserRides(req: AuthRequest, res: Response) {
        try {
            const rides = await prisma.ride.findMany({
                where: { riderId: req.user!.id },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: rides });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRideById(req: AuthRequest, res: Response) {
        try {
            const ride = await prisma.ride.findUnique({
                where: { id: req.params.id },
                include: { driver: { include: { user: true } } }
            });
            if (!ride) {
                return res.status(404).json({ success: false, message: 'Ride not found' });
            }
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRideStats(req: AuthRequest, res: Response) {
        try {
            const stats = await prisma.ride.aggregate({
                _count: { id: true },
                _sum: { fare: true }
            });
            res.json({ success: true, data: stats });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getRiderHistory(req: AuthRequest, res: Response) {
        try {
            const rides = await prisma.ride.findMany({
                where: { riderId: req.user!.id },
                orderBy: { createdAt: 'desc' },
                include: { driver: { include: { user: true } } }
            });
            res.json({ success: true, data: rides });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getDriverRides(req: AuthRequest, res: Response) {
        try {
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user!.id }
            });
            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }
            const rides = await prisma.ride.findMany({
                where: { driverId: driver.id },
                orderBy: { createdAt: 'desc' },
                include: { rider: true }
            });
            res.json({ success: true, data: rides });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async acceptRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const driver = await prisma.driver.findUnique({
                where: { userId: req.user!.id }
            });
            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }
            const ride = await prisma.ride.update({
                where: { id },
                data: { driverId: driver.id, status: 'ACCEPTED' }
            });
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async startRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const ride = await prisma.ride.update({
                where: { id },
                data: { status: 'STARTED' }
            });
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async completeRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const ride = await prisma.ride.update({
                where: { id },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async cancelRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const ride = await prisma.ride.update({
                where: { id },
                data: { status: 'CANCELLED', cancelledAt: new Date() }
            });
            res.json({ success: true, data: ride });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async rateRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            
            const ride = await prisma.ride.findUnique({
                where: { id },
                select: { driverId: true }
            });
            
            if (!ride || !ride.driverId) {
                return res.status(404).json({ success: false, message: 'Ride not found' });
            }

            const newRating = await prisma.rating.create({
                data: {
                    rideId: id,
                    riderId: req.user!.id,
                    driverId: ride.driverId,
                    rating,
                    comment: comment || ''
                }
            });
            res.json({ success: true, data: newRating });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async activateSOS(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { lat, lng } = req.body;
            
            const sos = await prisma.sOSAlert.create({
                data: {
                    userId: req.user!.id,
                    rideId: id,
                    lat,
                    lng,
                    status: 'ACTIVE'
                }
            });
            res.json({ success: true, data: sos });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

const rideController = new RideController();
export { rideController };
export default rideController;