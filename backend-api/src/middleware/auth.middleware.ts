import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        phone: string;
        role: string;
        name?: string;
    };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                phone: true,
                name: true,
                role: true,
            }
        });

        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
        return;
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        next();
    };
};