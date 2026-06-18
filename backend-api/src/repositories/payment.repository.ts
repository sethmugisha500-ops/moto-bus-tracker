import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

export class PaymentRepository {
  async create(data: {
    rideId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    status?: PaymentStatus;
    transactionId?: string;
  }) {
    return prisma.payment.create({
      data: {
        rideId: data.rideId,
        userId: data.userId,
        amount: data.amount,
        method: data.method,
        status: data.status || 'PENDING',
        transactionId: data.transactionId || null,
      },
    });
  }

  async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        ride: true,
        user: true,
      },
    });
  }

  async findByUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        ride: true,
      },
    });
  }

  async findByRide(rideId: string) {
    return prisma.payment.findUnique({
      where: { rideId },
      include: {
        user: true,
      },
    });
  }

  async updateStatus(paymentId: string, status: PaymentStatus, transactionId?: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId: transactionId || null,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async getStats() {
    const [totalPayments, completedPayments, pendingPayments, failedPayments] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    const totalAmount = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' },
    });

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }

  async count(where?: any) {
    return prisma.payment.count({ where });
  }

  async aggregate(data: any) {
    return prisma.payment.aggregate(data);
  }
}

export const paymentRepository = new PaymentRepository();