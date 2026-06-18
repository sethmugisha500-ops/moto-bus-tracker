import prisma from '../config/database';


export class RideRepository {
  async findById(id: string) {
    return prisma.ride.findUnique({
      where: { id },
      include: {
        rider: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } },
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
        rider: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } },
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
        rider: { include: { user: true } },
        driver: { include: { user: true, vehicle: true } },
      },
    });
  }

  async findByRider(riderId: string, limit = 50) {
    return prisma.ride.findMany({
      where: { riderId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        driver: { include: { user: true, vehicle: true } },
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
        rider: { include: { user: true } },
        rating: true,
      },
    });
  }
}

export default RideRepository;