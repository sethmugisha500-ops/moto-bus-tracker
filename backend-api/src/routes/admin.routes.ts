import { Router } from 'express';

const router = Router();

router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: { totalUsers: 8, totalDrivers: 5, totalRides: 45, totalRevenue: 125000 },
  });
});

router.get('/drivers', (req, res) => {
  res.json({ success: true, drivers: [] });
});

router.get('/rides', (req, res) => {
  res.json({ success: true, rides: [] });
});

router.get('/users', (req, res) => {
  res.json({ success: true, users: [] });
});

export default router;