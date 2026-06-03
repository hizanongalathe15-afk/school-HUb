import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Inventory items
router.get('/', auth, inventoryController.getAll);
router.get('/:id', auth, inventoryController.getById);
router.post('/', auth, inventoryController.create);
router.put('/:id', auth, inventoryController.update);
router.delete('/:id', auth, inventoryController.delete);
router.patch('/:id/quantity', auth, inventoryController.updateQuantity);
router.get('/low-stock', auth, inventoryController.getLowStock);

// Stock requests
router.get('/requests', auth, inventoryController.getRequests);
router.post('/requests', auth, inventoryController.createRequest);
router.put('/requests/:id/approve', auth, inventoryController.approveRequest);
router.put('/requests/:id/reject', auth, inventoryController.rejectRequest);

export default router;