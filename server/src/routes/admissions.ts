import { Router } from 'express';
import { admissionController } from '../controllers/admissionController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Public endpoint for guests to submit applications
router.post('/submit', admissionController.submitApplication);
router.post('/connect-existing', admissionController.connectExistingStudent);

// Public endpoint to get the admission form template (for guests to view/fill)
router.get('/form-template', admissionController.getFormTemplate);
router.get('/automation-manifest', admissionController.automationManifest);

// Protected endpoints for admin/principal to manage applications
router.get('/', auth, admissionController.getApplications);
router.get('/:id', auth, admissionController.getApplicationById);
router.put('/:id/status', auth, admissionController.updateApplicationStatus);
router.put('/form-template', auth, admissionController.manageFormTemplate);

export default router;
