import { Router } from 'express';
import { resultController } from '../controllers/resultController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, resultController.summary);
router.get('/student/:studentId', auth, resultController.getByStudent);
router.get('/class/:classId', auth, resultController.getByClass);
router.get('/:studentId', auth, resultController.getByStudent);
router.post('/', auth, resultController.enter);
router.post('/upload', auth, resultController.bulkUpload);

export default router;
