// backend-api/src/app.ts
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// ─── CORS Configuration ──────────────────────────────────────────────
const getAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002',
    'https://moto-bus-backend.onrender.com',
    'https://moto-bus-frontend.onrender.com',
    'https://moto-bus-admin.onrender.com',
    'https://expo.io',
    'https://exp.host',
  ];

  if (process.env.ALLOW_ALL_CORS === 'true') {
    console.log('⚠️ ALLOW_ALL_CORS is enabled - accepting all origins');
    return '*';
  }

  return origins;
};

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    const allowed = getAllowedOrigins();
    
    if (allowed === '*') {
      callback(null, true);
      return;
    }

    if (!origin || (process.env.NODE_ENV !== 'production')) {
      callback(null, true);
      return;
    }

    if (Array.isArray(allowed) && allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.set('trust proxy', 1);

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// ─── ROUTE IMPORTS ──────────────────────────────────────────────────
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users';
import busRoutes from './routes/buses';
import ridesRoutes from './routes/rides';
import supportRoutes from './routes/support';
import landingRoutes from './routes/landing';
import notificationRoutes from './routes/notifications';
import otpRoutes from './routes/otp';
import driverRoutes from './routes/drivers';
import riderRoutes from './routes/riders';
import adminRoutes from './routes/admin';

console.log('📦 Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/notifications', notificationRoutes);

console.log('✅ All routes mounted');

// ─── SOCKET.IO ──────────────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── Socket.IO Authentication ──────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    console.log('❌ Socket: No token provided');
    return next(new Error('Authentication error: No token'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    (socket as any).userId = decoded.id;
    (socket as any).user = decoded;
    console.log(`✅ Socket authenticated: ${decoded.id}`);
    next();
  } catch (error) {
    console.log('❌ Socket: Invalid token');
    return next(new Error('Authentication error: Invalid token'));
  }
});

// ─── Store connected clients ──────────────────────────────────────
const connectedClients = new Map();
const driverSockets = new Map();
const riderSockets = new Map();

app.set('io', io);
app.set('connectedClients', connectedClients);
app.set('driverSockets', driverSockets);
app.set('riderSockets', riderSockets);

// ─── ✅ FIXED: Emit Helper ──────────────────────────────────────────
const emitToRider = (riderId: string, event: string, data: any) => {
  if (!riderId) {
    console.log('❌ Cannot emit: riderId is empty');
    return;
  }
  
  console.log(`📤 Emitting ${event} to rider ${riderId}`);
  
  const rooms = [
    riderId,
    `user_${riderId}`,
    `user-${riderId}`,
    `rider_${riderId}`,
    `rider-${riderId}`
  ];
  
  try {
    rooms.forEach(room => {
      io.to(room).emit(event, data);
      console.log(`  ✅ Emitted to room: ${room}`);
    });
    
    // Also emit directly to connected sockets
    io.fetchSockets().then((sockets) => {
      let found = 0;
      sockets.forEach((s: any) => {
        if (s.userId === riderId) {
          s.emit(event, data);
          found++;
          console.log(`  ✅ Emitted directly to socket: ${s.id}`);
        }
      });
      if (found === 0) {
        console.log(`  ⚠️ No connected sockets for rider ${riderId}`);
      } else {
        console.log(`  ✅ Found ${found} connected sockets for rider ${riderId}`);
      }
    }).catch((err) => {
      console.log(`  ⚠️ Could not fetch sockets: ${err.message}`);
    });
  } catch (error) {
    console.error(`❌ Error emitting ${event}:`, error);
  }
};

app.set('emitToRider', emitToRider);

