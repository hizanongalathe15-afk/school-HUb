import { Request, Response } from 'express';
import {
  createSystemRecord,
  getSystemModule,
  listSystemModules,
  runSystemModuleAction
} from '../services/moduleService.js';

export function createModuleController(moduleId: string) {
  return {
    list: (_req: Request, res: Response) => {
      const module = getSystemModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      return res.json(module);
    },

    create: (req: Request, res: Response) => {
      const record = createSystemRecord(moduleId, req.body);
      if (!record) {
        return res.status(404).json({ message: 'Module not found' });
      }

      return res.status(201).json(record);
    },

    action: (req: Request, res: Response) => {
      const action = typeof req.body?.action === 'string' ? req.body.action : 'Run module action';
      const result = runSystemModuleAction(moduleId, action);
      if (!result) {
        return res.status(404).json({ message: 'Module not found' });
      }

      return res.json(result);
    }
  };
}

export const moduleController = {
  listAll: (_req: Request, res: Response) => {
    res.json(listSystemModules());
  }
};
