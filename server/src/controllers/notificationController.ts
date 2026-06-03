import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { notificationService } from '../services/notificationService.js';

function getUserId(req: Request) {
  return String((req as any).user?.userId || '');
}

export const notificationController = {
  async list(req: Request, res: Response) {
    try {
      const includeArchived = String(req.query.archived || '') === 'true';
      const data = await notificationService.list(getUserId(req), includeArchived);
      res.json({ data });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Unable to load notifications' });
    }
  },

  async markRead(req: Request, res: Response) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
      const data = await notificationService.markRead(getUserId(req), ids);
      res.json({ data, message: 'Notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications read:', error);
      res.status(500).json({ message: 'Unable to update notifications' });
    }
  },

  async markAllRead(req: Request, res: Response) {
    try {
      const data = await notificationService.markAllRead(getUserId(req));
      res.json({ data, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications read:', error);
      res.status(500).json({ message: 'Unable to update notifications' });
    }
  },

  async archive(req: Request, res: Response) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
      const data = await notificationService.archive(getUserId(req), ids);
      res.json({ data, message: 'Notifications archived' });
    } catch (error) {
      console.error('Error archiving notifications:', error);
      res.status(500).json({ message: 'Unable to archive notifications' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
      const data = await notificationService.delete(getUserId(req), ids);
      res.json({ data, message: 'Notifications deleted' });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      res.status(500).json({ message: 'Unable to delete notifications' });
    }
  },

  async stream(req: Request, res: Response) {
    const token = String(req.query.token || '');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const send = async () => {
        const data = await notificationService.list(decoded.userId);
        res.write(`event: notifications\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      await send();
      const interval = setInterval(() => {
        void send().catch(() => undefined);
      }, 10000);

      req.on('close', () => {
        clearInterval(interval);
        res.end();
      });
    } catch {
      res.status(401).json({ message: 'Invalid notification stream token' });
    }
  }
};
