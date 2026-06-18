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

// Get allowed origins
const getAllowedOrigins = () => {
  const origins = [
    // Development
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:19000',
    'http://localhost:19001',
    'http://localhost:19002',
    
    // Render.com URLs
    'https://moto-bus-backend.onrender.com',
    'https://moto-bus-frontend.onrender.com',
    'https://moto-bus-admin.onrender.com',
    
    // Expo
    'https://expo.io',
    'https://exp.host',
    
    // Any other origins from environment
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean);

  // If ALLOW_ALL_CORS is true, allow all origins
  if (process.env.ALLOW_ALL_CORS === 'true') {
    console.log('⚠️ ALLOW_ALL_CORS is enabled - accepting all origins');
    return '*';
  }

  return origins;
};

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    const allowed = getAllowedOrigins();
    
    // If allowed is '*', accept all
    if (allowed === '*') {
      callback(null, true);
      return;
    }

    // Allow requests with no origin (like mobile apps, curl)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is allowed
    if (allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      // In production with ALLOW_ALL_CORS, allow all
      if (process.env.ALLOW_ALL_CORS === 'true') {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Trust proxy (for Render)
app.set('trust proxy', 1);

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

// Health check - Important for Render
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    hostname: process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost',
    uptime: process.uptime(),
  });
});

// API Version
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO with CORS
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

// Socket connection handler
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/otp', require('./routes/otp').default);
app.use('/api/auth', require('./routes/auth').default);
app.use('/api/buses', require('./routes/buses').default);
app.use('/api/users', require('./routes/users').default);
app.use('/api/drivers', require('./routes/drivers').default);
app.use('/api/riders', require('./routes/riders').default);
app.use('/api/admin', require('./routes/admin').default);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export { app, server, prisma, io };