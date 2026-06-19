// src/routes/rider.routes.ts
import { Router } from 'express';

const router = Router();

// Mocked response using proper explicit string value definitions to eliminate shorthand errors
router.get('/nearby-drivers', (req, res) => {
  return res.json({
    success: true,
    drivers: [
      { id: '1', name: 'John Mugabo', vehicleType: "MOTO", rating: 4.8, distance: '300m', eta: '2 min' },
      { id: '2', name: 'Peter Nshuti', vehicleType: "MOTO", rating: 4.9, distance: '500m', eta: '3 min' },
    ],
  });
});

export default router;