import { Router } from 'express';

const router = Router();

// Send OTP
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  console.log('Received phone:', phone);
  
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 OTP for ${phone}: ${otp}`);
  
  res.json({
    success: true,
    message: 'OTP sent successfully',
    devOtp: otp,
  });
});
// Verify OTP
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  }
  
  if (otp.length === 6) {
    const token = Buffer.from(JSON.stringify({ userId: Date.now(), phone })).toString('base64');
    
    res.json({
      success: true,
      token,
      user: {
        id: Date.now().toString(),
        name: `User_${phone.slice(-4)}`,
        phone: phone,
        role: 'rider',
      },
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

export default router;