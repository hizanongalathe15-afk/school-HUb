import { Router } from 'express';
import { schoolController, footerController, publicPageController, landingContentController } from '../controllers/schoolController.js';
import { auth } from '../middleware/auth.js';
import { canManageLanding } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', schoolController.get);
router.put('/', auth, schoolController.update);
router.post('/location', auth, schoolController.updateLocation);

router.get('/landing-content', auth, canManageLanding, landingContentController.get);
router.put('/landing-content', auth, canManageLanding, landingContentController.update);

// Footer management routes
router.get('/footer', footerController.getContent);
router.put('/footer', auth, canManageLanding, footerController.updateContent);
router.post('/footer/reset', auth, canManageLanding, footerController.resetContent);

// Editable public content pages
router.get('/public-pages', publicPageController.list);
router.get('/public-pages/*', publicPageController.getBySlug);
router.put('/public-pages/*', auth, canManageLanding, publicPageController.updatePage);
router.post('/public-pages/reset', auth, canManageLanding, publicPageController.reset);

export default router;
