import type { Prisma } from '@prisma/client';
import prisma from '../config/database';

export class WalletRepository {
  async findByUserId(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  async addBalance(userId: string, amount: number, description: string, reference?: string) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'CREDIT', // Adjusted to match your schema's required type field
          reference,
          status: 'COMPLETED',
        },
      });

      return wallet;
    });
  }

  async deductBalance(userId: string, amount: number, description: string, reference?: string) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Swapped the manual type block for Prisma's clean TransactionClient 
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'DEBIT', // Adjusted to match your schema's required type field
          reference,
          status: 'COMPLETED',
        },
      });

      return updatedWallet;
    });
  }
}

export default WalletRepository;