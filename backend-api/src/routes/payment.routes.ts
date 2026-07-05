// backend-api/src/routes/payment.routes.ts
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const auth = authenticate as any;

// ─── Helper: Get user ID from request ──────────────────────────────
const getUserId = (req: Request): string | undefined => {
  return (req as any).user?.id;
};

// ─── GET /api/payment/wallet/balance ──────────────────────────────
router.get('/wallet/balance', auth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    return res.json({
      success: true,
      balance: wallet?.balance || 0,
      currency: 'RWF'
    });
  } catch (error: any) {
    console.error('Balance error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ─── POST /api/payment/wallet/topup ────────────────────────────────
router.post('/wallet/topup', auth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { amount, paymentMethod = 'card,mobilemoney' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, phone: true }
    });

    // ─── Get or create wallet ──────────────────────────────────────
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        }
      });
    }

    // ─── Create transaction record ──────────────────────────────────
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amount,
        type: 'CREDIT',
        description: `Wallet top-up of RWF ${amount}`,
        reference: `tx-${Date.now()}-${userId}`,
        status: 'pending',
      }
    });

    // ─── Initialize Flutterwave payment ─────────────────────────────
    const payload = {
      tx_ref: transaction.reference,
      amount: amount,
      currency: 'RWF',
      redirect_url: `${process.env.FRONTEND_URL || 'https://moto-bus-passenger.onrender.com'}/payment/callback`,
      payment_options: paymentMethod,
      customer: {
        email: user?.email || 'customer@motobus.com',
        name: user?.name || 'MotoBus Rider',
        phonenumber: user?.phone || '',
      },
      customizations: {
        title: 'MotoBus Wallet Top-up',
        description: `Top-up wallet with RWF ${amount}`,
        logo: 'https://moto-bus-passenger.onrender.com/logo.png',
      },
    };

    console.log('Flutterwave payload:', payload);

    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Flutterwave response:', response.data);

    if (response.data.status === 'success') {
      return res.json({
        success: true,
        data: {
          link: response.data.data.link,
          reference: transaction.reference,
          transactionId: transaction.id,
        }
      });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'failed' }
      });
      throw new Error(response.data.message || 'Payment initialization failed');
    }

  } catch (error: any) {
    console.error('Flutterwave error:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || 'Payment initialization failed'
    });
  }
});

// ─── POST /api/payment/webhook ──────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'];
    if (signature !== process.env.FLW_WEBHOOK_SECRET) {
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { status, tx_ref, transaction_id } = req.body;

    console.log('Webhook received:', { status, tx_ref, transaction_id });

    if (status === 'successful') {
      const transaction = await prisma.transaction.findFirst({
        where: { reference: tx_ref }
      });

      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });

      const wallet = await prisma.wallet.findUnique({
        where: { id: transaction.walletId }
      });

      if (wallet) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: transaction.amount }
          }
        });
      }

      console.log(`✅ Wallet topped up: ${transaction.walletId} +${transaction.amount}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ success: false });
  }
});

// ─── GET /api/payment/callback ──────────────────────────────────────
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { status, tx_ref, transaction_id } = req.query;

    const transaction = await prisma.transaction.findFirst({
      where: { reference: tx_ref as string }
    });

    if (transaction && status === 'successful') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed' }
      });

      const wallet = await prisma.wallet.findUnique({
        where: { id: transaction.walletId }
      });

      if (wallet) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: transaction.amount }
          }
        });
      }
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://moto-bus-passenger.onrender.com';
    const redirectUrl = status === 'successful' 
      ? `${frontendUrl}/wallet?success=true&ref=${tx_ref}`
      : `${frontendUrl}/wallet?error=true&ref=${tx_ref}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://moto-bus-passenger.onrender.com'}/wallet?error=true`);
  }
});

// ─── GET /api/payment/transactions ──────────────────────────────────
router.get('/transactions', async () => {
  authenticate
}, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 20, offset = 0 } = req.query;

    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.json({
        success: true,
        data: [],
        total: 0,
        limit: Number(limit),
        offset: Number(offset),
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.transaction.count({
      where: { walletId: wallet.id }
    });

    return res.json({
      success: true,
      data: transactions,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('Transactions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;