import { Router } from 'express';
import authController from '../controllers/auth.controller';
import rideController from '../controllers/ride.controller';
import walletController from '../controllers/wallet.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import paymentRoutes from '../routes/payment.routes';

const router = Router();

// ============ AUTH ROUTES ============
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));
router.post('/auth/refresh', authController.refreshToken.bind(authController));
router.post('/auth/forgot-password', authController.forgotpassword.bind(authController));
router.post('/auth/reset-password', authController.resetPassword.bind(authController));
router.get('/auth/me', authenticate, authController.getCurrentUser.bind(authController));
router.put('/auth/profile', authenticate, authController.updateProfile.bind(authController));
router.post('/auth/change-password', authenticate, authController.changePassword.bind(authController));
router.post('/auth/logout', authenticate, authController.logout.bind(authController));

// Admin routes
router.get('/admin/users', authenticate, authorize('ADMIN'), authController.getAllUsers.bind(authController));
router.get('/admin/rides', authenticate, authorize('ADMIN'), rideController.getAllRides.bind(rideController));
router.get('/admin/transactions', authenticate, authorize('ADMIN'), walletController.getAllTransactions.bind(walletController));

// ============ USER ROUTES ============
router.get('/users/:id', authenticate, authController.getUserById.bind(authController));
router.get('/users/:userId/rides', authenticate, rideController.getUserRides.bind(rideController));

// ============ RIDE ROUTES ============
router.post('/rides', authenticate, rideController.createRide.bind(rideController));
router.get('/rides', authenticate, rideController.getUserRides.bind(rideController));
router.get('/rides/:id', authenticate, rideController.getRideById.bind(rideController));
router.post('/rides/:id/accept', authenticate, authorize('DRIVER'), rideController.acceptRide.bind(rideController));
router.post('/rides/:id/start', authenticate, authorize('DRIVER'), rideController.startRide.bind(rideController));
router.post('/rides/:id/complete', authenticate, authorize('DRIVER'), rideController.completeRide.bind(rideController));
router.post('/rides/:id/cancel', authenticate, rideController.cancelRide.bind(rideController));
router.post('/rides/:id/rate', authenticate, rideController.rateRide.bind(rideController));
router.get('/rides/stats/summary', authenticate, rideController.getRideStats.bind(rideController));
router.get('/driver/rides', authenticate, authorize('DRIVER'), rideController.getDriverRides.bind(rideController));

// ============ WALLET ROUTES ============
router.get('/wallet/balance', authenticate, walletController.getBalance.bind(walletController));
router.post('/wallet/topup', authenticate, walletController.topUp.bind(walletController));
router.post('/wallet/withdraw', authenticate, authorize('DRIVER'), walletController.withdraw.bind(walletController));
router.get('/wallet/transactions', authenticate, walletController.getTransactions.bind(walletController));
router.get('/wallet/transactions/:id', authenticate, walletController.getTransactionById.bind(walletController));
router.get('/wallet/stats', authenticate, walletController.getWalletStats.bind(walletController));

export default router;