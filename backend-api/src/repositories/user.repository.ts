import prisma from '../config/database';

export class UserRepository {
  async findByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
      include: { driver: true, wallet: true },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        driver: { include: {  } },
        wallet: true,
      },
    });
  }

  async create(data: { phone: string; name: string; email?: string }) {
    return prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email,
        wallet: { create: {} },
      },
      include: { wallet: true },
    });
  }

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async getStats() {
    const [totalUsers, totalDrivers, totalRiders, activeDrivers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.driver.count({ where: { isOnline: true } }),
    ]);

    return { totalUsers, totalDrivers, totalRiders, activeDrivers };
  }
}

export default UserRepository;