import { Request, Response } from 'express';
import prisma from '../config/database';
import { UserRepository } from '../repositories/user.repository';
import { RideRepository } from '../repositories/ride.repository';
import { DriverRepository } from '../repositories/driver.repository';
import { PaymentRepository } from '../repositories/payment.repository';

const userRepo = new UserRepository();
const rideRepo = new RideRepository();
const driverRepo = new DriverRepository();
const paymentRepo = new PaymentRepository();

export class AdminController {
  async getDashboardStats(req: Request, res: Response) {
    try {
      const userStats = await userRepo.getStats();
      const rideStats = await rideRepo.getDashboardStats();
      const paymentStats = await paymentRepo.getStats();

      // Get recent activity
      const recentRides = await prisma.ride.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          rider: { include: { user: true } },
          driver: { include: { user: true } },
        },
      });

      const recentDrivers = await prisma.driver.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true, vehicle: true },
      });

      const recentUsers = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        stats: {
          ...userStats,
          ...rideStats,
          ...paymentStats,
        },
        recent: {
          rides: recentRides,
          drivers: recentDrivers,
          users: recentUsers,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, role } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            driver: { include: { vehicle: true } },
            wallet: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          driver: { include: { vehicle: true } },
          wallet: true,
          ridesAsRider: { take: 10, orderBy: { createdAt: 'desc' } },
          ridesAsDriver: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { fullName, email, role, isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { fullName, email, role, isActive },
      });

      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllDrivers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, isApproved, isOnline } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (isApproved !== undefined) where.isApproved = isApproved === 'true';
      if (isOnline !== undefined) where.isOnline = isOnline === 'true';

      const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
          where,
          skip,
          take: Number(limit),
          include: { user: true, vehicle: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.driver.count({ where }),
      ]);

      res.json({
        success: true,
        drivers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async approveDriver(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const driver = await prisma.driver.update({
        where: { id },
        data: { isApproved: true },
        include: { user: true },
      });

      // Send notification to driver
      // await notificationService.sendToUser(driver.userId, {
      //   title: 'Driver Application Approved',
      //   message: 'Congratulations! You can now accept rides.',
      // });

      res.json({ success: true, driver });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async rejectDriver(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { isApproved: false },
        include: { user: true },
      });

      // Send rejection notification
      // await notificationService.sendToUser(driver.userId, {
      //   title: 'Driver Application Update',
      //   message: reason || 'Your application requires additional information.',
      // });

      res.json({ success: true, driver });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAllRides(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;

      const [rides, total] = await Promise.all([
        prisma.ride.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            rider: { include: { user: true } },
            driver: { include: { user: true, vehicle: true } },
            payment: true,
            rating: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.ride.count({ where }),
      ]);

      res.json({
        success: true,
        rides,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRideDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ride = await prisma.ride.findUnique({
        where: { id },
        include: {
          rider: { include: { user: true } },
          driver: { include: { user: true, vehicle: true } },
          locations: { orderBy: { timestamp: 'asc' } },
          payment: true,
          rating: true,
        },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      res.json({ success: true, ride });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getSystemStats(req: Request, res: Response) {
    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [daily, weekly, monthly] = await Promise.all([
        prisma.ride.aggregate({
          where: { createdAt: { gte: startOfDay } },
          _count: true,
          _sum: { fare: true },
        }),
        prisma.ride.aggregate({
          where: { createdAt: { gte: startOfWeek } },
          _count: true,
          _sum: { fare: true },
        }),
        prisma.ride.aggregate({
          where: { createdAt: { gte: startOfMonth } },
          _count: true,
          _sum: { fare: true },
        }),
      ]);

      res.json({
        success: true,
        stats: {
          daily: { rides: daily._count, revenue: daily._sum.fare || 0 },
          weekly: { rides: weekly._count, revenue: weekly._sum.fare || 0 },
          monthly: { rides: monthly._count, revenue: monthly._sum.fare || 0 },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}