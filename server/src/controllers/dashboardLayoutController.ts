import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { canEditDashboard } from '../utils/accessControl.js';
import { dashboardLayoutService } from '../services/dashboardLayoutService.js';

export const dashboardLayoutController = {
  get: async (req: Request, res: Response) => {
    const requestRole = (req as any).user?.role as Role;
    const targetRole = String(req.query.role || requestRole) as Role;
    const moduleId = req.params.moduleId;

    if (!canEditDashboard(requestRole, targetRole)) {
      return res.status(403).json({ message: 'You can only edit your own dashboard layout.' });
    }

    res.json(await dashboardLayoutService.get(targetRole, moduleId));
  },

  save: async (req: Request, res: Response) => {
    const requestRole = (req as any).user?.role as Role;
    const targetRole = String(req.body?.role || requestRole) as Role;
    const moduleId = req.params.moduleId;

    if (!canEditDashboard(requestRole, targetRole)) {
      return res.status(403).json({ message: 'You can only edit your own dashboard layout.' });
    }

    const widgets = Array.isArray(req.body?.widgets) ? req.body.widgets : [];
    res.json(await dashboardLayoutService.save(targetRole, moduleId, widgets));
  }
};

