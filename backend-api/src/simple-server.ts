import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;  // Changed to 5000

app.use(cors());
app.use(express.json());

// Store data in memory
const users: any[] = [];
const drivers: any[] = [];
const rides: any[] = [];

// ============ AUTH ENDPOINTS ============

// Send OTP
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 OTP for ${phone}: ${otp}`);

  // Return the response to ensure all code paths return a value
  return res.json({ 
    success: true, 
    message: 'OTP sent successfully',
    devOtp: otp
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });
    }

    // Accept any 6-digit OTP for testing
    if (otp.length === 6) {
      const token = Buffer.from(JSON.stringify({ userId: Date.now(), phone })).toString('base64');

      // Check if user exists, if not create
      let user = users.find(u => u.phone === phone);
      if (!user) {
        user = { id: Date.now().toString(), phone, name: `User_${phone.slice(-4)}`, role: 'rider' };
        users.push(user);
      }

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  });

// ============ RIDER ENDPOINTS ============

// Get nearby drivers
app.get('/api/riders/nearby-drivers', (req, res) => {
  res.json({
    success: true,
    drivers: [
      { id: '1', name: 'John Mugabo', vehicleType: 'MOTO', rating: 4.8, distance: '300m', eta: '2 min' },
      { id: '2', name: 'Peter Nshuti', vehicleType: 'MOTO', rating: 4.9, distance: '500m', eta: '3 min' },
    ],
  });
});

// Request a ride
app.post('/api/riders/request-ride', (req, res) => {
  const ride = {
    id: `RIDE${Date.now()}`,
    ...req.body,
    status: 'PENDING',
    createdAt: new Date(),
  };
  rides.push(ride);
  res.json({ success: true, ride });
});

// Get ride history
app.get('/api/riders/rides', (req, res) => {
  res.json({ success: true, rides });
});

// ============ DRIVER ENDPOINTS ============

app.post('/api/drivers/location', (req, res) => {
  res.json({ success: true, message: 'Location updated' });
});

app.get('/api/drivers/nearby-rides', (req, res) => {
  const pendingRides = rides.filter(r => r.status === 'PENDING');
  res.json({ success: true, rides: pendingRides });
});

app.post('/api/drivers/accept-ride/:rideId', (req, res) => {
  res.json({ success: true, message: 'Ride accepted' });
});

app.get('/api/drivers/earnings', (req, res) => {
  res.json({
    success: true,
    earnings: { today: { amount: 8500, trips: 4 }, week: { amount: 45600, trips: 18 } },
  });
});

// ============ ADMIN ENDPOINTS ============

app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalDrivers: 0,
      totalRides: rides.length,
      totalRevenue: 0,
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Info
app.get('/api', (req, res) => {
  res.json({ success: true, message: 'Moto-Bus API is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚲 MOTO-BUS TRACKER API SERVER                           ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║  Health: http://localhost:${PORT}/health                      ║
║                                                              ║
║  Test OTP: 123456                                           ║
║                                                              ║
║  Endpoints:                                                 ║
║    POST /api/auth/send-otp                                  ║
║    POST /api/auth/verify-otp                                ║
║    GET  /api/riders/nearby-drivers                          ║
║    POST /api/riders/request-ride                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});