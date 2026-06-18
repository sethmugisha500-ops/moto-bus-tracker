import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class PaymentService {
  async processPayment(id: string, method: string, amount: number, phoneNumber?: string) {
    const payment = await prisma.payment.create({
      data: {
        id,
        userId: (await prisma.ride.findUnique({ where: { id: id } }))!.riderId,
        amount,
        method: method as any,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    await prisma.ride.update({
      where: { id: id },
      data: { paymentStatus: 'COMPLETED' },
    });
    return payment;
  }

  async getWalletBalance(userId: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    return wallet?.balance || 0;
  }

  async topUpWallet(userId: string, amount: number) {
    return prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }
}