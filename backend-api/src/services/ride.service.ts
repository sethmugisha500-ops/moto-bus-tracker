import { RideStatus } from '@prisma/client';
import { RideRepository } from '../repositories/ride.repository';
import { DriverRepository } from '../repositories/driver.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { NotificationService } from './notification.service';

const rideRepo = new RideRepository();
const driverRepo = new DriverRepository();
const walletRepo = new WalletRepository();
const notificationService = new NotificationService();

export class RideService {
  async requestRide(riderId: string, data: any) {
    const ride = await rideRepo.create({
      riderId,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      pickupAddress: data.pickupAddress,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      dropoffAddress: data.dropoffAddress,
      distance: data.distance,
      duration: data.duration,
      fare: data.fare,
      paymentMethod: data.paymentMethod,
    });
    
    // Notify nearby drivers via WebSocket
    const nearbyDrivers = await driverRepo.getNearbyDrivers(data.pickupLat, data.pickupLng);
    
    for (const driver of nearbyDrivers) {
      await notificationService.sendToDriver(driver.id, {
        title: 'New Ride Request',
        message: `Distance: ${data.distance}km | Fare: RWF ${data.fare}`,
        data: { id: ride.id },
      });
    }
    
    return ride;
  }

  async acceptRide(id: string, driverId: string) {
    const ride = await rideRepo.findById(id);
    
    if (!ride || ride.status !== 'PENDING') {
      throw new Error('Ride not available');
    }
    
    const updatedRide = await rideRepo.update(id, {
      driverId,
      status: 'ACCEPTED',
    });
    
    // Notify rider
    await notificationService.sendToUser(ride.riderId, {
      title: 'Driver Assigned',
      message: `Your driver is on the way`,
      data: { id },
    });
    
    return updatedRide;
  }

  async updateRideStatus(id: string, status: string, driverId: string) {
    const ride = await rideRepo.updateStatus(id, status as any);
    
    if (status === 'COMPLETED') {
      // Process payment
      await this.completeRide(id);
    }
    
    return ride;
  }

  async completeRide(id: string) {
    const ride = await rideRepo.findById(id);
    
    if (!ride || !ride.driverId) {
      throw new Error('Ride not found');
    }
    
    // Process payment based on method
    if (ride.paymentMethod === 'WALLET') {
      await walletRepo.deductBalance(ride.riderId, ride.fare, `Ride #${id}`, id);
      await walletRepo.addBalance(ride.driverId, ride.fare * 0.8, `Ride earnings #${id}`, id);
    }
    
    // Update driver earnings
    await driverRepo.updateEarnings(ride.driverId, ride.fare * 0.8);
    
    return ride;
  }

  async cancelRide(id: string, userId: string, reason: string) {
    const ride = await rideRepo.update(id, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledAt: reason,
    });
    
    return ride;
  }

  async activateSOS(id: string, userId: string) {
    const ride = await rideRepo.update(id, {
      status: 'STARTED',
      sosActivated: true,
    });
    
    // Notify emergency contacts
    // Create SOS alert record
    
    return ride;
  }
}