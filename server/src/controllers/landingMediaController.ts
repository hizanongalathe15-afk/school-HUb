import { Request, Response } from 'express';
import { canManageLanding } from '../utils/accessControl.js';
import { landingMediaService } from '../services/landingMediaService.js';

export const landingMediaController = {
  list: async (_req: Request, res: Response) => {
    res.json({ data: await landingMediaService.list() });
  },

  create: async (req: Request, res: Response) => {
    try {
      if (!canManageLanding((req as any).user?.role)) {
        return res.status(403).json({ message: 'Only admin, principal, or developer can manage landing content.' });
      }

      const item = await landingMediaService.create(req.body, (req as any).user?.userId);
      res.status(201).json({ data: item, message: item.section === 'ads' || item.type === 'ad' ? 'Advertisement published successfully' : 'Landing media published successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Unable to save landing media' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      if (!canManageLanding((req as any).user?.role)) {
        return res.status(403).json({ message: 'Only admin, principal, or developer can manage landing content.' });
      }

      const item = await landingMediaService.update(req.params.id, req.body, (req as any).user?.userId);
      if (!item) return res.status(404).json({ message: 'Landing media not found' });
      res.json({ data: item, message: item.section === 'ads' || item.type === 'ad' ? 'Advertisement updated successfully' : 'Landing media updated successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Unable to update landing media' });
    }
  },

  reorder: async (req: Request, res: Response) => {
    if (!canManageLanding((req as any).user?.role)) {
      return res.status(403).json({ message: 'Only admin, principal, or developer can manage landing content.' });
    }

    const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds.map(String) : [];
    res.json({ data: await landingMediaService.reorder(orderedIds), message: 'Landing media order saved' });
  },

  remove: async (req: Request, res: Response) => {
    if (!canManageLanding((req as any).user?.role)) {
      return res.status(403).json({ message: 'Only admin, principal, or developer can manage landing content.' });
    }

    const removed = await landingMediaService.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Landing media not found' });
    }
    res.json({ message: 'Landing media deleted' });
  }
};
