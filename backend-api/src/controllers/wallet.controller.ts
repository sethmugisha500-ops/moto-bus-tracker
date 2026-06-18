import { Request, Response } from 'express';
import authController from './auth.controller';

// Types
interface Transaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  paymentMethod: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  previousBalance: number;
  newBalance: number;
  reference: string;
  createdAt: Date;
}

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// In-memory storage
const transactions: Transaction[] = [];
let nextTransactionId = 1;

class WalletController {
  // Get wallet balance
  async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = authController.getUsers();
      const user = users.find(u => u.id === req.userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          balance: user.wallet.balance,
          currency: user.wallet.currency
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Top up wallet
  async topUp(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { amount, paymentMethod, mobileMoneyNumber } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
        return;
      }

      if (!paymentMethod) {
        res.status(400).json({
          success: false,
          error: 'Payment method is required'
        });
        return;
      }

      const users = authController.getUsers();
      const userIndex = users.findIndex(u => u.id === req.userId);

      if (userIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Process payment based on method
      let paymentSuccess = false;
      
      if (paymentMethod === 'MOBILE_MONEY') {
        if (!mobileMoneyNumber) {
          res.status(400).json({
            success: false,
            error: 'Mobile money number is required'
          });
          return;
        }
        paymentSuccess = true;
      } else if (paymentMethod === 'CARD') {
        paymentSuccess = true;
      } else {
        paymentSuccess = true;
      }

      if (!paymentSuccess) {
        res.status(400).json({
          success: false,
          error: 'Payment processing failed'
        });
        return;
      }

      // Update wallet balance
      const previousBalance = users[userIndex].wallet.balance;
      users[userIndex].wallet.balance += parseFloat(amount);
      users[userIndex].updatedAt = new Date();

      // Create transaction record
      const transaction: Transaction = {
        id: String(nextTransactionId++),
        userId: req.userId!,
        type: 'CREDIT',
        amount: parseFloat(amount),
        description: `Wallet top-up via ${paymentMethod}`,
        paymentMethod,
        status: 'COMPLETED',
        previousBalance,
        newBalance: users[userIndex].wallet.balance,
        reference: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };
      
      transactions.push(transaction);

      res.json({
        success: true,
        message: `Successfully added ${amount} RWF to wallet`,
        data: {
          balance: users[userIndex].wallet.balance,
          transaction
        }
      });
    } catch (error) {
      console.error('Top up error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Withdraw from wallet
  async withdraw(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { amount, bankAccount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Valid amount is required'
        });
        return;
      }

      const users = authController.getUsers();
      const userIndex = users.findIndex(u => u.id === req.userId);

      if (userIndex === -1) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (users[userIndex].wallet.balance < amount) {
        res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
        return;
      }

      const previousBalance = users[userIndex].wallet.balance;
      users[userIndex].wallet.balance -= parseFloat(amount);
      users[userIndex].updatedAt = new Date();

      // Create transaction record
      const transaction: Transaction = {
        id: String(nextTransactionId++),
        userId: req.userId!,
        type: 'DEBIT',
        amount: parseFloat(amount),
        description: `Withdrawal to ${bankAccount || 'Mobile Money'}`,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
        previousBalance,
        newBalance: users[userIndex].wallet.balance,
        reference: `WDL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      };
      
      transactions.push(transaction);

      res.json({
        success: true,
        message: `Withdrawal request of ${amount} RWF submitted`,
        data: {
          balance: users[userIndex].wallet.balance,
          transaction
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get transaction history
  async getTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as string;
      
      let userTransactions = transactions.filter(t => t.userId === req.userId);
      
      if (type) {
        userTransactions = userTransactions.filter(t => t.type === type as 'CREDIT' | 'DEBIT');
      }
      
      userTransactions = userTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const paginated = userTransactions.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          count: userTransactions.length,
          transactions: paginated,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < userTransactions.length
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get transaction by ID
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = transactions.find(t => t.id === id);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { transaction }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get wallet statistics
  async getWalletStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userTransactions = transactions.filter(t => t.userId === req.userId);
      
      const stats = {
        totalCredited: userTransactions
          .filter(t => t.type === 'CREDIT' && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.amount, 0),
        totalDebited: userTransactions
          .filter(t => t.type === 'DEBIT' && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + t.amount, 0),
        pendingWithdrawals: userTransactions
          .filter(t => t.type === 'DEBIT' && t.status === 'PENDING')
          .reduce((sum, t) => sum + t.amount, 0),
        transactionCount: userTransactions.length,
        lastTransaction: userTransactions[0] || null
      };

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Admin: Get all transactions
  async getAllTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (req.userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          count: transactions.length,
          transactions: transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default new WalletController();