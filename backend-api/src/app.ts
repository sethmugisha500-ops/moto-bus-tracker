// backend-api/src/app.ts
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 1. Core authentication / OTP routes
import authRoutes from './routes/auth.routes';
import otpRoutes from './routes/otp';

// 2. Wildcard namespace import to grab any named export inside buses
import * as busesRoutesNamespace from './routes/buses'; 

// 3. Exact matching paths based on your compiler logs
import usersRoutes from './routes/users';       
import driversRoutes from './routes/driver.routes';   
import ridersRoutes from './routes/rider.routes';     
import adminRoutes from './routes/admin.routes'; 

dotenv.config();

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

// Get allowed origins
const getAllowedOrigins = (): string | string[] => {
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
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean) as string[];

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
    if (allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
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
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.set('trust proxy', 1);

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  return res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    hostname: process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost',
    uptime: process.uptime(),
  });
});

app.get('/api/version', (req, res) => {
  return res.json({
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

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

/**
 * Bulletproof helper function to safely pull out the executable Express Router 
 * from any runtime module layout. Prevents 'Router.use() requires a middleware function' errors.
 */
const unwrapRouter = (moduleInstance: any) => {
  if (!moduleInstance) return undefined;
  if (typeof moduleInstance === 'function') return moduleInstance;
  
  return (
    moduleInstance.default || 
    moduleInstance.router || 
    moduleInstance.authRoutes || 
    moduleInstance.otpRoutes ||
    moduleInstance.usersRoutes ||
    moduleInstance.driversRoutes ||
    moduleInstance.ridersRoutes ||
    moduleInstance.adminRoutes ||
    moduleInstance
  );
};

// Mount Routes safely by wrapping each import variable
app.use('/api/otp', unwrapRouter(otpRoutes));
app.use('/api/auth', unwrapRouter(authRoutes));
app.use('/api/buses', unwrapRouter(busesRoutesNamespace));
app.use('/api/users', unwrapRouter(usersRoutes));
app.use('/api/drivers', unwrapRouter(driversRoutes));
app.use('/api/riders', unwrapRouter(ridersRoutes));
app.use('/api/admin', unwrapRouter(adminRoutes));

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Error:', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export { app, server, prisma, io };