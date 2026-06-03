import { Router } from 'express';
import { studentController } from '../controllers/studentController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, studentController.getAll);
router.get('/search', auth, studentController.search);
router.get('/by-class/:classId', auth, studentController.getByClass);
router.post('/bulk', auth, studentController.bulkImport);
router.get('/:id', auth, studentController.getById);
router.post('/', auth, studentController.create);
router.put('/:id', auth, studentController.update);
router.delete('/:id', auth, studentController.delete);
router.get('/:id/results', auth, studentController.getResults);
router.get('/:id/attendance', auth, studentController.getAttendance);
router.get('/:id/fees/balance', auth, studentController.getFeeBalance);
router.post('/:id/fees/pay', auth, studentController.getFeeBalance);
router.get('/:id/discipline', auth, studentController.getDiscipline);
router.get('/:id/parents', auth, studentController.getParents);
router.post('/:id/parents/link', auth, studentController.linkParent);
router.get('/:id/timetable', auth, studentController.getTimetable);

export default router;
