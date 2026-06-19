import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import flutterwaveService from '../services/Flutterwave.service';
import { PaymentRepository } from '../repositories/payment.repository';

const paymentRepo = new PaymentRepository();

export class PaymentController {
  // Initialize ride payment
  async initializeRidePayment(req: AuthRequest, res: Response) {
    try {
      const { id, paymentMethod } = req.body;
      const userId = req.user!.id;

      const ride = await prisma.ride.findUnique({
        where: { id },
        include: { rider: true },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const payment = await flutterwaveService.initializePayment({
        tx_ref: `RIDE-${id}-${Date.now()}`,
        amount: ride.fare,
        email: user.email || `${user.phone}@motobus.rw`,
        phoneNumber: user.phone,
        name: user.name,
        paymentMethod: paymentMethod,
      });

      // Save payment record
      await paymentRepo.create({
        rideId: ride.id,
        userId: user.id,
        amount: ride.fare,
        method: paymentMethod === 'mobile_money' ? 'MOBILE_MONEY' : 'CASH',
        status: 'PENDING',
        transactionId: payment.data?.tx_ref || '',
      });

      return res.json({
        success: true,
        paymentLink: payment.data?.link,
        transactionReference: payment.data?.tx_ref,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Verify payment callback
  async verifyPayment(req: Request, res: Response) {
    try {
      const { transaction_id, tx_ref } = req.query;

      const verification = await flutterwaveService.verifyPayment(transaction_id as string);

      if (verification.status === 'success') {
        // Find payment by transaction ID
        const payment = await prisma.payment.findFirst({
          where: { transactionId: transaction_id as string },
          include: { ride: true },
        });

        if (payment) {
          await paymentRepo.updateStatus(payment.id, 'COMPLETED', transaction_id as string);
          
          // Update ride payment status
          await prisma.ride.update({
            where: { id: payment.rideId },
            data: { paymentStatus: 'COMPLETED' },
          });

          // Add to rider's wallet if they used wallet
          if (payment.method === 'WALLET') {
            await prisma.wallet.update({
              where: { userId: payment.userId },
              data: { balance: { decrement: payment.amount } },
            });
          }

          // Add to driver's earnings
          if (payment.ride.driverId) {
            await prisma.driver.update({
              where: { id: payment.ride.driverId },
              data: { totalEarnings: { increment: payment.amount * 0.8 } }, // 80% to driver
            });
          }
        }

        // Redirect to success page
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?ref=${tx_ref}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?ref=${tx_ref}`);
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Driver withdrawal request
  async requestWithdrawal(req: AuthRequest, res: Response) {
    try {
      const { amount } = req.body;
      const userId = req.user!.id;

      const driver = await prisma.driver.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
        },
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver not found' });
      }

      if (driver.totalEarnings < amount) {
        return res.status(400).json({ success: false, message: 'Insufficient earnings' });
      }

      // Initiate withdrawal via Flutterwave
      const withdrawal = await flutterwaveService.initiateWithdrawal({
        amount: amount,
        phoneNumber: driver.user.phone || "",
        email: driver.user.email || `${driver.user.phone}@motobus.rw`,
        name: driver.user.name,
        narration: `Driver earnings withdrawal - ${driver.user.name}`,
      });

      if (withdrawal.status === 'success') {
        // Deduct from driver's earnings
        await prisma.driver.update({
          where: { id: driver.id },
          data: { totalEarnings: { decrement: amount } },
        });

        // Create withdrawal record mapping relation via connect
        if (driver.user.wallet) {
          const transaction = await prisma.transaction.create({
            data: {
              wallet: { connect: { id: driver.user.wallet.id } },
              type: 'WITHDRAWAL',
              amount: -amount,
              description: `Withdrawal to ${driver.user.phone || ''}`,
              status: 'COMPLETED',
            },
          });

          return res.json({
            success: true,
            message: 'Withdrawal processed successfully',
            transaction,
          });
        } else {
          return res.status(400).json({ success: false, message: 'Wallet not configured for this account' });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: withdrawal.message || 'Withdrawal failed',
        });
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get wallet balance
  async getWalletBalance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      if (!wallet) {
        return res.json({ success: true, balance: 0, transactions: [] });
      }

      // Also get driver earnings if applicable
      let earnings = null;
      if (req.user!.role === 'DRIVER') {
        const driver = await prisma.driver.findUnique({
          where: { userId },
        });
        if (driver) {
          earnings = {
            total: driver.totalEarnings,
            totalTrips: driver.totalTrips,
            rating: driver.rating,
          };
        }
      }

      return res.json({
        success: true,
        balance: wallet.balance,
        transactions: wallet.transactions,
        earnings,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Top up wallet (simulation for testing)
  async topUpWallet(req: AuthRequest, res: Response) {
    try {
      const { amount, paymentMethod } = req.body;
      const userId = req.user!.id;

      if (!amount || amount < 100) {
        return res.status(400).json({ success: false, message: 'Minimum top-up is 100 RWF' });
      }

      // For simulation, we'll just add to wallet directly
      const wallet = await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
      });

      const transaction = await prisma.transaction.create({
        data: {
          wallet: { connect: { id: wallet.id } },
          amount: amount,
          type: 'TOPUP',
          description: `Wallet top-up via ${paymentMethod || 'Mobile Money'}`,
          reference: `TOPUP-${Date.now()}`,
          status: 'COMPLETED',
        },
      });

      return res.json({
        success: true,
        message: 'Wallet topped up successfully',
        balance: wallet.balance,
        transaction,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get payment history
  async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const payments = await prisma.payment.findMany({
        where: { userId },
        include: {
          ride: {
            include: {
              driver: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        payments,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Simulate payment for testing
  async simulatePayment(req: AuthRequest, res: Response) {
    try {
      const { id, success = true } = req.body;
      const userId = req.user!.id;

      const ride = await prisma.ride.findUnique({
        where: { id },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      if (success) {
        const payment = await paymentRepo.create({
          rideId: ride.id,
          userId,
          amount: ride.fare,
          method: 'CASH',
          status: 'COMPLETED',
        });

        await prisma.ride.update({
          where: { id: ride.id },
          data: { paymentStatus: 'COMPLETED' },
        });

        // Add to driver's earnings (80% of fare)
        if (ride.driverId) {
          await prisma.driver.update({
            where: { id: ride.driverId },
            data: { totalEarnings: { increment: ride.fare * 0.8 } },
          });
        }

        return res.json({
          success: true,
          message: 'Payment simulated successfully',
          payment,
        });
      } else {
        return res.json({
          success: false,
          message: 'Payment simulation failed',
        });
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default PaymentController;