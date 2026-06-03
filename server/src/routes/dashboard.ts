import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/modules', auth, dashboardController.modules);
router.get('/modules/:moduleId/snapshot', auth, dashboardController.snapshot);
router.post('/modules/:moduleId/actions', auth, dashboardController.action);

export default router;
