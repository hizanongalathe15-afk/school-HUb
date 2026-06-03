import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', auth, authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-password', auth, authController.changePassword);
router.get('/auth/me', auth, authController.me);
router.patch('/auth/me', auth, authController.updateMe);

export default router;
