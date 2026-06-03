import { Router } from 'express';
import { timetableController } from '../controllers/timetableController.js';
import { auth, roleCheck } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(auth);
router.use(roleCheck(['ADMIN', 'PRINCIPAL', 'TEACHER', 'BURSAR']));

// Timetable endpoints
router.get('/', timetableController.getAll);
router.get('/class/:classId', timetableController.getByClass);
router.get('/teacher/:teacherId', timetableController.getByTeacher);
router.post('/', timetableController.create);
router.put('/:id', timetableController.update);
router.delete('/:id', timetableController.delete);
router.post('/validate-conflicts', timetableController.validateConflicts);

export default router;