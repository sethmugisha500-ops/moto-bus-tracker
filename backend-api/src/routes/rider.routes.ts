import { Router } from 'express';

const router = Router();

// Get nearby drivers
router.get('/nearby-drivers', (req, res) => {
  res.json({
    success: true,
    drivers: [
      { id: '1', name: 'John Mugabo', vehicleType: 'MOTO', vehicleNumber: 'MT-001A', rating: 4.8, distance: '300m', eta: '2 min', lat: -1.9441, lng: 30.0619 },
      { id: '2', name: 'Peter Nshuti', vehicleType: 'MOTO', vehicleNumber: 'MT-002B', rating: 4.9, distance: '500m', eta: '3 min', lat: -1.9450, lng: 30.0625 },
      { id: '3', name: 'Sarah Uwimana', vehicleType: 'BUS', vehicleNumber: 'BUS-101', rating: 4.7, distance: '800m', eta: '5 min', lat: -1.9430, lng: 30.0600 },
    ],
  });
});

// Request a ride
router.post('/request-ride', (req, res) => {
  const ride = {
    id: `RIDE${Date.now()}`,
    ...req.body,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  res.json({ success: true, ride });
});

// Get ride status
router.get('/ride-status/:rideId', (req, res) => {
  res.json({
    success: true,
    ride: {
      id: req.params.rideId,
      status: 'ACCEPTED',
      driver: { name: 'John Mugabo', phone: '+250788123401', vehicleNumber: 'MT-001A' },
      eta: '3 min',
      distance: '1.2 km',
    },
  });
});

// Get ride history
router.get('/rides', (req, res) => {
  res.json({
    success: true,
    rides: [
      { id: '1', pickup: 'Kigali City Tower', destination: 'Kimironko', fare: 1200, status: 'COMPLETED', date: '2024-01-15', rating: 5 },
      { id: '2', pickup: 'Airport', destination: 'Downtown', fare: 2500, status: 'COMPLETED', date: '2024-01-14', rating: 4 },
      { id: '3', pickup: 'Kacyiru', destination: 'Gisozi', fare: 800, status: 'COMPLETED', date: '2024-01-13', rating: 5 },
    ],
  });
});

// Rate a ride
router.post('/rate-ride/:rideId', (req, res) => {
  const { rating, comment } = req.body;
  res.json({
    success: true,
    message: 'Rating submitted successfully',
    rating: { rideId: req.params.rideId, rating, comment },
  });
});

// Cancel a ride
router.post('/cancel-ride/:rideId', (req, res) => {
  const { reason } = req.body;
  res.json({
    success: true,
    message: 'Ride cancelled successfully',
    rideId: req.params.rideId,
    reason: reason || 'Cancelled by user',
  });
});

export default router;