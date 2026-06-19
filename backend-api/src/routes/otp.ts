import express, { Request, Response } from 'express';
import { otpService } from '../services/otpService';

const router = express.Router();

router.post('/send', async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        const result = await otpService.sendOTP(phone);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { phone, otp } = req.body;
        const result = await otpService.verifyOTP(phone, otp);
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;