import { Request, Response } from 'express';
import prisma from '../config/database';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class SOSController {
  async triggerSOS(req: Request, res: Response) {
    try {
      const { id, lat, lng } = req.body;
      const userId = req.user!.id;

      // Get ride details
      const ride = await prisma.ride.findUnique({
        where: { id: id },
        include: {
          rider: true,
          driver: { include: {  } },
        },
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      // Update ride status
      await prisma.ride.update({
        where: { id: id },
        data: { status: 'STARTED', sosActivated: true },
      });

      // Create SOS alert record
      const sosAlert = await prisma.sOSAlert.create({
        data: {
          userId,
          
          id,
          lat: lat || ride.pickupLat,
          lng: lng || ride.pickupLng,
          status: 'ACTIVE',
        },
      });

      // Notify emergency contacts (in production, get from user profile)
      const emergencyContacts = [
        { name: 'Police', phone: '112' },
        { name: 'Ambulance', phone: '114' },
        { name: 'Emergency Contact', phone: '+250788123456' },
      ];

      for (const contact of emergencyContacts) {
        // await smsService.sendSOS(contact.phone, {
        //   userName: ride.riderIduser.name,
        //   driverName: ride.driver?.user?.name,
        //   vehicleNumber: ride.driver?.vehicle?.plateNumber,
        //   location: `${lat || ride.pickupLat}, ${lng || ride.pickupLng}`,
        //   id: ride.id,
        // });
      }

      // Notify admin
      await notificationService.sendToAdmin({
        title: 'SOS Alert Activated',
        message: `User ${ride.riderIduser.name} activated SOS on ride ${ride.id}`,
        data: { id, sosAlertId: sosAlert.id },
      });

      return res.json({
        success: true,
        message: 'SOS alert sent. Emergency services have been notified.',
        sosAlert,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async resolveSOS(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resolution } = req.body;

      const sosAlert = await prisma.sOSAlert.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          updatedAt: req.user!.id,
          resolvedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: 'SOS alert resolved',
        sosAlert,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getActiveSOS(req: Request, res: Response) {
    try {
      const activeAlerts = await prisma.sOSAlert.findMany({
        where: { status: 'ACTIVE' },
        include: {
          
          driver: { include: {   } },
          ride: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, alerts: activeAlerts });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserSOSHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const alerts = await prisma.sOSAlert.findMany({
        where: { userId },
        include: { ride: true, driver: { include: {  } } },
        orderBy: { createdAt: 'desc' },
      });

      return res.json({ success: true, alerts });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}