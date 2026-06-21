import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

// Use a local PrismaClient instance to avoid importing files outside of tsconfig rootDir
const prisma = new PrismaClient();

export class SOSController {
  // ============================================
  // TRIGGER SOS
  // ============================================
  async triggerSOS(req: AuthRequest, res: Response) {
    try {
      const { rideId, lat, lng } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!rideId) {
        return res.status(400).json({ success: false, message: 'Ride ID is required' });
      }

      // Get ride details
      const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      // Update ride status to STARTED (SOS activated)
      await prisma.ride.update({
        where: { id: rideId },
        data: { status: 'STARTED' }
      });

      // Create SOS alert record
      const sosAlert = await prisma.sOSAlert.create({
        data: {
          userId,
          rideId,
          lat: lat || ride.pickupLat,
          lng: lng || ride.pickupLng,
          status: 'ACTIVE'
        }
      });

      // Create notification for admin
      await prisma.notification.create({
        data: {
          userId: userId,
          title: '🚨 SOS Alert Activated',
          message: `SOS alert triggered by ${ride.rider?.name || 'Rider'} on ride ${rideId}`,
          type: 'SOS_ALERT'
        }
      });

      // If driver exists, notify them
      if (ride.driver) {
        await prisma.notification.create({
          data: {
            userId: ride.driver.userId,
            title: '🚨 SOS Alert on Your Ride',
            message: `Your passenger has activated SOS on ride ${rideId}`,
            type: 'SOS_ALERT'
          }
        });
      }

      return res.json({
        success: true,
        message: 'SOS alert sent successfully. Emergency services have been notified.',
        data: {
          sosAlert,
          ride: {
            id: ride.id,
            riderName: ride.rider?.name,
            driverName: ride.driver?.user?.name
          }
        }
      });
    } catch (error: any) {
      console.error('Trigger SOS error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to trigger SOS' });
    }
  }

  // ============================================
  // RESOLVE SOS
  // ============================================
  async resolveSOS(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const sosAlert = await prisma.sOSAlert.findUnique({
        where: { id }
      });

      if (!sosAlert) {
        return res.status(404).json({ success: false, message: 'SOS alert not found' });
      }

      // Update SOS alert status
      const resolvedAlert = await prisma.sOSAlert.update({
        where: { id },
        data: { status: 'RESOLVED' }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: sosAlert.userId,
          title: '✅ SOS Alert Resolved',
          message: `SOS alert has been resolved by admin`,
          type: 'SOS_RESOLVED'
        }
      });

      return res.json({
        success: true,
        message: 'SOS alert resolved successfully',
        data: resolvedAlert
      });
    } catch (error: any) {
      console.error('Resolve SOS error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to resolve SOS' });
    }
  }

  // ============================================
  // GET ACTIVE SOS ALERTS
  // ============================================
  async getActiveSOS(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const isAdmin = user?.role === 'ADMIN';

      const where = isAdmin
        ? { status: 'ACTIVE' }
        : { userId, status: 'ACTIVE' };

      const activeAlerts = await prisma.sOSAlert.findMany({
        where,
        include: {
          ride: {
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: activeAlerts
      });
    } catch (error: any) {
      console.error('Get active SOS error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get active SOS alerts' });
    }
  }

  // ============================================
  // GET USER SOS HISTORY
  // ============================================
  async getUserSOSHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const alerts = await prisma.sOSAlert.findMany({
        where: { userId },
        include: {
          ride: {
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      console.error('Get SOS history error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get SOS history' });
    }
  }

  // ============================================
  // GET SOS BY ID
  // ============================================
  async getSOSById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const sosAlert = await prisma.sOSAlert.findUnique({
        where: { id },
        include: {
          ride: {
            include: {
              rider: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              },
              driver: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });

      if (!sosAlert) {
        return res.status(404).json({ success: false, message: 'SOS alert not found' });
      }

      // Check if user is authorized (admin or the one who triggered the SOS)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const isAuthorized = user?.role === 'ADMIN' || sosAlert.userId === userId;

      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      return res.json({
        success: true,
        data: sosAlert
      });
    } catch (error: any) {
      console.error('Get SOS by ID error:', error);
      return res.status(500).json({ success: false, message: error.message || 'Failed to get SOS alert' });
    }
  }
}

export default SOSController;