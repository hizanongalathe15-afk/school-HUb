import { Router } from 'express';
import { infrastructureController } from '../controllers/infrastructureController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, infrastructureController.getInfrastructure);
router.put('/', auth, infrastructureController.updateInfrastructure);
router.get('/maintenance-jobs', auth, infrastructureController.getMaintenanceJobs);
router.post('/maintenance-jobs', auth, infrastructureController.createMaintenanceJob);
router.put('/maintenance-jobs/:jobId', auth, infrastructureController.updateMaintenanceJob);

export default router;