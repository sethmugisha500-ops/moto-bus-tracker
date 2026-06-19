import { PrismaClient, RideStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class RideRepository {
    async getDashboardStats() {
        const total = await prisma.ride.count();
        const active = await prisma.ride.count({
            where: { status: { in: ['PENDING', 'ACCEPTED', 'STARTED'] } }
        });
        const completed = await prisma.ride.count({
            where: { status: 'COMPLETED' }
        });
        const cancelled = await prisma.ride.count({
            where: { status: 'CANCELLED' }
        });
        return {
            totalRides: total,
            activeRides: active,
            completedRides: completed,
            cancelledRides: cancelled
        };
    }

    async findById(id: string) {
        return prisma.ride.findUnique({
            where: { id },
            include: {
                rider: true,
                driver: { include: { user: true } },
                payment: true,
                rating: true,
            },
        });
    }

    async update(id: string, data: any) {
        return prisma.ride.update({
            where: { id },
            data,
        });
    }

    async updateStatus(id: string, status: RideStatus) {
        return prisma.ride.update({
            where: { id },
            data: { status },
        });
    }

    async create(data: any) {
        return prisma.ride.create({
            data,
        });
    }

    async findByRider(riderId: string, limit = 50) {
        return prisma.ride.findMany({
            where: { riderId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                driver: { include: { user: true } },
                payment: true,
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
                payment: true,
                rating: true,
            },
        });
    }

    async count(where?: any) {
        return prisma.ride.count({ where });
    }

    async findMany(options?: any) {
        return prisma.ride.findMany(options);
    }
}

export const rideRepository = new RideRepository();