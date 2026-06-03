import { Router } from 'express';
import { communicationController } from '../controllers/communicationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, communicationController.status);
router.post('/broadcast', auth, communicationController.broadcast);
router.post('/chat/send', auth, communicationController.sendMessage);
router.get('/chat/messages/:userId', auth, communicationController.getMessages);
router.post('/sms/send', auth, communicationController.sendSms);
router.post('/whatsapp/broadcast', auth, communicationController.broadcast);

export default router;
