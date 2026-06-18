import { Request, Response } from 'express';
import authController from './auth.controller';

// Types
interface Ride {
  id: string;
  riderId: string;
  riderName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  distance: number;
  duration: number;
  fare: number;
  paymentMethod: string;
  vehicleType: string;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverRating: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  rating?: {
    score: number;
    comment: string | null;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// In-memory storage
const rides: Ride[] = [];
let nextId = 1;

class RideController {
  requestRide: any;
    updateRideStatus: any;
    activateSOS: any;
    getRiderHistory: any;
  // Create new ride
  async createRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffAddress,
        dropoffLat,
        dropoffLng,
        distance,
        duration,
        fare,
        paymentMethod,
        vehicleType
      } = req.body;

      // Validation
      if (!pickupAddress || !dropoffAddress || !fare) {
        res.status(400).json({
          success: false,
          error: 'Pickup address, dropoff address and fare are required'
        });
        return;
      }

      const user = authController.getUsers().find(u => u.id === req.userId);

      const ride: Ride = {
        id: String(nextId++),
        riderId: req.userId!,
        riderName: user?.fullName,
        status: 'PENDING',
        pickupAddress,
        pickupLat: pickupLat || null,
        pickupLng: pickupLng || null,
        dropoffAddress,
        dropoffLat: dropoffLat || null,
        dropoffLng: dropoffLng || null,
        distance: distance || 0,
        duration: duration || 0,
        fare: parseFloat(fare),
        paymentMethod: paymentMethod || 'CASH',
        vehicleType: vehicleType || 'MOTO',
        driverId: null,
        driverName: null,
        driverPhone: null,
        driverRating: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      rides.push(ride);

      res.status(201).json({
        success: true,
        message: 'Ride created successfully',
        data: { ride }
      });
    } catch (error) {
      console.error('Create ride error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get ride by ID
  async getRideById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const ride = rides.find(r => r.id === id);

      if (!ride) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { ride }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get user rides
  async getUserRides(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRides = rides.filter(r => r.riderId === req.userId);
      
      res.json({
        success: true,
        data: {
          count: userRides.length,
          rides: userRides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get driver rides
  async getDriverRides(req: AuthRequest, res: Response): Promise<void> {
    try {
      const driverRides = rides.filter(r => r.driverId === req.userId);
      
      res.json({
        success: true,
        data: {
          count: driverRides.length,
          rides: driverRides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Accept ride (driver)
  async acceptRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rideIndex = rides.findIndex(r => r.id === id);

      if (rideIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      if (rides[rideIndex].status !== 'PENDING') {
        res.status(400).json({
          success: false,
          error: `Cannot accept ride with status: ${rides[rideIndex].status}`
        });
        return;
      }

      // Get driver info
      const driver = authController.getUsers().find(u => u.id === req.userId);

      rides[rideIndex].status = 'ACCEPTED';
      rides[rideIndex].driverId = req.userId!;
      rides[rideIndex].driverName = driver?.fullName || 'Driver';
      rides[rideIndex].driverPhone = driver?.phone || null;
      rides[rideIndex].updatedAt = new Date();

      res.json({
        success: true,
        message: 'Ride accepted successfully',
        data: { ride: rides[rideIndex] }
      });
    } catch (error) {
      console.error('Accept ride error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Start ride
  async startRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rideIndex = rides.findIndex(r => r.id === id);

      if (rideIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      if (rides[rideIndex].status !== 'ACCEPTED') {
        res.status(400).json({
          success: false,
          error: `Cannot start ride with status: ${rides[rideIndex].status}`
        });
        return;
      }

      if (rides[rideIndex].driverId !== req.userId) {
        res.status(403).json({
          success: false,
          error: 'Only assigned driver can start the ride'
        });
        return;
      }

      rides[rideIndex].status = 'IN_PROGRESS';
      rides[rideIndex].startedAt = new Date();
      rides[rideIndex].updatedAt = new Date();

      res.json({
        success: true,
        message: 'Ride started successfully',
        data: { ride: rides[rideIndex] }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Complete ride
  async completeRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const rideIndex = rides.findIndex(r => r.id === id);

      if (rideIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      if (rides[rideIndex].status !== 'IN_PROGRESS') {
        res.status(400).json({
          success: false,
          error: `Cannot complete ride with status: ${rides[rideIndex].status}`
        });
        return;
      }

      if (rides[rideIndex].driverId !== req.userId) {
        res.status(403).json({
          success: false,
          error: 'Only assigned driver can complete the ride'
        });
        return;
      }

      rides[rideIndex].status = 'COMPLETED';
      rides[rideIndex].completedAt = new Date();
      rides[rideIndex].updatedAt = new Date();

      // Process payment
      await this.processPayment(rides[rideIndex]);

      res.json({
        success: true,
        message: 'Ride completed successfully',
        data: { ride: rides[rideIndex] }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Cancel ride
  async cancelRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rideIndex = rides.findIndex(r => r.id === id);

      if (rideIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      if (rides[rideIndex].status === 'COMPLETED') {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel completed ride'
        });
        return;
      }

      rides[rideIndex].status = 'CANCELLED';
      rides[rideIndex].cancelledAt = new Date();
      rides[rideIndex].cancellationReason = reason || 'Cancelled by user';
      rides[rideIndex].updatedAt = new Date();

      res.json({
        success: true,
        message: 'Ride cancelled successfully',
        data: { ride: rides[rideIndex] }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Rate ride
  async rateRide(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const rideIndex = rides.findIndex(r => r.id === id);

      if (rideIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'Ride not found'
        });
        return;
      }

      if (rides[rideIndex].status !== 'COMPLETED') {
        res.status(400).json({
          success: false,
          error: 'Cannot rate incomplete ride'
        });
        return;
      }

      if (rides[rideIndex].riderId !== req.userId) {
        res.status(403).json({
          success: false,
          error: 'Only rider can rate the ride'
        });
        return;
      }

      rides[rideIndex].rating = {
        score: parseInt(rating),
        comment: comment || null,
        createdAt: new Date()
      };
      rides[rideIndex].updatedAt = new Date();

      res.json({
        success: true,
        message: 'Ride rated successfully',
        data: { ride: rides[rideIndex] }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get ride statistics
  async getRideStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userRides = rides.filter(r => r.riderId === req.userId);
      
      const stats = {
        totalRides: userRides.length,
        completedRides: userRides.filter(r => r.status === 'COMPLETED').length,
        cancelledRides: userRides.filter(r => r.status === 'CANCELLED').length,
        totalSpent: userRides
          .filter(r => r.status === 'COMPLETED')
          .reduce((sum, r) => sum + r.fare, 0),
        averageRating: userRides
          .filter(r => r.rating)
          .reduce((sum, r) => sum + (r.rating?.score || 0), 0) / (userRides.filter(r => r.rating).length || 1),
        totalDistance: userRides
          .filter(r => r.status === 'COMPLETED')
          .reduce((sum, r) => sum + r.distance, 0),
        totalDuration: userRides
          .filter(r => r.status === 'COMPLETED')
          .reduce((sum, r) => sum + r.duration, 0)
      };

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Admin: Get all rides
  async getAllRides(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          count: rides.length,
          rides: rides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Process payment (helper method)
  private async processPayment(ride: Ride): Promise<boolean> {
    console.log(`Processing payment of ${ride.fare} RWF for ride ${ride.id}`);
    
    // Update wallet balance
    const users = authController.getUsers();
    const rider = users.find(u => u.id === ride.riderId);
    
    if (rider && ride.paymentMethod === 'WALLET') {
      rider.wallet.balance -= ride.fare;
    }
    
    return true;
  }

  // Get rides storage (for testing)
  getRides(): Ride[] {
    return rides;
  }
}

export default new RideController();