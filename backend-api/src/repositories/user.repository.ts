import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export class UserRepository {
  // ============================================
  // FIND METHODS
  // ============================================

  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: {
        driver: true,
        wallet: true,
      },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    
    return prisma.user.findFirst({  // Changed from findUnique → findFirst
      where: { email: email.toLowerCase().trim() },
      include: {
        driver: true,
        wallet: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            ratings: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            },
            rides: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        wallet: {
          include: {
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        ratings: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        rides: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      },
    });
  }

  async findByIdWithMinimal(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        wallet: {
          select: {
            id: true,
            balance: true
          }
        }
      },
    });
  }

  async findByRole(role: UserRole, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role },
        include: {
          driver: role === 'DRIVER' ? true : false,
          wallet: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { role } })
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findWithFilters(filters: {
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    isVerified?: boolean;
    limit?: number;
    page?: number;
  }) {
    const { search, role, isActive, isVerified, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          driver: true,
          wallet: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ============================================
  // CREATE METHODS
  // ============================================

  async create(data: {
    phone: string;
    name: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }) {
    const createData: Prisma.UserCreateInput = {
      phone: data.phone,
      name: data.name,
      email: data.email || null,
      password: data.password || '',           // ← Fixed: password is required
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
    return prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email || null,
        password: data.password || '',           // ← Fixed
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
      include: {
        driver: true,
        wallet: true
      },
    });
  }

  // ============================================
  // UPDATE METHODS
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
    if (data.password !== undefined) updateData.password = data.password;  // ← Uncommented & fixed
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        wallet: true,
        driver: true
      },
    });
  }

  async verifyUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        isVerified: true
      }
    });
  }

  async deactivateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // ============================================
  // DELETE METHODS
  // ============================================

  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ... (rest of your methods remain unchanged - getStats, getDriverStats, exists, etc.)
  async getStats() {
    const [
      totalUsers,
      totalDrivers,
      totalRiders,
      totalAdmins,
      activeDrivers,
      verifiedUsers,
      activeUsers,
      newUsersToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.driver.count({ where: { isOnline: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const growth = await Promise.all(
      last7Days.map(async (date) => {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        
        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: start,
              lt: end
            }
          }
        });
        
        return {
          date: date.toISOString().split('T')[0],
          count
        };
      })
    );

    return {
      totalUsers,
      totalDrivers,
      totalRiders,
      totalAdmins,
      activeDrivers,
      verifiedUsers,
      activeUsers,
      newUsersToday,
      growth,
      driverStats: {
        online: activeDrivers,
        offline: totalDrivers - activeDrivers,
        completionRate: totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0
      }
    };
  }

  // (All other methods like getDriverStats, exists, etc. remain the same)
  async getDriverStats(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        ratings: true,
        rides: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    });

    if (!driver) return null;

    const totalRatings = driver.ratings.length;
    const averageRating = totalRatings > 0
      ? driver.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings
      : 0;

    return {
      ...driver,
      stats: {
        totalTrips: driver.totalTrips,
        totalEarnings: driver.totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        completionRate: driver.rides.length > 0
          ? Math.round((driver.rides.filter(r => r.status === 'COMPLETED').length / driver.rides.length) * 100)
          : 0
      }
    };
  }

  async exists(phone: string, email?: string) {
    const where: Prisma.UserWhereInput = {
      OR: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    };

    const count = await prisma.user.count({ where });
    return count > 0;
  }

  async isPhoneTaken(phone: string) {
    const count = await prisma.user.count({ where: { phone } });
    return count > 0;
  }

  async isEmailTaken(email: string) {
    if (!email) return false;
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }

  async count(where?: Prisma.UserWhereInput) {
    return prisma.user.count({ where });
  }

  async countDrivers(where?: Prisma.DriverWhereInput) {
    return prisma.driver.count({ where });
  }

  async findMany(where?: Prisma.UserWhereInput, limit = 50, page = 1) {
    const skip = (page - 1) * limit;
    return prisma.user.findMany({
      where,
      include: {
        wallet: true,
        driver: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteMany(where: Prisma.UserWhereInput) {
    return prisma.user.deleteMany({ where });
  }
}

export const userRepository = new UserRepository();
export default userRepository;