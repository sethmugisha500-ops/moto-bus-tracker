// src/middleware/devAuth.ts
import { Request, Response, NextFunction } from 'express';

// Development otp bypass for testing
export const devotp = (req: Request, res: Response, next: NextFunction) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'development' || process.env.otp_ENV === 'dev') {
    const { otp, phone } = req.body;
    
    // Allow specific test otps for development
    const devotps = [
      '123456', 
      '000000', 
      '111111', 
      process.env.DEV_otp || '123456'
    ];
    
    if (devotps.includes(otp)) {
      console.log('🔧 Development otp bypass activated');
      req.body.devVerified = true;
      return next();
    }

    // Also allow if phone is in dev phone list
    const devPhones = (process.env.DEV_PHONES || '+250788123456,+250788123457').split(',');
    if (devPhones.includes(phone)) {
      console.log('🔧 Development phone bypass activated');
      req.body.devVerified = true;
      return next();
    }

    // Allow if environment variable DEV_BYPASS is set
    if (process.env.DEV_BYPASS === 'true') {
      console.log('🔧 Global development bypass activated');
      req.body.devVerified = true;
      return next();
    }
  }
  next();
};

// Check if request is from development environment
export const isDevEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.otp_ENV === 'dev';
};

// Get development otp for testing
export const getDevotp = (): string => {
  return process.env.DEV_otp || '123456';
};

// Log otp requests in development
export const logotpRequest = (req: Request, res: Response, next: NextFunction) => {
  if (isDevEnvironment()) {
    console.log(`📱 otp Request: ${req.method} ${req.path}`, {
      phone: req.body.phone,
      email: req.body.email,
      otp: req.body.otp ? '***' : undefined,
      userId: req.body.userId,
    });
  }
  next();
};

// Simple rate limiting middleware
export const rateLimitotp = (maxRequests: number = 5, windowMs: number = 60000) => {
  const requests: Map<string, number[]> = new Map();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const timestamps = requests.get(ip)!;
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${Math.ceil(windowMs / 60000)} minute(s).`,
      });
      return;
    }

    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    next();
    return;
  };
};