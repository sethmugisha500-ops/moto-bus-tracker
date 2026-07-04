// src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma'; // ✅ Single instance
import flutterwaveService from '../services/Flutterwave.service';
import { PaymentRepository } from '../repositories/payment.repository';

const paymentRepo = new PaymentRepository();
const FRONTEND_URL = process.env.FRONTEND_URL || '';

export class PaymentController {
  async verifyPayment(req: Request, res: Response) {
    try {
      const { transaction_id, tx_ref } = req.query;

      const verification = await flutterwaveService.verifyPayment(
        transaction_id as string
      );

      if (verification.status === 'success') {
        // ✅ Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
          // Find payment
          const payment = await tx.payment.findFirst({
            where: { transactionId: transaction_id as string },
            include: { ride: true },
          });

          if (!payment) return null;

          // Update payment status
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: { 
              status: 'COMPLETED',
              transactionId: transaction_id as string,
              completedAt: new Date(),
            },
          });

          // Update ride payment status
          await tx.ride.update({
            where: { id: payment.rideId },
            data: { paymentStatus: 'COMPLETED' },
          });

          // Update wallet if applicable
          if (payment.method === 'WALLET') {
            await tx.wallet.update({
              where: { userId: payment.userId },
              data: { balance: { decrement: payment.amount } },
            });
          }

          // Update driver earnings
          if (payment.ride.driverId) {
            const commission = Number(process.env.DRIVER_COMMISSION) || 0.8;
            await tx.driver.update({
              where: { id: payment.ride.driverId },
              data: { 
                totalEarnings: { 
                  increment: payment.amount * commission 
                } 
              },
            });
          }

          return updatedPayment;
        });

        // Redirect to success page
        return res.redirect(
          `${FRONTEND_URL}/payment/success?ref=${tx_ref}`
        );
      } else {
        return res.redirect(
          `${FRONTEND_URL}/payment/failed?ref=${tx_ref}`
        );
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }

  async requestWithdrawal(req: AuthRequest, res: Response) {
    try {
      const { amount } = req.body;
      const userId = req.user!.id;

      const result = await prisma.$transaction(async (tx) => {
        const driver = await tx.driver.findUnique({
          where: { userId },
          include: {
            user: {
              include: { wallet: true },
            },
          },
        });

        if (!driver) {
          throw new Error('Driver not found');
        }

        if (driver.totalEarnings < amount) {
          throw new Error('Insufficient earnings');
        }

        // Initiate withdrawal via Flutterwave
        const withdrawal = await flutterwaveService.initiateWithdrawal({
          amount: amount,
          phoneNumber: driver.user.phone || "",
          email: driver.user.email || `${driver.user.phone}@motobus.rw`,
          name: driver.user.name,
          narration: `Driver earnings withdrawal - ${driver.user.name}`,
        });

        if (withdrawal.status !== 'success') {
          throw new Error(withdrawal.message || 'Withdrawal failed');
        }

        // Deduct from driver's earnings
        await tx.driver.update({
          where: { id: driver.id },
          data: { totalEarnings: { decrement: amount } },
        });

        // Create transaction record
        if (driver.user.wallet) {
          const transaction = await tx.transaction.create({
            data: {
              wallet: { connect: { id: driver.user.wallet.id } },
              type: 'WITHDRAWAL',
              amount: -amount,
              description: `Withdrawal to ${driver.user.phone || ''}`,
              status: 'COMPLETED',
            },
          });

          return { success: true, transaction };
        }

        throw new Error('Wallet not configured');
      });

      return res.json({
        ...result,
        message: 'Withdrawal processed successfully',
      });
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

export default PaymentController;