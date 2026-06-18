import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class PaymentService {
  async processPayment(rideId: string, method: string, amount: number, phoneNumber?: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { riderId: true }
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    const payment = await prisma.payment.create({
      data: {
        rideId,
        userId: ride.riderId,
        amount,
        method: method as any,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.ride.update({
      where: { id: rideId },
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