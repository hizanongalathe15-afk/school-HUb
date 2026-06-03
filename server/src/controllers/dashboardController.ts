import { Request, Response } from 'express';
import { getDashboardModules, getDashboardSnapshot, runDashboardAction } from '../services/dashboardService.js';

export const dashboardController = {
  modules: (_req: Request, res: Response) => {
    res.json({ data: getDashboardModules() });
  },

  snapshot: async (req: Request, res: Response) => {
    const { moduleId } = req.params;

    try {
      const snapshot = await getDashboardSnapshot(moduleId);
      res.json({ data: snapshot });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unable to load dashboard snapshot'
      });
    }
  },

  action: async (req: Request, res: Response) => {
    const { moduleId } = req.params;
    const { action } = req.body;
    const userId = (req as any).user?.userId;

    if (!action || typeof action !== 'string') {
      return res.status(400).json({ message: 'Action is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Authenticated user is required' });
    }

    try {
      const result = await runDashboardAction(moduleId, action, userId, req.ip, req.get('user-agent'));
      res.json({ data: result });
    } catch (error) {
      res.status(500).json({
        message: error instanceof Error ? error.message : 'Unable to complete dashboard action'
      });
    }
  }
};
