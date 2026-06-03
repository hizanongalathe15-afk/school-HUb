import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { systemMetricsController } from '../controllers/systemMetricsController.js';

const router = Router();

router.get('/', auth, systemMetricsController.get);
router.post('/logout-others', auth, systemMetricsController.logoutOthers);
router.post('/logout-selected', auth, systemMetricsController.logoutSelected);
router.post('/clear-inactive', auth, systemMetricsController.clearInactive);
router.post('/clear-all-sessions', auth, systemMetricsController.clearAllSessions);

export default router;
