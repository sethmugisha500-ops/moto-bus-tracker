// backend-api/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// ✅ Use consistent JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'motobus_secret_key_fallback';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── Generate Tokens ──────────────────────────────────────────────
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

// ─── Sanitize User ──────────────────────────────────────────────────
function sanitizeUser(user: any) {
  const { password, ...safe } = user;
  return safe;
}

// ─── Format User Data ──────────────────────────────────────────────
function formatUserData(user: any) {
  const sanitized = sanitizeUser(user);
  
  if (user.role === 'DRIVER' && user.driver) {
    return {
      ...sanitized,
      driverId: user.driver.id,
      isApproved: user.driver.isApproved,
      isOnline: user.driver.isOnline,
      vehicle: {
        type: user.driver.vehicleType,
        number: user.driver.vehicleNumber,
        model: user.driver.vehicleModel,
      },
      rating: user.driver.rating,
      totalTrips: user.driver.totalTrips,
      totalEarnings: user.driver.totalEarnings,
      licenseNumber: user.driver.licenseNumber,
    };
  }
  
  return sanitized;
}

// ─── Notify Admin ──────────────────────────────────────────────────
async function notifyAdminAboutNewUser(user: any) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length === 0) return;

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `New ${user.role} Registration`,
          message: `${user.name} (${user.phone}) has registered as a ${user.role}.`,
          type: 'USER_REGISTRATION',
        }
      });
    }

    console.log(`📧 New ${user.role} registered: ${user.name} (${user.phone})`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

// ─── Auth Controller ──────────────────────────────────────────────
class AuthController {
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
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

      const formattedUser = formatUserData(user);
      return res.json({ success: true, user: formattedUser });
    } catch (error: any) {
      console.error('Get current user error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { phone, password } = req.body;

      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const user = await prisma.user.findUnique({
        where: { phone },
        include: { wallet: true, driver: true },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this phone number' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'This account has been deactivated' });
      }

      // Check password
      if (password) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: 'Invalid password' });
        }
      }

      const tokens = generateTokens(user.id, user.role);
      const formattedUser = formatUserData(user);
      
      console.log(`✅ User logged in: ${user.phone} - ${user.role} - ${user.name}`);
      
      return res.json({
        success: true,
        message: 'Login successful',
        data: { tokens, user: formattedUser },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { phone, name, email, password, role, licenseNumber, vehicleType, vehicleNumber, vehicleModel } = req.body;

      if (!phone || !name || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone, name, and password are required' 
        });
      }

      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: 'An account with this phone number already exists' 
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let userData: any = {
        phone,
        name,
        email: email || undefined,
        password: hashedPassword,
        role: role === 'DRIVER' ? 'DRIVER' : 'RIDER',
        isActive: true,
        isVerified: true,
        wallet: { create: { balance: 0 } },
      };

      if (role === 'DRIVER') {
        userData.driver = {
          create: {
            licenseNumber: licenseNumber || '',
            vehicleType: vehicleType || 'MOTO',
            vehicleNumber: vehicleNumber || '',
            vehicleModel: vehicleModel || '',
            isApproved: process.env.NODE_ENV === 'development' ? true : false,
            isOnline: false,
            rating: 0,
            totalTrips: 0,
            totalEarnings: 0,
          }
        };
      }

      const user = await prisma.user.create({
        data: userData,
        include: { wallet: true, driver: true },
      });

      const tokens = generateTokens(user.id, user.role);
      const formattedUser = formatUserData(user);

      await notifyAdminAboutNewUser(user);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: { tokens, user: formattedUser },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();