// ─── Socket.IO Connection Handler ──────────────────────────────────
io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  console.log(`🟢 Socket connected: ${socket.id}, User: ${userId}`);

  // ── Auto-join user rooms ──
  if (userId) {
    const rooms = [
      userId,
      `user_${userId}`,
      `user-${userId}`,
    ];
    rooms.forEach(room => {
      socket.join(room);
      console.log(`📌 Auto-joined: ${room}`);
    });
  }

  // ── Join user room ──
  socket.on('join', (userId: string) => {
    if (userId) {
      const rooms = [
        userId,
        `user_${userId}`,
        `user-${userId}`,
      ];
      rooms.forEach(room => {
        socket.join(room);
        console.log(`📌 Joined room: ${room}`);
      });
      connectedClients.set(socket.id, { userId, socketId: socket.id });
      console.log(`👤 User ${userId} joined rooms`);
    }
  });

  // ── Join driver room ──
  socket.on('join-driver', (driverId: string) => {
    if (driverId) {
      const rooms = [
        driverId,
        `user_${driverId}`,
        `user-${driverId}`,
        `driver_${driverId}`,
        `driver-${driverId}`
      ];
      rooms.forEach(room => {
        socket.join(room);
        console.log(`📌 Joined driver room: ${room}`);
      });
      driverSockets.set(driverId, socket.id);
      console.log(`🚗 Driver ${driverId} joined rooms`);
    }
  });

  // ── Join rider room ──
  socket.on('join-rider', (riderId: string) => {
    if (riderId) {
      const rooms = [
        riderId,
        `user_${riderId}`,
        `user-${riderId}`,
        `rider_${riderId}`,
        `rider-${riderId}`
      ];
      rooms.forEach(room => {
        socket.join(room);
        console.log(`📌 Joined rider room: ${room}`);
      });
      riderSockets.set(riderId, socket.id);
      console.log(`🚕 Rider ${riderId} joined rooms`);
    }
  });

  // ── Update driver location ──
  socket.on('driver-location', async (data) => {
    const { driverId, lat, lng, rideId } = data;
    console.log(`📍 Driver ${driverId} location: ${lat}, ${lng}`);
    
    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: { currentLat: lat, currentLng: lng }
      });
      
      if (rideId) {
        const ride = await prisma.ride.findUnique({
          where: { id: rideId },
          select: { riderId: true }
        });
        
        if (ride) {
          emitToRider(ride.riderId, 'driver-location-update', {
            driverId,
            lat,
            lng,
            rideId
          });
        }
      }
    } catch (error) {
      console.error('Error updating driver location:', error);
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    
    for (const [key, value] of driverSockets) {
      if (value === socket.id) driverSockets.delete(key);
    }
    for (const [key, value] of riderSockets) {
      if (value === socket.id) riderSockets.delete(key);
    }
  });

  // ── Error handling ──
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

console.log('📡 WebSocket server initialized');

// ─── Socket Stats Endpoint ──────────────────────────────────────────
app.get('/api/socket-stats', (req, res) => {
  try {
    const sockets = io.sockets.sockets;
    const users = new Set();
    sockets.forEach((s: any) => {
      if (s.userId) users.add(s.userId);
    });
    
    res.json({
      connected: true,
      totalSockets: sockets.size,
      uniqueUsers: users.size,
      users: Array.from(users),
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ─── DEBUG: Socket connections ──────────────────────────────────────
app.get('/api/debug/sockets', (req, res) => {
  try {
    const sockets = io.sockets.sockets;
    const allRooms = io.sockets.adapter.rooms;
    
    const socketInfo: any[] = [];
    sockets.forEach((socket: any) => {
      socketInfo.push({
        id: socket.id,
        userId: socket.userId,
        rooms: Array.from(socket.rooms)
      });
    });
    
    res.json({
      success: true,
      totalSockets: sockets.size,
      totalRooms: allRooms.size,
      sockets: socketInfo,
      rooms: Array.from(allRooms.keys())
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── DEBUG: Pending rides ──────────────────────────────────────────
app.get('/api/debug/rides', async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({
      where: { status: 'PENDING' },
      include: {
        rider: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    res.json({
      success: true,
      totalPending: rides.length,
      rides: rides.map((r: any) => ({
        id: r.id,
        riderName: r.rider?.name || 'Unknown',
        riderId: r.riderId,
        status: r.status,
        fare: r.fare,
        pickupAddress: r.pickupAddress,
        dropoffAddress: r.dropoffAddress,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── DEBUG: Test emit to passenger ──────────────────────────────────
app.post('/api/debug/emit-test', async (req, res) => {
  try {
    const { passengerId, driverName } = req.body;
    
    if (!passengerId) {
      return res.status(400).json({
        success: false,
        message: 'passengerId required'
      });
    }
    
    console.log(`🧪 Manual emit test to passenger: ${passengerId}`);
    
    const testData = {
      rideId: 'test-ride-' + Date.now(),
      driver: {
        id: 'test-driver-1',
        driverId: 'test-driver-1',
        name: driverName || 'Test Driver',
        phone: '+250788123456',
        vehicleNumber: 'RAB 123T',
        vehicleType: 'MOTO',
        rating: 4.8,
        currentLat: -1.9441,
        currentLng: 30.0619,
        profilePhoto: null,
      },
      timestamp: new Date().toISOString()
    };
    
    const emitToRider = req.app.get('emitToRider');
    
    if (emitToRider) {
      emitToRider(passengerId, 'ride-accepted', testData);
      emitToRider(passengerId, 'rideAccepted', testData);
    }
    
    res.json({
      success: true,
      message: `Test emit sent to passenger ${passengerId}`
    });
    
  } catch (error: any) {
    console.error('❌ Test emit error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── DEBUG: Route test ──────────────────────────────────────────────
app.get('/api/debug/routes', (req, res) => {
  res.json({
    success: true,
    message: 'Debug routes are working',
    endpoints: [
      'GET /api/debug/sockets',
      'GET /api/debug/rides',
      'POST /api/debug/emit-test',
      'GET /api/debug/routes'
    ]
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export { app, server, prisma, io, emitToRider };