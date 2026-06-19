// src/routes/otp.ts
import express, { Request, Response } from 'express';
import { otpService } from '../services/otpService';
import { devotp, isDevEnvironment, logotpRequest, rateLimitotp } from '../middleware/devAuth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import redis from '../config/redis';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const sendOTPSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\+?[0-9]+$/),
  email: z.string().email().optional(),
  userId: z.enum(['LOGIN', 'RESET_PASSWORD', 'TWO_FACTOR', 'VERIFICATION']).default('VERIFICATION'),
  type: z.enum(['LOGIN', 'RESET_PASSWORD', 'TWO_FACTOR', 'VERIFICATION']).default('VERIFICATION'),
});

const verifyOTPSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6),
  name: z.string().optional(),
});

// Send otp
router.post('/send', logotpRequest, rateLimitotp(5, 60000), async (req: Request, res: Response) => {
  try {
    const validated = sendOTPSchema.parse(req.body);
    const { phone, email, userId, type } = validated;
    
    // Clean phone number
    const cleanPhone = phone.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (existingUser && type === 'VERIFICATION') {
      res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please login instead.',
        existingUser
      });
      return;
    }

    const result = await otpService.sendOTP(cleanPhone, email, userId, type);

    const response: any = {
      success: true,
      method: result.method,
      message: `otp sent via ${result.method}`,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
      type,
    };

    // For development, include otp in response
    if (isDevEnvironment() || process.env.NODE_ENV === 'development') {
      response.devotp = result.otp;
      response.devNote = 'Development mode: otp included for testing';
      console.log(`📱 Dev otp for ${cleanPhone}: ${result.otp}`);
    }

    res.json(response);
    return;
  } catch (error: any) {
    console.error('❌ otp send error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.issues, // Fixed: updated from errors to issues
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send otp. Please try again.',
    });
    return;
  }
});

// Verify otp
router.post('/verify', logotpRequest, async (req: Request, res: Response) => {
  try {
    const validated = verifyOTPSchema.parse(req.body);
    const { phone, email, otp, name } = validated;

    // Check for development bypass
    if (req.body.devVerified) {
      console.log('✅ Development otp bypass verified');
      
      // Create or get user in dev mode
      let user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: phone!,
            name: name || 'Dev User',
            email: email || null,
            isVerified: true,
          },
        });
        console.log(`👤 Created dev user: ${user.id}`);
      }

      res.json({
        success: true,
        message: 'otp verified (development mode)',
        verified: true,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
      return;
    }

    if (!phone && !email) {
      res.status(400).json({
        success: false,
        message: 'Phone or email is required',
      });
      return;
    }

    const identifier = phone || email!;
    const verification = await otpService.verifyOTP(identifier, otp);

    if (verification.valid) {
      // Check if user exists, create if not
      let user = await prisma.user.findUnique({
        where: { phone: phone! },
      });

      if (!user && phone) {
        user = await prisma.user.create({
          data: {
            phone,
            name: name || 'User',
            email: email || null,
            isVerified: true,
          },
        });
        console.log(`👤 Created new user: ${user.id}`);
      } else if (user && !user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });
      }

      // Generate JWT token for authentication
      const token = generateJWT(user!);

      res.json({
        success: true,
        message: verification.message,
        verified: true,
        user: user ? {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: user.isVerified,
        } : null,
        token: token,
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        message: verification.message,
        verified: false,
      });
      return;
    }
  } catch (error: any) {
    console.error('❌ otp verify error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.issues, // Fixed: updated from errors to issues
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify otp. Please try again.',
    });
    return;
  }
});

// Resend otp
router.post('/resend', logotpRequest, rateLimitotp(3, 30000), async (req: Request, res: Response) => {
  try {
    const { phone, email, userId, type = 'VERIFICATION' } = req.body;

    if (!phone) {
      res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
      return;
    }

    // Check rate limiting
    const rateLimitKey = `otp:resend:${phone}`;
    const lastResend = await redis.get(rateLimitKey);
    
    if (lastResend) {
      const ttl = await redis.ttl(rateLimitKey);
      res.status(429).json({
        success: false,
        message: `Please wait ${ttl} seconds before requesting another otp`,
      });
      return;
    }

    const result = await otpService.sendOTP(phone, email, userId, type);

    // Set rate limit for resend (30 seconds)
    await redis.setex(rateLimitKey, 30, '1');

    const response: any = {
      success: true,
      message: 'otp resent successfully',
      method: result.method,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
    };

    if (isDevEnvironment()) {
      response.devotp = result.otp;
      response.devNote = 'Development mode: otp included for testing';
      console.log(`📱 Dev otp (resend) for ${phone}: ${result.otp}`);
    }

    res.json(response);
    return;
  } catch (error: any) {
    console.error('❌ otp resend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend otp',
    });
    return;
  }
});

// Check otp validity
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) {
      res.status(400).json({
        success: false,
        message: 'otp is required',
      });
      return;
    }

    const identifier = phone || email;
    if (!identifier) {
      res.status(400).json({
        success: false,
        message: 'Phone or email is required',
      });
      return;
    }

    const result = await otpService.checkOTP(identifier, otp);

    res.json({
      success: true,
      valid: result.valid,
      remainingSeconds: result.remainingSeconds,
      message: result.valid ? 'otp is valid' : 'otp is invalid or expired',
    });
    return;
  } catch (error) {
    console.error('❌ Check otp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check otp',
    });
    return;
  }
});

// Get development otp
router.get('/dev-otp/:phone', async (req: Request, res: Response) => {
  if (!isDevEnvironment()) {
    res.status(404).json({
      success: false,
      message: 'Not found',
    });
    return;
  }

  const { phone } = req.params;
  const otp = await otpService.getDevOTP(phone);
  
  if (otp) {
    res.json({
      success: true,
      otp,
      phone,
      source: await redis.get(`otp:${phone}`) ? 'redis' : 'database',
    });
    return;
  } else {
    res.status(404).json({
      success: false,
      message: 'No otp found for this phone number',
    });
    return;
  }
});

// Get active otps (admin only)
router.get('/active/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    
    // In production, require authentication
    if (!isDevEnvironment()) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
      return;
    }

    const otps = await otpService.getActiveOTPs(phone);
    res.json({
      success: true,
      otps,
    });
    return;
  } catch (error) {
    console.error('❌ Get active otps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active otps',
    });
    return;
  }
});

// Helper function to generate JWT
function generateJWT(user: any): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    (process.env.JWT_SECRET as string) || 'motobus_secret_key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

export default router;