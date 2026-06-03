import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/academic', auth, reportController.generateAcademicReport);
router.post('/financial', auth, reportController.generateFinancialReport);
router.post('/attendance', auth, reportController.generateAttendanceReport);
router.post('/inventory', auth, reportController.generateInventoryReport);
router.post('/export', auth, reportController.exportToExcel);

export default router;