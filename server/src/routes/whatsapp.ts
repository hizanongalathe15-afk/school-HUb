import { Router } from 'express';
import { communicationController } from '../controllers/communicationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/broadcast', auth, communicationController.broadcast);

export default router;
