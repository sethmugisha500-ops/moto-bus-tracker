import { Request, Response } from 'express';
import { otpService } from '../services/otpService';
import { prisma } from '../prisma/client';

export class OTPController {
  async sendOTP(req: Request, res: Response) {
    try {
      const { phone, email, type = 'VERIFICATION' } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const result = await otpService.sendOTP(phone, email, undefined, type);

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          method: result.method,
          expiresIn: result.expiresIn,
          ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
        }
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to send OTP'
      });
    }
  }

  async verifyOTP(req: Request, res: Response) {
    try {
      const { phone, email, otp } = req.body;

      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required'
        });
      }

      const identifier = phone || email;
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Phone or email is required'
        });
      }

      const result = await otpService.verifyOTP(identifier, otp);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          userId: result.userId
        }
      });
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify OTP'
      });
    }
  }

  async resendOTP(req: Request, res: Response) {
    try {
      const { phone, email, type = 'VERIFICATION' } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      // Invalidate existing OTP
      const existingOtp = await prisma.otp.findFirst({
        where: {
          phone,
          isUsed: false,
          expiresAt: { gt: new Date() }
        }
      });

      if (existingOtp) {
        await prisma.otp.update({
          where: { id: existingOtp.id },
          data: { isUsed: true }
        });
      }

      const result = await otpService.sendOTP(phone, email, undefined, type);

      return res.status(200).json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          method: result.method,
          expiresIn: result.expiresIn,
          ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
        }
      });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to resend OTP'
      });
    }
  }

  async checkOTP(req: Request, res: Response) {
    try {
      const { phone, email, otp } = req.query;

      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required'
        });
      }

      const identifier = (phone as string) || (email as string);
      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Phone or email is required'
        });
      }

      const result = await otpService.checkOTP(identifier, otp as string);

      return res.status(200).json({
        success: true,
        data: {
          valid: result.valid,
          remainingSeconds: result.remainingSeconds || 0
        }
      });
    } catch (error: any) {
      console.error('Check OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to check OTP'
      });
    }
  }

  async getActiveOTPs(req: Request, res: Response) {
    try {
      const { phone } = req.params;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      const otps = await otpService.getActiveOTPs(phone);

      return res.status(200).json({
        success: true,
        data: otps
      });
    } catch (error: any) {
      console.error('Get active OTPs error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active OTPs'
      });
    }
  }

  async getDevOTP(req: Request, res: Response) {
    try {
      const { phone } = req.params;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          message: 'This endpoint is only available in development'
        });
      }

      const otp = await otpService.getDevOTP(phone);

      return res.status(200).json({
        success: true,
        data: { otp }
      });
    } catch (error: any) {
      console.error('Get dev OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get OTP'
      });
    }
  }

  async generateOperationOTP(req: Request, res: Response) {
    try {
      const { phone, email, operation } = req.body;

      if (!phone || !operation) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and operation are required'
        });
      }

      const result = await otpService.generateOperationOTP(phone, operation, email);

      return res.status(200).json({
        success: true,
        message: `OTP generated for ${operation}`,
        data: {
          expiresAt: result.expiresAt,
          ...(process.env.NODE_ENV === 'development' && { otp: result.otp })
        }
      });
    } catch (error: any) {
      console.error('Generate operation OTP error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate OTP'
      });
    }
  }

  async cleanupExpiredOTPs(req: Request, res: Response) {
    try {
      await otpService.cleanupExpiredOTPs();

      return res.status(200).json({
        success: true,
        message: 'Expired OTPs cleaned up successfully'
      });
    } catch (error: any) {
      console.error('Cleanup OTPs error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to cleanup OTPs'
      });
    }
  }
}

export const otpController = new OTPController();