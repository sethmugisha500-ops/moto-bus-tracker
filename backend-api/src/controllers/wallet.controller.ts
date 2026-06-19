import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class WalletController {
    async getAllTransactions(req: AuthRequest, res: Response) { return res.json({ success: true, data: [] }); }
    async getTransactionById(req: AuthRequest, res: Response) { return res.json({ success: true, data: {} }); }
    async getWalletStats(req: AuthRequest, res: Response) { return res.json({ success: true, data: {} }); }
  async getBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      return res.json({ success: true, balance: wallet?.balance || 0 });
    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get balance' });
    }
  }

  async topUp(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { amount, paymentMethod } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      const wallet = await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } }
      });

      return res.json({ success: true, balance: wallet.balance });
    } catch (error) {
      console.error('Top up error:', error);
      return res.status(500).json({ success: false, message: 'Failed to top up wallet' });
    }
  }

  async withdraw(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { amount, bankAccount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet || wallet.balance < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient balance' });
      }

      const updated = await prisma.wallet.update({
        where: { userId },
        data: { balance: { decrement: amount } }
      });

      return res.json({ success: true, balance: updated.balance });
    } catch (error) {
      console.error('Withdraw error:', error);
      return res.status(500).json({ success: false, message: 'Failed to withdraw' });
    }
  }

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { limit = 20, offset = 0 } = req.query;

      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return res.json({ success: true, transactions: [] });
      }

      const transactions = await prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });

      return res.json({ success: true, transactions });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ success: false, message: 'Failed to get transactions' });
    }
  }
}

export const walletController = new WalletController();