import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { dashboardLayoutController } from '../controllers/dashboardLayoutController.js';

const router = Router();

router.get('/:moduleId', auth, dashboardLayoutController.get);
router.put('/:moduleId', auth, dashboardLayoutController.save);

export default router;

