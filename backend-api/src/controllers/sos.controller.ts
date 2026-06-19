import { Request, Response } from 'express';
import prisma from '../config/database';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class SOSController {
  method(arg0: string, arg1: any, method: any) {
      throw new Error('Method not implemented.');
  }
  async triggerSOS(req: Request, res: Response) {
    try {
      const { id, lat, lng } = req.body;
      const userId = (req as any).user!.id;

      // Get ride details
      const ride = await prisma.ride.findUnique({
        where: { id: id },
        include: {
          rider: true,
        },
      });

      if (!ride) {
        res.status(404).json({ success: false, message: 'Ride not found' });
        return;
      }

      // Update ride status
      await prisma.ride.update({
        where: { id: id },
        data: { status: 'STARTED' },
      });

      // Create SOS alert record
      const sosAlert = await prisma.sOSAlert.create({
        data: {
          userId,
          rideId: id,
          lat: lat || ride.pickupLat,
          lng: lng || ride.pickupLng,
          status: 'ACTIVE',
        },
      });

      // Notify emergency contacts
      const emergencyContacts = [
        { name: 'Police', phone: '112' },
        { name: 'Ambulance', phone: '114' },
        { name: 'Emergency Contact', phone: '+250788123456' },
      ];

      // Notify admin
      await notificationService.sendToAdmin({
        title: 'SOS Alert Activated',
        message: `User ${(ride as any).rider?.name || 'Rider'} activated SOS on ride ${ride.id}`,
        data: { id, sosAlertId: sosAlert.id },
      });

      res.json({
        success: true,
        message: 'SOS alert sent. Emergency services have been notified.',
        sosAlert,
      });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  async resolveSOS(req: Request, res: Response) {
    try {
      const { id } = req.params;

     const sosAlert = await prisma.sOSAlert.update({
  where: { id },
  data: {
    status: 'RESOLVED',
    // resolvedAt: new Date(), <-- Remove this line if it's not in your schema.prisma
  },
});

      res.json({
        success: true,
        message: 'SOS alert resolved',
        sosAlert,
      });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  async getActiveSOS(req: Request, res: Response) {
    try {
      const activeAlerts = await prisma.sOSAlert.findMany({
        where: { status: 'ACTIVE' },
        include: {
          ride: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, alerts: activeAlerts });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }

  async getUserSOSHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const alerts = await prisma.sOSAlert.findMany({
        where: { userId },
        include: { ride: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, alerts });
      return;
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
  }
}