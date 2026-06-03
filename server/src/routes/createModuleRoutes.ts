import { Router } from 'express';
import { createModuleController } from '../controllers/moduleController.js';
import { auth } from '../middleware/auth.js';

export function createModuleRoutes(moduleId: string) {
  const router = Router();
  const controller = createModuleController(moduleId);

  router.get('/', auth, controller.list);
  router.post('/', auth, controller.create);
  router.post('/actions', auth, controller.action);

  return router;
}
