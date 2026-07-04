// backend-api/src/routes/otp.ts
import express, { Request, Response } from 'express';
import { otpService } from '../services/otpService';

const router = express.Router();

// ─── Send OTP ──────────────────────────────────────────────────────
router.post('/send', async (req: Request, res: Response) => {
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
});

// ─── Verify OTP ────────────────────────────────────────────────────
router.post('/verify', async (req: Request, res: Response) => {
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
});

// ─── Resend OTP ────────────────────────────────────────────────────
router.post('/resend', async (req: Request, res: Response) => {
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
});

export default router;