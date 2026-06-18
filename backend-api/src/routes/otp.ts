// src/routes/otp.ts
import express, { Request, Response } from 'express';
import { otpService } from '../services/otpService';
import { devOTP, isDevEnvironment, logOTPRequest, rateLimitOTP } from '../middleware/devAuth';
import { prisma } from '../config/prisma';
import redis from '../config/redis';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const sendOTPSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^\+?[0-9]+$/),
  email: z.string().email().optional(),
  userId: z.string().optional(),
  type: z.enum(['VERIFICATION', 'LOGIN', 'RESET_PASSWORD', 'TWO_FACTOR']).default('VERIFICATION'),
});

const verifyOTPSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6),
  name: z.string().optional(),
});

// Send OTP
router.post('/send', logOTPRequest, rateLimitOTP(5, 60000), async (req: Request, res: Response) => {
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
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered. Please login instead.',
        existingUser: true,
      });
    }

    const result = await otpService.sendOTP(cleanPhone, email, userId, type);

    const response: any = {
      success: true,
      method: result.method,
      message: `OTP sent via ${result.method}`,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
      type,
    };

    // For development, include OTP in response
    if (isDevEnvironment() || process.env.NODE_ENV === 'development') {
      response.devOTP = result.otp;
      response.devNote = 'Development mode: OTP included for testing';
      console.log(`📱 Dev OTP for ${cleanPhone}: ${result.otp}`);
    }

    res.json(response);
  } catch (error: any) {
    console.error('❌ OTP send error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again.',
    });
  }
});

// Verify OTP
router.post('/verify', logOTPRequest, async (req: Request, res: Response) => {
  try {
    const validated = verifyOTPSchema.parse(req.body);
    const { phone, email, otp, name } = validated;

    // Check for development bypass
    if (req.body.devVerified) {
      console.log('✅ Development OTP bypass verified');
      
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

      return res.json({
        success: true,
        message: 'OTP verified (development mode)',
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
    }

    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        message: 'Phone or email is required',
      });
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
        type: verification.type,
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
    } else {
      res.status(400).json({
        success: false,
        message: verification.message,
        verified: false,
      });
    }
  } catch (error: any) {
    console.error('❌ OTP verify error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    });
  }
});

// Resend OTP
router.post('/resend', logOTPRequest, rateLimitOTP(3, 30000), async (req: Request, res: Response) => {
  try {
    const { phone, email, userId, type = 'VERIFICATION' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Check rate limiting
    const rateLimitKey = `otp:resend:${phone}`;
    const lastResend = await redis.get(rateLimitKey);
    
    if (lastResend) {
      const ttl = await redis.ttl(rateLimitKey);
      return res.status(429).json({
        success: false,
        message: `Please wait ${ttl} seconds before requesting another OTP`,
      });
    }

    const result = await otpService.sendOTP(phone, email, userId, type);

    // Set rate limit for resend (30 seconds)
    await redis.setex(rateLimitKey, 30, '1');

    const response: any = {
      success: true,
      message: 'OTP resent successfully',
      method: result.method,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
    };

    if (isDevEnvironment()) {
      response.devOTP = result.otp;
      response.devNote = 'Development mode: OTP included for testing';
      console.log(`📱 Dev OTP (resend) for ${phone}: ${result.otp}`);
    }

    res.json(response);
  } catch (error: any) {
    console.error('❌ OTP resend error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resend OTP',
    });
  }
});

// Check OTP validity
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { phone, email, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    const identifier = phone || email;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Phone or email is required',
      });
    }

    const result = await otpService.checkOTP(identifier, otp);

    res.json({
      success: true,
      valid: result.valid,
      remainingSeconds: result.remainingSeconds,
      type: result.type,
      message: result.valid ? 'OTP is valid' : 'OTP is invalid or expired',
    });
  } catch (error) {
    console.error('❌ Check OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check OTP',
    });
  }
});

// Get development OTP
router.get('/dev-otp/:phone', async (req: Request, res: Response) => {
  if (!isDevEnvironment()) {
    return res.status(404).json({
      success: false,
      message: 'Not found',
    });
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
  } else {
    res.status(404).json({
      success: false,
      message: 'No OTP found for this phone number',
    });
  }
});

// Get active OTPs (admin only)
router.get('/active/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    
    // In production, require authentication
    if (!isDevEnvironment()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }

    const otps = await otpService.getActiveOTPs(phone);
    res.json({
      success: true,
      otps,
    });
  } catch (error) {
    console.error('❌ Get active OTPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active OTPs',
    });
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
    process.env.JWT_SECRET || 'motobus_secret_key',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}

export default router;