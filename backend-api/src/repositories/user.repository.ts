import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcryptjs';

export class UserRepository {
  // ============================================
  // FIND METHODS
  // ============================================

  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: { driver: true, wallet: true },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { driver: true, wallet: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            ratings: { take: 10, orderBy: { createdAt: 'desc' } },
            rides: { take: 10, orderBy: { createdAt: 'desc' } }
          }
        },
        wallet: {
          include: {
            transactions: { take: 10, orderBy: { createdAt: 'desc' } }
          }
        },
        payments: { take: 10, orderBy: { createdAt: 'desc' } },
        ratings: { take: 10, orderBy: { createdAt: 'desc' } },
        rides: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { driver: { include: { user: { select: { id: true, name: true, phone: true } } } } }
        }
      },
    });
  }

  // ... (keep your other find methods as they are)

  // ============================================
  // CREATE METHODS - FIXED
  // ============================================

  async create(data: {
    phone: string;
    name: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }) {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10) 
      : '';

    const createData: Prisma.UserCreateInput = {
      phone: data.phone,
      name: data.name,
      email: data.email || null,
      password: hashedPassword,
      role: data.role || 'RIDER',
      wallet: { create: { balance: 0 } },
    };

    return prisma.user.create({
      data: createData,
      include: {
        wallet: true,
        driver: data.role === 'DRIVER' ? true : false
      },
    });
  }

  async createWithDriver(data: {
    phone: string;
    name: string;
    email?: string;
    password?: string;
    licenseNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    vehicleModel: string;
  }) {
    const hashedPassword = data.password 
      ? await bcrypt.hash(data.password, 10) 
      : '';

    return prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email || null,
        password: hashedPassword,
        role: 'DRIVER',
        wallet: { create: { balance: 0 } },
        driver: {
          create: {
            licenseNumber: data.licenseNumber,
            vehicleType: data.vehicleType as any,
            vehicleNumber: data.vehicleNumber,
            vehicleModel: data.vehicleModel,
          }
        }
      },
      include: { driver: true, wallet: true }
    });
  }

  // ============================================
  // UPDATE METHODS - FIXED
  // ============================================

  async update(id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: { wallet: true, driver: true }
    });
  }

  // Keep the rest of your methods (getStats, getDriverStats, etc.) unchanged
  // ... paste the rest of your original methods here
}

export const userRepository = new UserRepository();
export default userRepository;