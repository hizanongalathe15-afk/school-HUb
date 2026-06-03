import { Router } from 'express';
import { getLandingContent } from '../controllers/schoolController.js';

const router = Router();

router.get('/landing', getLandingContent);

export default router;
