// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  req: { id: string; phone: string; name: string; role: import(".prisma/client").$Enums.UserRole; };
  user?: {
    email: string | null;
    id: string;
    phone: string;
    role: string;
    name?: string;
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

    if (!token) {
      throw new AppError('Authentication required', 401);
    }
    const JWT_SECRET = process.env.JWT_SECRET || 'motobus_secret_key';

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    console.log('🔑 Decoded token:', decoded);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    console.error('Auth error:', error.message);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ 
        success: false, 
        message: error.message 
      });
      return;
    }

    res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// ✅ Role-based authorization middleware
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

// ✅ Convenience middleware for admin
export const requireAdmin = requireRole('ADMIN');

// ✅ Convenience middleware for driver
export const requireDriver = requireRole('DRIVER', 'ADMIN');

// ✅ Authorization helper
export const authorize = requireRole;