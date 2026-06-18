import { Router } from 'express';

const router = Router();

router.post('/location', (req, res) => {
  return res.json({ success: true, message: 'Location updated' });
});

router.get('/nearby-rides', (req, res) => {
  return res.json({
    success: true,
    rides: [
      { id: 'RIDE1', pickup: 'Kigali City Tower', destination: 'Kimironko', fare: 1200, distance: '400m' },
    ],
  });
});

router.post('/accept-ride/:id', (req, res) => {
  return res.json({ success: true, message: 'Ride accepted' });
});

router.get('/earnings', (req, res) => {
  return res.json({
    success: true,
    earnings: { today: { amount: 8500, trips: 4 }, week: { amount: 45600, trips: 18 } },
  });
});

export default router;