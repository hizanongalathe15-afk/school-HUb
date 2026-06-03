import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { mediaController } from '../controllers/mediaController.js';
import { auth } from '../middleware/auth.js';

const router = Router();
const mediaUploadDir = path.resolve(process.cwd(), 'server/uploads/media');

fs.mkdirSync(mediaUploadDir, { recursive: true });

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, mediaUploadDir),
    filename: (_req, file, cb) => {
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'media';
      cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 40 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    cb(allowed ? null : new Error('Unsupported media type'), allowed);
  },
});

router.get('/', auth, mediaController.listGallery);
router.post('/', auth, mediaController.createGalleryItem);
router.post('/upload', auth, mediaUpload.array('files', 40), mediaController.uploadGalleryFiles);
router.get('/videos', auth, mediaController.listVideos);
router.post('/videos', auth, mediaController.uploadVideo);
router.get('/events/:eventId', auth, mediaController.getEventMedia);
router.post('/events/:eventId', auth, mediaController.uploadEventMedia);
router.get('/achievements', auth, mediaController.getAchievementsMedia);
router.post('/achievements', auth, mediaController.uploadAchievementMedia);
router.get('/:id', auth, mediaController.getGalleryItem);
router.put('/:id', auth, mediaController.updateGalleryItem);
router.delete('/:id', auth, mediaController.deleteGalleryItem);
router.patch('/:id/publish', auth, mediaController.publishMedia);
router.patch('/:id/unpublish', auth, mediaController.unpublishMedia);

export default router;
