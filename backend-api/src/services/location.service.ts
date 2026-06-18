import { prisma } from '../prisma/client';

export class LocationService {
  async updateDriverLocation(driverId: string, lat: number, lng: number, isOnline: boolean) {
    try {
      // Update driver's current location
      await prisma.driver.update({
        where: { id: driverId },
        data: {
          currentLat: lat,
          currentLng: lng,
          isOnline: isOnline
        }
      });

      // Create location history record
      const location = await prisma.driverLocation.create({
        data: {
          driverId,
          userId: (await prisma.driver.findUnique({ where: { id: driverId } }))!.userId,
          lat,
          lng
        }
      });

      return location;
    } catch (error) {
      console.error('Update driver location error:', error);
      throw error;
    }
  }

  async getDriverLocation(driverId: string) {
    try {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: {
          currentLat: true,
          currentLng: true,
          isOnline: true,
          updatedAt: true
        }
      });
      return driver;
    } catch (error) {
      console.error('Get driver location error:', error);
      throw error;
    }
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
    // Simplified - in production use PostGIS or similar
    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isApproved: true,
        currentLat: { not: null },
        currentLng: { not: null }
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            rating: true
          }
        }
      },
      take: 20
    });

    // Calculate distance in a real implementation
    return drivers;
  }

  async createRideLocation(rideId: string, lat: number, lng: number) {
    try {
      return await prisma.rideLocation.create({
        data: {
          rideId,
          lat,
          lng
        }
      });
    } catch (error) {
      console.error('Create ride location error:', error);
      throw error;
    }
  }

  async getRideLocations(rideId: string) {
    try {
      return await prisma.rideLocation.findMany({
        where: { rideId },
        orderBy: { timestamp: 'asc' }
      });
    } catch (error) {
      console.error('Get ride locations error:', error);
      throw error;
    }
  }

  async estimateFare(distanceKm: number, vehicleType: string) {
    const baseFare = 200;
    const perKmRates: Record<string, number> = {
      'MOTO': 300,
      'TUKTUK': 400,
      'BUS': 250,
      'MINIBUS': 300
    };
    const rate = perKmRates[vehicleType] || 300;
    return baseFare + (distanceKm * rate);
  }
}

export const locationService = new LocationService();