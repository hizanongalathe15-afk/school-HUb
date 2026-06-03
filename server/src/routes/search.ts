import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { searchController } from '../controllers/searchController.js';

const router = Router();

router.get('/', auth, searchController.global);

export default router;
