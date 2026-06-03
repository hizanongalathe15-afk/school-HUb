import { Router } from 'express';
import { auth, roleCheck } from '../middleware/auth.js';
import { storeKeeperController } from '../controllers/storeKeeperController.js';

const router = Router();

router.use(auth);
router.use(roleCheck(['STORE_KEEPER', 'ADMIN', 'PRINCIPAL']));

// Dashboard
router.get('/dashboard', storeKeeperController.getDashboard);
router.get('/dashboard/stats', storeKeeperController.getDashboard);

// Inventory
router.get('/inventory', storeKeeperController.getInventory);
router.post('/inventory/bulk-import', storeKeeperController.addItem);
router.get('/inventory/:itemId', storeKeeperController.getItem);
router.post('/inventory', storeKeeperController.addItem);
router.put('/inventory/:itemId', storeKeeperController.updateItem);
router.delete('/inventory/:itemId', storeKeeperController.deleteItem);
router.patch('/inventory/:itemId/quantity', storeKeeperController.updateQuantity);
router.get('/inventory/:itemId/history', storeKeeperController.getItemHistory);

// Categories
router.get('/categories', storeKeeperController.getCategories);
router.post('/categories', storeKeeperController.addCategory);
router.put('/categories/:categoryId', storeKeeperController.addCategory);
router.delete('/categories/:categoryId', storeKeeperController.addCategory);

// Suppliers
router.get('/suppliers', storeKeeperController.getSuppliers);
router.get('/suppliers/:supplierId', storeKeeperController.getSupplier);
router.post('/suppliers', storeKeeperController.addSupplier);
router.put('/suppliers/:supplierId', storeKeeperController.updateSupplier);
router.delete('/suppliers/:supplierId', storeKeeperController.deleteSupplier);
router.get('/suppliers/:supplierId/orders', storeKeeperController.getPurchaseOrders);

// Requests
router.get('/requests', storeKeeperController.getRequests);
router.get('/requests/:requestId', storeKeeperController.getRequest);
router.post('/requests', storeKeeperController.createRequest);
router.post('/requests/:requestId/approve', storeKeeperController.approveRequest);
router.post('/requests/:requestId/reject', storeKeeperController.rejectRequest);
router.post('/requests/:requestId/fulfill', storeKeeperController.fulfillRequest);

// Purchase Orders
router.get('/purchase-orders', storeKeeperController.getPurchaseOrders);
router.get('/purchase-orders/:poId', storeKeeperController.getPurchaseOrder);
router.post('/purchase-orders', storeKeeperController.createPurchaseOrder);
router.put('/purchase-orders/:poId', storeKeeperController.updatePurchaseOrder);
router.post('/purchase-orders/:poId/approve', storeKeeperController.approvePurchaseOrder);
router.post('/purchase-orders/:poId/send', storeKeeperController.markPurchaseOrderSent);
router.post('/purchase-orders/:poId/receive', storeKeeperController.receivePurchaseOrder);
router.post('/purchase-orders/:poId/cancel', storeKeeperController.cancelPurchaseOrder);

// Stock Movements
router.get('/movements', storeKeeperController.getMovements);
router.post('/movements/:type', storeKeeperController.createStockMovement);

// Stock Take
router.get('/stock-takes', storeKeeperController.getStockTakes);
router.post('/stock-takes', storeKeeperController.createStockTake);
router.get('/stock-takes/:stockTakeId', storeKeeperController.getStockTake);
router.patch('/stock-takes/:stockTakeId/items/:itemId', storeKeeperController.updateStockTakeItem);
router.post('/stock-takes/:stockTakeId/complete', storeKeeperController.completeStockTake);
router.post('/stock-takes/:stockTakeId/approve-adjustments', storeKeeperController.approveStockTakeAdjustments);

// Borrowings use stock movement records for issue/return until a dedicated borrowing table is added.
router.get('/borrowings', storeKeeperController.getBorrowings);
router.post('/borrowings', storeKeeperController.createBorrowing);
router.post('/borrowings/:borrowingId/return', storeKeeperController.createStockMovement);
router.post('/borrowings/:borrowingId/lost', storeKeeperController.createStockMovement);
router.post('/borrowings/:borrowingId/late-fee', storeKeeperController.updateSettings);

// Alerts
router.get('/alerts', storeKeeperController.getAlerts);
router.get('/alerts/stats', storeKeeperController.getAlertStats);
router.patch('/alerts/:alertId/read', storeKeeperController.getAlertStats);
router.patch('/alerts/read-all', storeKeeperController.getAlertStats);

// Reports
router.post('/reports/generate', storeKeeperController.generateReport);
router.get('/reports/templates', storeKeeperController.getReportTemplates);
router.get('/reports/:reportId/export', storeKeeperController.generateReport);

// Fixed Assets
router.get('/fixed-assets', storeKeeperController.getFixedAssets);

// Deliveries
router.get('/deliveries', storeKeeperController.getDeliveries);
router.post('/deliveries/:poId/receive', storeKeeperController.markDeliveryReceived);

// Notifications
router.get('/notifications', storeKeeperController.getNotifications);
router.get('/notifications/unread-count', storeKeeperController.getUnreadCount);
router.patch('/notifications/read-all', storeKeeperController.markAllNotificationsAsRead);
router.patch('/notifications/:notificationId/read', storeKeeperController.markNotificationAsRead);

// Store settings and storage locations
router.put('/settings', storeKeeperController.updateSettings);
router.get('/settings', storeKeeperController.getSettings);
router.get('/locations', storeKeeperController.getLocations);
router.post('/locations', storeKeeperController.addLocation);
router.put('/locations/:locationId', storeKeeperController.updateLocation);
router.delete('/locations/:locationId', storeKeeperController.deleteLocation);

// Summary endpoints
router.get('/inventory/expiry-summary', storeKeeperController.getExpirySummary);
router.get('/locations/summary', storeKeeperController.getLocationSummary);
router.get('/movements/summary', storeKeeperController.getMovementSummary);
router.get('/deliveries/summary', storeKeeperController.getDeliverySummary);

export default router;
