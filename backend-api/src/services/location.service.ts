import prisma from '../config/database';
import { DriverRepository } from '../repositories/driver.repository';

const driverRepo = new DriverRepository();

export class LocationService {
  async updateDriverLocation(id: string, lat: number, lng: number, isOnline: boolean) {
    // Update driver location
    const driver = await driverRepo.updateLocation(id, lat, lng, isOnline);

    // Save to location history
    await prisma.driverLocation.upsert({
      where: { id },
      update: { lat, lng, isOnline: isOnline, updatedAt: new Date() },
      create: { id, lat, lng, isOnline: isOnline },
    });

    // Broadcast to nearby riders via WebSocket
    // io.emit(`driver:${id}:location`, { id, lat, lng, isOnline });

    return driver;
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm = 5) {
    return driverRepo.getNearbyDrivers(lat, lng, radiusKm);
  }

  async saveRideLocation(id: string, id: string, lat: number, lng: number, speed?: number, heading?: number) {
    return prisma.rideLocation.create({
      data: {
        id,
        id,
        lat,
        lng,
        speed,
        heading,
      },
    });
  }

  async getRidePath(id: string) {
    return prisma.rideLocation.findMany({
      where: { id },
      orderBy: { timestamp: 'asc' },
    });
  }

  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async estimateETA(distanceKm: number, vehicle, // km/h
      TUKTUK: 30,
      BUS: 25,
    };
    const speed = speeds[vehicleType as keyof typeof speeds] || 30;
    const timeHours = distanceKm / speed;
    return Math.ceil(timeHours * 60); // return minutes
  }

  async estimateFare(distanceKm: number, vehicle,
      }
    const perKmRates = {
      MOTO: 300,
      TUKTUK: 200,
      BUS: 100,
    };
    const base = baseFares[vehicleType as keyof typeof baseFares] || 500;
    const perKm = perKmRates[vehicleType as keyof typeof perKmRates] || 200;
    return base + (distanceKm * perKm);
  }
}