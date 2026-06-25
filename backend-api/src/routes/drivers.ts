// backend-api/src/routes/drivers.ts
import express, { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Store driver status in memory
let driverStatus = {
  isOnline: false,
  location: { lat: -1.9441, lng: 30.0619 }
};

// ─── PROFILE ──────────────────────────────────────────────────────
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        id: 'DRV001',
        userId: 'USR001',
        name: 'Jean Pierre Niyonzima',
        phone: '+250788888889',
        email: 'driver@motobus.com',
        licenseNumber: 'DL-2024-001234',
        vehicleType: 'MOTO',
        vehicleNumber: 'MT-001A',
        vehicleModel: 'Yamaha FZ-S',
        isApproved: true,
        isOnline: driverStatus.isOnline,
        rating: 4.8,
        totalTrips: 45,
        totalEarnings: 36000,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── STATUS ──────────────────────────────────────────────────────
router.put('/status', async (req: AuthRequest, res: Response) => {
  try {
    const { isOnline } = req.body;
    console.log('🔄 Status update received:', isOnline);
    
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isOnline must be a boolean'
      });
    }
    
    driverStatus.isOnline = isOnline;
    
    res.json({
      success: true,
      message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
      data: { isOnline }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── LOCATION ─────────────────────────────────────────────────────
router.post('/location', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, isOnline } = req.body;
    console.log('📍 Location update received:', { lat, lng, isOnline });
    
    if (lat && lng) {
      driverStatus.location = { lat, lng };
    }
    
    if (isOnline !== undefined) {
      driverStatus.isOnline = isOnline;
    }
    
    res.json({
      success: true,
      message: `Location updated. Driver is ${driverStatus.isOnline ? 'online' : 'offline'}`,
      data: {
        location: driverStatus.location,
        isOnline: driverStatus.isOnline
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── STATS ──────────────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      stats: {
        rating: 4.8,
        isOnline: driverStatus.isOnline,
        isApproved: true,
        totalTrips: 45,
        totalEarnings: 36000,
        todayRides: 4,
        vehicle: {
          type: 'MOTO',
          number: 'MT-001A',
          model: 'Yamaha FZ-S',
        },
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── EARNINGS ──────────────────────────────────────────────────
router.get('/earnings', async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      earnings: {
        today: { amount: 8500, trips: 4 },
        week: { amount: 45600, trips: 18 }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── NEARBY RIDES ──────────────────────────────────────────────
router.get('/nearby-rides', async (req: AuthRequest, res: Response) => {
  try {
    if (!driverStatus.isOnline) {
      return res.json({
        success: true,
        rides: [],
      });
    }
    
    res.json({
      success: true,
      rides: [
        {
          id: 'RIDE1',
          riderName: 'John Doe',
          riderPhone: '+250788123456',
          pickup: 'Kigali City Tower',
          destination: 'Kimironko',
          fare: 1200,
          distance: '400m',
        },
        {
          id: 'RIDE2',
          riderName: 'Jane Smith',
          riderPhone: '+250788123457',
          pickup: 'Kimironko Market',
          destination: 'Downtown',
          fare: 1500,
          distance: '600m',
        },
      ]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ACCEPT RIDE ──────────────────────────────────────────────
router.post('/accept-ride/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      message: `Ride ${id} accepted successfully`,
      data: { rideId: id, status: 'ACCEPTED' }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;