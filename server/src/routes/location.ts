import { Router } from 'express';
import { locationController } from '../controllers/locationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, locationController.getLocationInfo);
router.put('/', auth, locationController.updateLocationInfo);
router.get('/map-pins', auth, locationController.getMapPins);
router.post('/map-pins', auth, locationController.addMapPin);
router.get('/routes', auth, locationController.getRoutes);
router.post('/routes', auth, locationController.addRoute);
router.get('/visitor-directions', auth, locationController.getVisitorDirections);

export default router;