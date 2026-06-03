import { Router } from 'express';
import { mediaController } from '../controllers/mediaController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, mediaController.listGallery);
router.post('/', auth, mediaController.createGalleryItem);
router.get('/:id', auth, mediaController.getGalleryItem);
router.put('/:id', auth, mediaController.updateGalleryItem);
router.delete('/:id', auth, mediaController.deleteGalleryItem);
router.patch('/:id/publish', auth, mediaController.publishMedia);
router.patch('/:id/unpublish', auth, mediaController.unpublishMedia);
router.get('/videos', auth, mediaController.listVideos);
router.post('/videos', auth, mediaController.uploadVideo);
router.get('/events/:eventId', auth, mediaController.getEventMedia);
router.post('/events/:eventId', auth, mediaController.uploadEventMedia);
router.get('/achievements', auth, mediaController.getAchievementsMedia);
router.post('/achievements', auth, mediaController.uploadAchievementMedia);

export default router;