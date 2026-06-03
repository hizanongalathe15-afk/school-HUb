import { Router } from 'express';
import { onlineClassController } from '../controllers/onlineClassController.js';
import { auth, roleCheck } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, onlineClassController.list);
router.post('/', auth, roleCheck(['DEVELOPER', 'ADMIN', 'PRINCIPAL', 'TEACHER']), onlineClassController.create);
router.post('/:id/join', auth, onlineClassController.join);
router.post('/:id/focus', auth, onlineClassController.focus);

export default router;

