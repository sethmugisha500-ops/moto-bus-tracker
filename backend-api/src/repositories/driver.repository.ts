import prisma from '../config/database';

export class DriverRepository {
  async create(userId: string, data: any) {
    return prisma.driver.create({
      data: {
        userId,
        licenseNumber: data.licenseNumber,
        totalTrips: data.totalTrips || 0,
      },
      include: {   },
    });
  }

  async findByUserId(userId: string) {
    return prisma.driver.findUnique({
      where: { userId },
      include: {   },
    });
  }

  async updateLocation(driverId: string, lat: number, lng: number, isOnline: boolean) {
    return prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
        isOnline,
        isOnline: isOnline,
      },
    });
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm = 5) {
    // Simplified - in production use PostGIS
    return prisma.driver.findMany({
      where: {
        isOnline: true,
        isOnline: true,
        currentLat: { gte: lat - 0.05, lte: lat + 0.05 },
        currentLng: { gte: lng - 0.05, lte: lng + 0.05 },
      },
      include: {
        
        
      },
      take: 20,
    });
  }

  async updateEarnings(driverId: string, amount: number) {
    return prisma.driver.update({
      where: { id: driverId },
      data: {
        totalEarnings: { increment: amount },
        totalTrips: { increment: 1 },
      },
    });
  }

  async updateRating(driverId: string) {
    const ratings = await prisma.rating.aggregate({
      where: { driverId },
      _avg: { rating: true },
    });
    
    return prisma.driver.update({
      where: { id: driverId },
      data: { rating: ratings._avg.rating || 0 },
    });
  }
}