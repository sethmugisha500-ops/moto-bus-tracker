import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      server: 'running',
    }
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Moto-Bus Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rides: '/api/rides',
      drivers: '/api/drivers',
      riders: '/api/riders',
      payments: '/api/payments',
    },
  });
});

// ============ AUTH ENDPOINTS ============
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  
  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone number is required' 
    });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 OTP for ${phone}: ${otp}`);
  
  res.json({
    success: true,
    message: 'OTP sent successfully',
    devOtp: otp,
    expiresIn: '10 minutes'
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Phone and OTP are required' 
    });
  }
  
  // For testing - accept any 6-digit code
  if (otp.length === 6) {
    const token = Buffer.from(JSON.stringify({ 
      userId: Date.now().toString(), 
      phone 
    })).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: Date.now().toString(),
        name: `User_${phone.slice(-4)}`,
        phone: phone,
        role: 'rider',
      },
      message: 'Login successful'
    });
  } else {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid OTP' 
    });
  }
});

// ============ RIDER ENDPOINTS ============
app.get('/api/riders/nearby-drivers', (req, res) => {
  res.json({
    success: true,
    drivers: [
      { id: '1', name: 'John Mugabo', vehicleType: 'MOTO', vehicleNumber: 'MT-001A', rating: 4.8, distance: '300m', eta: '2 min' },
      { id: '2', name: 'Peter Nshuti', vehicleType: 'MOTO', vehicleNumber: 'MT-002B', rating: 4.9, distance: '500m', eta: '3 min' },
      { id: '3', name: 'Sarah Uwimana', vehicleType: 'BUS', vehicleNumber: 'BUS-101', rating: 4.7, distance: '800m', eta: '5 min' },
    ],
  });
});

app.post('/api/riders/request-ride', (req, res) => {
  const ride = {
    id: `RIDE${Date.now()}`,
    ...req.body,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  res.json({ success: true, ride });
});

app.get('/api/riders/rides', (req, res) => {
  res.json({
    success: true,
    rides: [
      { id: '1', pickup: 'Kigali City Tower', destination: 'Kimironko', fare: 1200, status: 'COMPLETED', date: '2024-01-15' },
      { id: '2', pickup: 'Airport', destination: 'Downtown', fare: 2500, status: 'COMPLETED', date: '2024-01-14' },
    ],
  });
});

// ============ DRIVER ENDPOINTS ============
app.post('/api/drivers/location', (req, res) => {
  res.json({ success: true, message: 'Location updated' });
});

app.get('/api/drivers/nearby-rides', (req, res) => {
  res.json({
    success: true,
    rides: [
      { id: 'RIDE1', pickup: 'Kigali City Tower', destination: 'Kimironko', fare: 1200, distance: '400m' },
    ],
  });
});

app.post('/api/drivers/accept-ride/:rideId', (req, res) => {
  res.json({ success: true, message: 'Ride accepted' });
});

app.put('/api/drivers/ride/:rideId/status', (req, res) => {
  res.json({ success: true, message: 'Status updated' });
});

app.get('/api/drivers/earnings', (req, res) => {
  res.json({
    success: true,
    earnings: {
      today: { amount: 8500, trips: 4 },
      week: { amount: 45600, trips: 18 },
    },
  });
});

// ============ PAYMENT ENDPOINTS ============
app.get('/api/payments/wallet/balance', (req, res) => {
  res.json({ success: true, balance: 15000, currency: 'RWF' });
});

app.post('/api/payments/wallet/topup', (req, res) => {
  res.json({ success: true, message: 'Wallet topped up', balance: 20000 });
});

// ============ ADMIN ENDPOINTS ============
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: 8,
      totalDrivers: 5,
      totalRides: 45,
      totalRevenue: 125000,
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.url} not found` 
  });
});

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🚲 MOTO-BUS TRACKER API SERVER                           ║
╠══════════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                          ║
║  Health:    http://localhost:${PORT}/health                    ║
║                                                              ║
║  Test OTP:  Any 6-digit number (e.g. 123456)                ║
║                                                              ║
║  Endpoints:                                                 ║
║    POST   /api/auth/send-otp                                ║
║    POST   /api/auth/verify-otp                              ║
║    GET    /api/riders/nearby-drivers                        ║
║    POST   /api/riders/request-ride                          ║
║    POST   /api/drivers/location                             ║
║    GET    /api/drivers/earnings                             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});