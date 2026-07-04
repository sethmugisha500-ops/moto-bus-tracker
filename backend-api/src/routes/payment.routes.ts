import { Router } from 'express';

const router = Router();

router.get('/wallet/balance', (req, res) => {
  return res.json({ success: true, balance: 15000 });
});

router.post('/wallet/topup', (req, res) => {
  return res.json({ success: true, message: 'Wallet topped up' });
});


export default router;