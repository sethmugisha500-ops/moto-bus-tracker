import { RideStatus } from '@prisma/client';
import prisma from '../config/database';


export class RideRepository {
    async getDashboardStats() {
        return {
            totalTrips: await this.count(),
            activeRides: await this.count({ where: { status: { in: ["PENDING", "ACCEPTED", "STARTED"] } } }),
            completedRides: await this.count({ where: { status: "COMPLETED" } }),
            cancelledRides: await this.count({ where: { status: "CANCELLED" } })
        };
    }
  async findById(id: string) {
    return prisma.ride.findUnique({
      where: { id },
      include: {
        rider: true,
        driver: { include: {   } },
        locations: true,
        payment: true,
        rating: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.ride.update({
      where: { id },
      data,
      include: {
        rider: true,
        driver: { include: {   } },
      },
    });
  }

  async updateStatus(id: string, status: RideStatus) {
    const updateData: any = { status };
    
    if (status === 'STARTED') updateData.startedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    
    return prisma.ride.update({
      where: { id },
      data: updateData,
    });
  }

  async create(data: any) {
    return prisma.ride.create({
      data,
      include: {
        rider: true,
        driver: { include: {   } },
      },
    });
  }

  async findByRider(riderId: string, limit = 50) {
    return prisma.ride.findMany({
      where: { riderId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        driver: { include: {   } },
        rating: true,
      },
    });
  }

  async findByDriver(driverId: string, limit = 50) {
    return prisma.ride.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        rider: true,
        rating: true,
      },
    });
  }
}

export default RideRepository;