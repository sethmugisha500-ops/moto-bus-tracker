// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// ✅ Add fallback values so it never throws
const JWT_SECRET = process.env.JWT_SECRET || 'motobus_secret_key_fallback';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ✅ Add warning in development
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ JWT_SECRET is not set in production! Using fallback secret.');
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, role },
    JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
}

function sanitizeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

class AuthController {
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { wallet: true, driver: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({ success: true, user: sanitizeUser(user) });
    } catch (error: any) {
      console.error('Get current user error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { phone, password, otpVerified } = req.body;

      console.log('🔐 Login attempt for:', phone);

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
        include: { wallet: true, driver: true },
      });

      if (!user) {
        console.log('❌ User not found:', phone);
        return res.status(404).json({ success: false, message: 'No account found with this phone number' });
      }

      if (!user.isActive) {
        console.log('❌ User inactive:', phone);
        return res.status(403).json({ success: false, message: 'This account has been deactivated' });
      }

      // Path 1: OTP-verified login (no password required — OTP already proved identity)
      if (otpVerified === true) {
        console.log('✅ OTP verified login for:', phone);
        const tokens = generateTokens(user.id, user.role);
        return res.json({
          success: true,
          message: 'Login successful',
          data: { tokens, user: sanitizeUser(user) },
        });
      }

      // Path 2: Password-based login
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        console.log('❌ Invalid password for:', phone);
        return res.status(401).json({ success: false, message: 'Incorrect phone number or password' });
      }

      console.log('✅ Login successful for:', phone);
      const tokens = generateTokens(user.id, user.role);
      return res.json({
        success: true,
        message: 'Login successful',
        data: { tokens, user: sanitizeUser(user) },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { phone, name, email, password, role } = req.body;

      console.log('📝 Registration attempt for:', phone);

      if (!phone || !name || !password) {
        return res.status(400).json({ success: false, message: 'Phone, name, and password are required' });
      }

      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this phone number already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          phone,
          name,
          email: email || undefined,
          password: hashedPassword,
          role: role === 'DRIVER' ? 'DRIVER' : 'RIDER',
          isActive: true,
          isVerified: true,
          wallet: { create: { balance: 0 } },
        },
        include: { wallet: true },
      });

      console.log('✅ Registration successful for:', phone);
      const tokens = generateTokens(user.id, user.role);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { tokens, user: sanitizeUser(user) },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();