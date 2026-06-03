import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { analyticsController } from '../controllers/analyticsController.js';

const router = Router();

router.get('/schools', auth, analyticsController.schools);
router.get('/system', auth, analyticsController.system);
router.get('/system/history', auth, analyticsController.systemHistory);
router.get('/students', auth, analyticsController.students);
router.get('/fees', auth, analyticsController.fees);
router.get('/attendance', auth, analyticsController.attendance);
router.get('/performance', auth, analyticsController.performance);
router.get('/departments', auth, analyticsController.departments);
router.get('/export', auth, analyticsController.exportReport);

export default router;
