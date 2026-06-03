import { Router } from 'express';
import { usersController } from '../controllers/usersController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Get public user profile (authenticated)
router.get('/:userId', auth, usersController.getPublicUser);

// Increment profile views (authenticated)
router.post('/:userId/view', auth, usersController.incrementView);

export default router;
