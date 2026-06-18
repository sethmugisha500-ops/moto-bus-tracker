import { Router } from 'express';

const router = Router();

router.get('/stats', (req, res) => {
  return res.json({
    success: true,
    stats: { totalUsers: 8, totalDrivers: 5, totalTrips: 45, totalRevenue: 125000 },
  });
});

router.get('/drivers', (req, res) => {
  return res.json({ success: true, drivers: [] });
});

router.get('/rides', (req, res) => {
  return res.json({ success: true, rides: [] });
});

router.get('/users', (req, res) => {
  return res.json({ success: true, users: [] });
});

export default router;