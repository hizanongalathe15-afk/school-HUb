import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, attendanceController.summary);
router.get('/student/:studentId', auth, attendanceController.getByStudent);
router.get('/:studentId', auth, attendanceController.getByStudent);
router.post('/', auth, attendanceController.mark);
router.post('/mark', auth, attendanceController.mark);

export default router;
