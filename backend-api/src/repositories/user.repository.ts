import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcryptjs';

export class UserRepository {
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
      include: { driver: true, wallet: true }
    });
  }

  // CREATE - FIXED
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

    return prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        email: data.email || null,
        password: hashedPassword,
        role: data.role || 'RIDER',
        wallet: { create: { balance: 0 } },
      },
      include: {
        wallet: true,
        driver: data.role === 'DRIVER' ? true : false
      },
    });
  }

  // UPDATE - FIXED
  async update(id: string, data: any) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: { wallet: true, driver: true }
    });
  }

  // Keep your other methods (getStats, findWithFilters, etc.)
  // ... paste the rest here if needed
}

export const userRepository = new UserRepository();
export default userRepository;