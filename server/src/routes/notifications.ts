import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { notificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/', auth, notificationController.list);
router.get('/stream', notificationController.stream);
router.patch('/read', auth, notificationController.markRead);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/archive', auth, notificationController.archive);
router.delete('/', auth, notificationController.delete);

export default router;
