// backend-api/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string | null;
    phone: string;
    name?: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : null;

    console.log('🔑 Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('🔑 Token:', token ? 'Present (starts with ' + token.substring(0, 20) + '...)' : 'Missing');

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    // ✅ Use process.env.JWT_SECRET directly (consistent with auth.controller.ts)
    const JWT_SECRET = process.env.JWT_SECRET || 'motobus_secret_key_fallback';
    console.log('🔑 Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('🔑 Decoded token:', decoded);

    // ✅ Get user ID from either 'userId' or 'id' field
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      throw new AppError('Invalid token: No user ID', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
      }
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false, 
        message: error.message 
      });
      return;
    }

    // ✅ Return consistent error message
    res.status(401).json({ 
      success: false, 
      message: error.message === 'jwt expired' ? 'Session expired. Please login again.' : 'Invalid or expired token'
    });
  }
};

// ─── Role-based authorization middleware ──────────────────────────
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
      return;
    }

    next();
  };
};

// ─── Convenience middleware ──────────────────────────────────────
export const requireAdmin = requireRole('ADMIN');
export const requireDriver = requireRole('DRIVER', 'ADMIN');

// ─── Authorization helper ────────────────────────────────────────
export const authorize = requireRole;