import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { rideController } from '../controllers/ride.controller';
import { walletController } from '../controllers/wallet.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import paymentRoutes from '../routes/payment.routes';

const router = Router();

// ============ AUTH ROUTES ============
router.post('/auth/register', authController.register.bind(authController));
router.post('/auth/login', authController.login.bind(authController));
router.post('/auth/refresh', authController.refreshToken.bind(authController));
router.post('/auth/forgot-password', authController.forgotpassword.bind(authController));
router.post('/auth/reset-password', authController.resetPassword.bind(authController));
router.get('/auth/me', authenticate as any, authController.getCurrentUser.bind(authController));
router.put('/auth/profile', authenticate as any, authController.updateProfile.bind(authController));
router.post('/auth/change-password', authenticate as any, authController.changePassword.bind(authController));
router.post('/auth/logout', authenticate as any, authController.logout.bind(authController));

// Admin routes
router.get('/admin/users', authenticate as any, authorize('ADMIN') as any, authController.getAllUsers.bind(authController));
router.get('/admin/rides', authenticate as any, authorize('ADMIN') as any, rideController.getAllRides.bind(rideController));
router.get('/admin/transactions', authenticate as any, authorize('ADMIN') as any, walletController.getAllTransactions.bind(walletController));

// ============ USER ROUTES ============
router.get('/users/:id', authenticate as any, authController.getUserById.bind(authController));
router.get('/users/:userId/rides', authenticate as any, rideController.getUserRides.bind(rideController));

// ============ RIDE ROUTES ============
router.post('/rides', authenticate as any, rideController.createRide.bind(rideController));
router.get('/rides', authenticate as any, rideController.getUserRides.bind(rideController));
router.get('/rides/:id', authenticate as any, rideController.getRideById.bind(rideController));
router.post('/rides/:id/accept', authenticate as any, authorize('DRIVER') as any, rideController.acceptRide.bind(rideController));
router.post('/rides/:id/start', authenticate as any, authorize('DRIVER') as any, rideController.startRide.bind(rideController));
router.post('/rides/:id/complete', authenticate as any, authorize('DRIVER') as any, rideController.completeRide.bind(rideController));
router.post('/rides/:id/cancel', authenticate as any, rideController.cancelRide.bind(rideController));
router.post('/rides/:id/rate', authenticate as any, rideController.rateRide.bind(rideController));
router.get('/rides/stats/summary', authenticate as any, rideController.getRideStats.bind(rideController));
router.get('/driver/rides', authenticate as any, authorize('DRIVER') as any, rideController.getDriverRides.bind(rideController));

// ============ WALLET ROUTES ============
router.get('/wallet/balance', authenticate as any, walletController.getBalance.bind(walletController));
router.post('/wallet/topup', authenticate as any, walletController.topUp.bind(walletController));
router.post('/wallet/withdraw', authenticate as any, authorize('DRIVER') as any, walletController.withdraw.bind(walletController));
router.get('/wallet/transactions', authenticate as any, walletController.getTransactions.bind(walletController));
router.get('/wallet/transactions/:id', authenticate as any, walletController.getTransactionById.bind(walletController));
router.get('/wallet/stats', authenticate as any, walletController.getWalletStats.bind(walletController));

export default router;