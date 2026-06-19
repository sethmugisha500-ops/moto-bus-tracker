import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const totalUsers = await prisma.user.count();
      const totalDrivers = await prisma.driver.count();
      const totalRides = await prisma.ride.count();
      const totalRevenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      });

      const recentRides = await prisma.ride.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          rider: { select: { name: true, phone: true } },
          driver: { include: { user: { select: { name: true } } } }
        }
      });

      return res.json({
        success: true,
        data: {
          totalUsers,
          totalDrivers,
          totalRides,
          totalRevenue: totalRevenue._sum.amount || 0,
          recentRides
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        include: {
          driver: true,
          wallet: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ success: true, data: users });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get users' });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          driver: true,
          wallet: true,
          payments: true,
          ratings: true
        }
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      return res.json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get user' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, phone, email, role, isActive } = req.body;
      
      const user = await prisma.user.update({
        where: { id },
        data: { name, phone, email, role, isActive }
      });
      return res.json({ success: true, data: user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  async getAllDrivers(req: Request, res: Response) {
    try {
      const drivers = await prisma.driver.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ success: true, data: drivers });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get drivers' });
    }
  }

  async approveDriver(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const driver = await prisma.driver.update({
        where: { id },
        data: { isApproved: true }
      });
      return res.json({ success: true, data: driver });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to approve driver' });
    }
  }

  async rejectDriver(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const driver = await prisma.driver.update({
        where: { id },
        data: { isApproved: false }
      });
      return res.json({ success: true, data: driver });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to reject driver' });
    }
  }

  async getAllRides(req: Request, res: Response) {
    try {
      const rides = await prisma.ride.findMany({
        include: {
          rider: { select: { name: true, phone: true } },
          driver: { include: { user: { select: { name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ success: true, data: rides });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get rides' });
    }
  }

  async getRideDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id },
        include: {
          rider: true,
          driver: { include: { user: true } },
          payment: true,
          rating: true
        }
      });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }
      return res.json({ success: true, data: ride });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get ride' });
    }
  }

  async getSystemStats(req: Request, res: Response) {
    try {
      const [
        totalUsers,
        totalDrivers,
        totalRides,
        totalPayments,
        totalRatings
      ] = await Promise.all([
        prisma.user.count(),
        prisma.driver.count(),
        prisma.ride.count(),
        prisma.payment.count(),
        prisma.rating.count()
      ]);

      const revenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      });

      return res.json({
        success: true,
        data: {
          totalUsers,
          totalDrivers,
          totalRides,
          totalPayments,
          totalRatings,
          totalRevenue: revenue._sum.amount || 0
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get system stats' });
    }
  }
}

export const adminController = new AdminController();