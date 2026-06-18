import PaymentRepository from '../repositories/payment.repository';
import RideRepository from '../repositories/ride.repository';
import WalletRepository from '../repositories/wallet.repository';

const paymentRepo = new PaymentRepository();
const rideRepo = new RideRepository();
const walletRepo = new WalletRepository();

export class PaymentService {
  async processMobileMoney(rideId: string, phoneNumber: string) {
    const ride = await rideRepo.findById(rideId);
    
    if (!ride) throw new Error('Ride not found');
    
    const payment = await paymentRepo.create({
      rideId,
      userId: ride.riderId,
      amount: ride.fare,
      method: 'MOBILE_MONEY',
      mobileMoneyNumber: phoneNumber,
      status: 'COMPLETED',
    });
    
    // Update ride payment status
    await rideRepo.update(rideId, { paymentStatus: 'COMPLETED' });
    
    return payment;
  }

  async processWalletPayment(rideId: string) {
    const ride = await rideRepo.findById(rideId);
    
    if (!ride) throw new Error('Ride not found');
    
    await walletRepo.deductBalance(ride.riderId, ride.fare, `Ride #${rideId}`, rideId);
    
    const payment = await paymentRepo.create({
      rideId,
      userId: ride.riderId,
      amount: ride.fare,
      method: 'WALLET',
      status: 'COMPLETED',
    });
    
    await rideRepo.update(rideId, { paymentStatus: 'COMPLETED' });
    
    return payment;
  }

  async processCashPayment(rideId: string) {
    const ride = await rideRepo.findById(rideId);
    
    if (!ride) throw new Error('Ride not found');
    
    const payment = await paymentRepo.create({
      rideId,
      userId: ride.riderId,
      amount: ride.fare,
      method: 'CASH',
      status: 'COMPLETED',
    });
    
    await rideRepo.update(rideId, { paymentStatus: 'COMPLETED' });
    
    return payment;
  }

  async getWalletBalance(userId: string) {
    return walletRepo.findByUserId(userId);
  }

  async topUpWallet(userId: string, amount: number) {
    return walletRepo.addBalance(userId, amount, 'Wallet top-up', `TOPUP-${Date.now()}`);
  }
}

export default PaymentService;