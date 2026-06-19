// src/services/notification.service.ts
import prisma from '../config/database';

type NotifType =
  | 'SYSTEM'
  | 'RIDE_REQUEST'
  | 'RIDE_ACCEPTED'
  | 'RIDE_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'PROMOTION';

export class NotificationService {
  async sendToUser(userId: string, data: {
    title: string;
    message: string;
    type?: NotifType;
    data?: any;
  }) {
    // Fixed structural inputs to match schema without invalid unknown property mappings
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type || 'SYSTEM',
      },
    });

    return notification;
  }

  async sendToDriver(driverId: string, data: {
    title: string;
    message: string;
    type?: NotifType;
    data?: any;
  }) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (driver) {
      return this.sendToUser(driver.userId, data);
    }
    return null;
  }

  async sendToRider(riderId: string, data: {
    title: string;
    message: string;
    type?: NotifType;
    data?: any;
  }) {
    return this.sendToUser(riderId, data);
  }

  async sendToAdmin(data: {
    title: string;
    message: string;
    type?: NotifType;
    data?: any;
  }) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    const notifications = await Promise.all(
      admins.map((admin: { id: string }) => this.sendToUser(admin.id, data))
    );

    return notifications;
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async getUserNotifications(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async sendRideRequestNotification(driverIds: string[], rideData: any) {
    for (const driverId of driverIds) {
      await this.sendToDriver(driverId, {
        title: 'New Ride Request',
        message: `Distance: ${rideData.distance}km | Fare: RWF ${rideData.fare}`,
        type: 'RIDE_REQUEST',
        data: { id: rideData.id },
      });
    }
  }

  async sendRideAcceptedNotification(riderId: string, driverName: string, eta: number) {
    await this.sendToRider(riderId, {
      title: 'Driver Assigned',
      message: `${driverName} is on the way. ETA: ${eta} minutes`,
      type: 'RIDE_ACCEPTED',
      data: { eta },
    });
  }

  async sendRideCompletedNotification(userId: string, fare: number) {
    await this.sendToUser(userId, {
      title: 'Ride Completed',
      message: `Your ride is complete. Total fare: RWF ${fare}`,
      type: 'RIDE_COMPLETED',
      data: { fare },
    });
  }

  async sendPaymentReceivedNotification(driverId: string, amount: number) {
    await this.sendToDriver(driverId, {
      title: 'Payment Received',
      message: `You received RWF ${amount} for your completed ride`,
      type: 'PAYMENT_RECEIVED',
      data: { amount },
    });
  }

  async sendDriverApprovedNotification(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (driver) {
      await this.sendToUser(driver.userId, {
        title: 'Driver Application Approved',
        message: 'Congratulations! You can now accept rides and start earning.',
        type: 'SYSTEM',
      });
    }
  }

  async sendPromotionalNotification(userIds: string[], title: string, message: string) {
    const notifications = await Promise.all(
      userIds.map(userId => this.sendToUser(userId, { title, message, type: 'PROMOTION' }))
    );
    return notifications;
  }
}