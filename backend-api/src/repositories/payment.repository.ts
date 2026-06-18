import prisma from '../config/database';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentRepository {
    async getStats() {
        return {
            totalPayments: await this.count(),
            completedPayments: await this.count({ where: { status: "COMPLETED" } }),
            pendingPayments: await this.count({ where: { status: "PENDING" } }),
            totalAmount: await this.aggregate({ _sum: { amount: true } })
        };
    }
  async create(data: {
    id: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    transactionId
    status?: PaymentStatus;
  }) {
    return prisma.payment.create({
      data: {
        id: data.id,
        userId: data.userId,
        amount: data.amount,
        method: data.method,
        : data
        transactionId: data.transactionId,
        status: data.status || 'PENDING',
      },
    });
  }

  async findByid(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: { ride: true,  },
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