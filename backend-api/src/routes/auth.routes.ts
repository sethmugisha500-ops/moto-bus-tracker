import { Router } from 'express';
const router = Router();

// Send otp
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  console.log('Received phone:', phone);
  
  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number required' });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`📱 otp for ${phone}: ${otp}`);
  
  return res.json({
    success: true,
    message: 'otp sent successfully',
    devotp: otp,
  });
});
// Verify otp
router.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and otp required' });
  }
  
  if (otp.length === 6) {
    const token = Buffer.from(JSON.stringify({ userId: Date.now(), phone })).toString('base64');
    
    return res.json({
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
    return res.status(400).json({ success: false, message: 'Invalid otp' });
  }
});

export default router;