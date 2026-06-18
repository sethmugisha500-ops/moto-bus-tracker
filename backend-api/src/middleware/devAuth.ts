// src/middleware/devAuth.ts
import { Request, Response, NextFunction } from 'express';

// Development OTP bypass for testing
export const devOTP = (req: Request, res: Response, next: NextFunction) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'development' || process.env.OTP_ENV === 'dev') {
    const { otp, phone } = req.body;
    
    // Allow specific test OTPs for development
    const devOTPs = [
      '123456', 
      '000000', 
      '111111', 
      process.env.DEV_OTP || '123456'
    ];
    
    if (devOTPs.includes(otp)) {
      console.log('🔧 Development OTP bypass activated');
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
  return process.env.NODE_ENV === 'development' || process.env.OTP_ENV === 'dev';
};

// Get development OTP for testing
export const getDevOTP = (): string => {
  return process.env.DEV_OTP || '123456';
};

// Log OTP requests in development
export const logOTPRequest = (req: Request, res: Response, next: NextFunction) => {
  if (isDevEnvironment()) {
    console.log(`📱 OTP Request: ${req.method} ${req.path}`, {
      phone: req.body.phone,
      email: req.body.email,
      otp: req.body.otp ? '***' : undefined,
      userId: req.body.userId,
    });
  }
  next();
};

// Simple rate limiting middleware
export const rateLimitOTP = (maxRequests: number = 5, windowMs: number = 60000) => {
  const requests: Map<string, number[]> = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const timestamps = requests.get(ip)!;
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${Math.ceil(windowMs / 60000)} minute(s).`,
      });
    }

    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    next();
  };
};