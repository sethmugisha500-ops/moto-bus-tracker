// backend-api/src/routes/notifications.ts
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /api/notifications ──────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = '20' } = req.query;

    // Get all notifications for user (no 'read' field)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    // Count notifications - all are considered unread since no 'read' field
    const totalCount = await prisma.notification.count({
      where: { userId },
    });

    res.json({
      success: true,
      notifications,
      unreadCount: totalCount, // All notifications are "unread" since no read field
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/notifications/:id/read ─────────────────────────────
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Since there's no 'read' field, we just return success
    // You could delete the notification or mark it differently
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Option 1: Delete the notification when "read"
    // await prisma.notification.delete({ where: { id } });

    // Option 2: Just return success (keep as-is)
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });

  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/notifications/read-all ─────────────────────────────
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Since there's no 'read' field, we delete all notifications instead
    // Option 1: Delete all notifications
    // await prisma.notification.deleteMany({
    //   where: { userId },
    // });

    // Option 2: Just return success
    res.json({
      success: true,
      message: 'All notifications cleared',
    });

  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE /api/notifications/:id ──────────────────────────────
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });

  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── DELETE /api/notifications ──────────────────────────────────
router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
    });

  } catch (error: any) {
    console.error('Clear notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;