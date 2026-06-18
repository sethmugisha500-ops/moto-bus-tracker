import prisma from '../config/database';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentRepository {
  async create(data: {
    rideId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    mobileMoneyNumber?: string;
    transactionId?: string;
    status?: PaymentStatus;
  }) {
    return prisma.payment.create({
      data: {
        rideId: data.rideId,
        userId: data.userId,
        amount: data.amount,
        method: data.method,
        mobileMoneyNumber: data.mobileMoneyNumber,
        transactionId: data.transactionId,
        status: data.status || 'PENDING',
      },
    });
  }

  async findByRideId(rideId: string) {
    return prisma.payment.findUnique({
      where: { rideId },
      include: { ride: true, user: true },
    });
  }

  async findByUser(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: { ride: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(paymentId: string, status: PaymentStatus, transactionId?: string) {
    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }
}

export default PaymentRepository;