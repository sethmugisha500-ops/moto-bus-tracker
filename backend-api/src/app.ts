// backend-api/src/app.ts
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// CORS Configuration
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

    if (!origin) {
      callback(null, true);
      return;
    }

    if (Array.isArray(allowed) && allowed.includes(origin)) {
      callback(null, true);
    } else {
      // Allow in development
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ROUTE IMPORTS - Using your current files
// ============================================

// Check what routes you have in src/routes/
// Based on your git output, you have:
// - auth.routes.ts (not auth.ts)
// - users.ts
// - buses.ts (you created)
// - etc.

// Import routes - adjust names based on your actual files
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users';
import busRoutes from './routes/buses';

// Also try to import other routes if they exist
let otpRoutes: any;
let driverRoutes: any;
let riderRoutes: any;
let adminRoutes: any;

try {
  otpRoutes = require('./routes/otp').default;
} catch (e) {
  console.log('⚠️ OTP routes not found, skipping');
  otpRoutes = (req: any, res: any) => res.status(404).json({ error: 'OTP routes not implemented' });
}

try {
  driverRoutes = require('./routes/drivers').default;
} catch (e) {
  console.log('⚠️ Driver routes not found, skipping');
  driverRoutes = (req: any, res: any) => res.status(404).json({ error: 'Driver routes not implemented' });
}

try {
  riderRoutes = require('./routes/riders').default;
} catch (e) {
  console.log('⚠️ Rider routes not found, skipping');
  riderRoutes = (req: any, res: any) => res.status(404).json({ error: 'Rider routes not implemented' });
}

try {
  adminRoutes = require('./routes/admin').default;
} catch (e) {
  console.log('⚠️ Admin routes not found, skipping');
  adminRoutes = (req: any, res: any) => res.status(404).json({ error: 'Admin routes not implemented' });
}

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/riders', riderRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// SOCKET.IO
// ============================================

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

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export { app, server, prisma, io };