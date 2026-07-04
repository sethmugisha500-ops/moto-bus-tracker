// backend-api/src/modules/ride/ride.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RideController {
    
    // ─── Helper: Emit to Rider ──────────────────────────────────────
    private emitToRider(req: AuthRequest, riderId: string, event: string, data: any) {
        const io = req.app.get('io');
        const emitToRider = req.app.get('emitToRider');
        
        console.log(`📤 Emitting ${event} to rider ${riderId}`);
        
        // Use the emitToRider helper if available
        if (emitToRider) {
            emitToRider(riderId, event, data);
            console.log(`✅ Emitted ${event} via helper`);
        }
        
        // Also emit directly using io for redundancy
        if (io) {
            const rooms = [
                riderId,
                `user_${riderId}`,
                `user-${riderId}`,
                `rider_${riderId}`,
                `rider-${riderId}`
            ];
            
            rooms.forEach(room => {
                io.to(room).emit(event, data);
                console.log(`  ✅ Emitted ${event} to room: ${room}`);
            });
            
            // Also emit to connected sockets directly
            io.fetchSockets().then((sockets: any[]) => {
                let found = 0;
                for (const socket of sockets) {
                    if ((socket as any).userId === riderId) {
                        socket.emit(event, data);
                        found++;
                        console.log(`  ✅ Emitted ${event} directly to socket: ${socket.id}`);
                    }
                }
                if (found === 0) {
                    console.log(`  ⚠️ No connected sockets for rider ${riderId}`);
                }
            }).catch(() => {});
        }
    }

    // ─── Helper: Emit to All Drivers ────────────────────────────────
    private emitToDrivers(req: AuthRequest, event: string, data: any) {
        const io = req.app.get('io');
        if (!io) return;
        
        // Find all online drivers
        prisma.driver.findMany({
            where: { isOnline: true },
            select: { id: true, userId: true }
        }).then(drivers => {
            drivers.forEach(driver => {
                const rooms = [
                    driver.id,
                    `driver_${driver.id}`,
                    `driver-${driver.id}`,
                    driver.userId,
                    `user_${driver.userId}`,
                    `user-${driver.userId}`
                ];
                rooms.forEach(room => {
                    io.to(room).emit(event, data);
                });
            });
            console.log(`📢 Emitted ${event} to ${drivers.length} online drivers`);
        }).catch(() => {});
    }

    // ─── Request Ride ──────────────────────────────────────────────────
    async requestRide(req: AuthRequest, res: Response) {
        try {
            const ride = await prisma.ride.create({
                data: {
                    riderId: req.user!.id,
                    ...req.body,
                    status: 'PENDING'
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

            // ─── NOTIFY ALL ONLINE DRIVERS ──────────────────────────────
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

            this.emitToDrivers(req, 'new-ride-request', rideData);
            
            // Also emit globally for any listeners
            const io = req.app.get('io');
            if (io) {
                io.emit('new-ride-request', rideData);
            }

            return res.json({ 
                success: true, 
                data: ride,
                message: 'Ride created, waiting for driver...'
            });
        } catch (error: any) {
            console.error('❌ Request ride error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── Get User Rides ───────────────────────────────────────────────
    async getUserRides(req: AuthRequest, res: Response) {
        try {
            const rides = await prisma.ride.findMany({
                where: { riderId: req.user!.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    driver: {
                        include: { user: true }
                    }
                }
            });
            return res.json({ success: true, data: rides });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── Get Ride By ID ──────────────────────────────────────────────
    async getRideById(req: AuthRequest, res: Response) {
        try {
            const ride = await prisma.ride.findUnique({
                where: { id: req.params.id },
                include: { 
                    driver: { 
                        include: { user: true } 
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
            if (!ride) {
                return res.status(404).json({ success: false, message: 'Ride not found' });
            }
            return res.json({ success: true, data: ride });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── Get Ride Stats ──────────────────────────────────────────────
    async getRideStats(req: AuthRequest, res: Response) {
        try {
            const stats = await prisma.ride.aggregate({
                _count: { id: true },
                _sum: { fare: true }
            });
            return res.json({ success: true, data: stats });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── Get Rider History ───────────────────────────────────────────
    async getRiderHistory(req: AuthRequest, res: Response) {
        try {
            const rides = await prisma.ride.findMany({
                where: { riderId: req.user!.id },
                orderBy: { createdAt: 'desc' },
                include: { 
                    driver: { 
                        include: { user: true } 
                    } 
                }
            });
            return res.json({ success: true, data: rides });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // ─── Get Driver Rides ────────────────────────────────────────────
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
            return res.json({ success: true, data: rides });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

   

async acceptRide(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        
        console.log(`📡 Accepting ride: ${id}`);

        // ─── Find Driver ──────────────────────────────────────────
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
                message: 'Driver not found'
            });
        }

        // ─── Get the ride ──────────────────────────────────────────
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

        if (!existingRide || existingRide.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Ride not available'
            });
        }

        // ─── Update Ride ──────────────────────────────────────────
        const ride = await prisma.ride.update({
            where: { id },
            data: {
                driverId: driver.id,
                status: 'ACCEPTED'
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

        console.log(`✅ Ride ${id} accepted by driver ${driver.user.name}`);

        // ─── Prepare Driver Info ──────────────────────────────────
        const driverInfo = {
            id: driver.id,
            name: driver.user.name,
            phone: driver.user.phone,
            vehicleNumber: driver.vehicleNumber || 'N/A',
            vehicleType: driver.vehicleType || 'MOTO',
            rating: driver.rating || 4.8,
            currentLat: driver.currentLat || ride.pickupLat,
            currentLng: driver.currentLng || ride.pickupLng,
        };

        // ─── Set driver offline ──────────────────────────────────
        await prisma.driver.update({
            where: { id: driver.id },
            data: { isOnline: false }
        });

        // ─── TRY SOCKET EMIT (if available) ──────────────────────
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`rider_${ride.riderId}`).emit('ride-accepted', {
                    ride: ride,
                    driver: driverInfo
                });
                io.to(`user_${ride.riderId}`).emit('ride-accepted', {
                    ride: ride,
                    driver: driverInfo
                });
                console.log(`📤 Socket emit attempted to rider ${ride.riderId}`);
            }
        } catch (socketError) {
            console.log('⚠️ Socket emit failed, but API response will still work');
        }

        // ─── RETURN DRIVER INFO IN API RESPONSE ──────────────────
        return res.status(200).json({
            success: true,
            message: 'Ride accepted successfully',
            data: {
                ride: ride,
                driver: driverInfo  // ✅ Driver info included in response
            }
        });

    } catch (error: any) {
        console.error('❌ Accept ride error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to accept ride'
        });
    }
}
    // ─── START RIDE - WITH SOCKET EMITS ─────────────────────────────
    async startRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            console.log(`📡 Starting ride: ${id}`);

            // ─── Get the ride with driver info ──────────────────────
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

            // ─── Check if driver is assigned ─────────────────────────
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

            // ─── Update Ride ──────────────────────────────────────────
            const ride = await prisma.ride.update({
                where: { id },
                data: {
                    status: 'STARTED',
                    startedAt: new Date()
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

            console.log(`🚗 Ride ${id} started`);

            // ─── EMIT SOCKET EVENT ──────────────────────────────────
            this.emitToRider(req, ride.riderId, 'ride-started', {
                rideId: ride.id,
                ride: ride,
                timestamp: new Date().toISOString()
            });

            this.emitToRider(req, ride.riderId, 'ride-status-update', {
                rideId: ride.id,
                status: 'STARTED'
            });

            // ─── Confirm to driver ──────────────────────────────────
            const io = req.app.get('io');
            if (io && driver) {
                io.to(`driver_${driver.id}`).emit('ride-started-confirmation', {
                    rideId: ride.id,
                    status: 'STARTED'
                });
            }

            return res.json({
                success: true,
                message: 'Ride started successfully',
                data: ride
            });

        } catch (error: any) {
            console.error('❌ Start ride error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to start ride'
            });
        }
    }

    // ─── COMPLETE RIDE - WITH SOCKET EMITS ──────────────────────────
    async completeRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            console.log(`📡 Completing ride: ${id}`);

            // ─── Get the ride ──────────────────────────────────────
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

            // ─── Check if driver is assigned ─────────────────────────
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

            // ─── Update Ride ──────────────────────────────────────────
            const ride = await prisma.ride.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    paymentStatus: 'COMPLETED'
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

            // ─── Update driver stats ──────────────────────────────────
            await prisma.driver.update({
                where: { id: driver.id },
                data: {
                    isOnline: true,
                    totalTrips: { increment: 1 },
                    totalEarnings: { increment: existingRide.fare || 0 }
                }
            });

            // ─── Create payment record ───────────────────────────────
            await prisma.payment.create({
                data: {
                    rideId: ride.id,
                    userId: ride.riderId,
                    amount: ride.fare || 0,
                    method: ride.paymentMethod || 'CASH',
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });

            console.log(`🎉 Ride ${id} completed`);

            // ─── EMIT SOCKET EVENT ──────────────────────────────────
            this.emitToRider(req, ride.riderId, 'ride-completed', {
                rideId: ride.id,
                ride: ride,
                timestamp: new Date().toISOString()
            });

            this.emitToRider(req, ride.riderId, 'ride-status-update', {
                rideId: ride.id,
                status: 'COMPLETED'
            });

            // ─── Confirm to driver ──────────────────────────────────
            const io = req.app.get('io');
            if (io && driver) {
                io.to(`driver_${driver.id}`).emit('ride-completed-confirmation', {
                    rideId: ride.id,
                    status: 'COMPLETED'
                });
            }

            return res.json({
                success: true,
                message: 'Ride completed successfully',
                data: ride
            });

        } catch (error: any) {
            console.error('❌ Complete ride error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to complete ride'
            });
        }
    }

    // ─── CANCEL RIDE - WITH SOCKET EMITS ─────────────────────────────
    async cancelRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            console.log(`📡 Cancelling ride: ${id}`);

            // ─── Get the ride ──────────────────────────────────────
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

            // ─── Check if user is authorized ─────────────────────────
            const isRider = existingRide.riderId === req.user!.id;
            const isDriver = existingRide.driverId === req.user!.id;

            if (!isRider && !isDriver) {
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

            // ─── Update Ride ──────────────────────────────────────────
            const ride = await prisma.ride.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date()
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

            // ─── Set driver back online if assigned ─────────────────
            if (ride.driverId) {
                await prisma.driver.update({
                    where: { id: ride.driverId },
                    data: { isOnline: true }
                });
            }

            console.log(`❌ Ride ${id} cancelled`);

            // ─── EMIT SOCKET EVENT TO RIDER ──────────────────────────
            this.emitToRider(req, ride.riderId, 'ride-cancelled', {
                rideId: ride.id,
                ride: ride,
                reason: reason || 'Ride was cancelled',
                timestamp: new Date().toISOString()
            });

            this.emitToRider(req, ride.riderId, 'ride-status-update', {
                rideId: ride.id,
                status: 'CANCELLED',
                reason: reason || 'Ride was cancelled'
            });

            // ─── If driver exists, notify them too ──────────────────
            if (ride.driverId) {
                const io = req.app.get('io');
                if (io) {
                    const driverRooms = [
                        ride.driverId,
                        `driver_${ride.driverId}`,
                        `driver-${ride.driverId}`,
                    ];
                    driverRooms.forEach(room => {
                        io.to(room).emit('ride-cancelled', {
                            rideId: ride.id,
                            reason: reason || 'Ride was cancelled by rider'
                        });
                    });
                }
            }

            return res.json({
                success: true,
                message: 'Ride cancelled successfully',
                data: ride
            });

        } catch (error: any) {
            console.error('❌ Cancel ride error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel ride'
            });
        }
    }

    // ─── RATE RIDE ────────────────────────────────────────────────────
    async rateRide(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            
            const ride = await prisma.ride.findUnique({
                where: { id },
                select: { driverId: true, riderId: true }
            });
            
            if (!ride || !ride.driverId) {
                return res.status(404).json({ success: false, message: 'Ride not found' });
            }

            // Check if user is the rider
            if (ride.riderId !== req.user!.id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Only the rider can rate this ride' 
                });
            }

            const newRating = await prisma.rating.create({
                data: {
                    rideId: id,
                    riderId: req.user!.id,
                    driverId: ride.driverId,
                    rating: parseInt(rating),
                    comment: comment || ''
                }
            });

            // ─── Update driver's average rating ──────────────────────
            const allRatings = await prisma.rating.aggregate({
                where: { driverId: ride.driverId },
                _avg: { rating: true },
                _count: { rating: true }
            });

            if (allRatings._avg.rating) {
                await prisma.driver.update({
                    where: { id: ride.driverId },
                    data: { rating: allRatings._avg.rating }
                });
            }

            return res.json({ 
                success: true, 
                data: newRating,
                message: 'Rating submitted successfully'
            });
        } catch (error: any) {
            console.error('❌ Rate ride error:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    // ─── ACTIVATE SOS ─────────────────────────────────────────────────
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

            // ─── Notify admins and emergency contacts ──────────────
            const io = req.app.get('io');
            if (io) {
                io.emit('sos-alert', {
                    sosId: sos.id,
                    rideId: id,
                    userId: req.user!.id,
                    lat,
                    lng,
                    timestamp: new Date().toISOString()
                });
                console.log(`🆘 SOS alert triggered for ride ${id}`);
            }

            return res.json({ 
                success: true, 
                data: sos,
                message: 'SOS alert activated'
            });
        } catch (error: any) {
            console.error('❌ SOS error:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message 
            });
        }
    }
}

const rideController = new RideController();
export { rideController };
export default rideController;