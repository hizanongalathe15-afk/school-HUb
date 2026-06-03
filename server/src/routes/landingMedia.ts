import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { landingMediaController } from '../controllers/landingMediaController.js';

const router = Router();

router.get('/', auth, landingMediaController.list);
router.post('/', auth, landingMediaController.create);
router.patch('/reorder', auth, landingMediaController.reorder);
router.patch('/:id', auth, landingMediaController.update);
router.delete('/:id', auth, landingMediaController.remove);

export default router;
