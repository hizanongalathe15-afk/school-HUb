import api from './api';
import type {
  InventoryItem,
  InventoryCategory,
  LowStockItem,
  Supplier,
  SupplierProduct,
  StockRequest,
  PurchaseOrder,
  StockMovement,
  StockTake,
  BorrowingRecord,
  BorrowedItem,
  ReturnTransaction,
  StockAlert,
  StorageLocation,
  MaintenanceRecord,
  StoreKeeperDashboard,
  StockReport,
  StoreKeeperNotification,
  StoreKeeperApiResponse,
} from '../types/storeKeeper';

// ============================================
// DASHBOARD API
// ============================================
export const storeKeeperDashboardAPI = {
  getDashboard: async (): Promise<StoreKeeperApiResponse<StoreKeeperDashboard>> => {
    const response = await api.get('/storekeeper/dashboard');
    return response.data;
  },

  getQuickStats: async () => {
    const response = await api.get('/storekeeper/dashboard/stats');
    return response.data;
  },
};

// ============================================
// INVENTORY API
// ============================================
export const inventoryAPI = {
  // Get all inventory items
  getInventory: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    location?: string;
    status?: string;
    search?: string;
    lowStock?: boolean;
  }): Promise<StoreKeeperApiResponse<InventoryItem[]>> => {
    const response = await api.get('/storekeeper/inventory', { params });
    return response.data;
  },

  getLowStockItems: async (): Promise<StoreKeeperApiResponse<LowStockItem[]>> => {
    const response = await api.get('/storekeeper/inventory/low-stock');
    return response.data;
  },

  // Get single item
  getItem: async (itemId: string): Promise<StoreKeeperApiResponse<InventoryItem>> => {
    const response = await api.get(`/storekeeper/inventory/${itemId}`);
    return response.data;
  },

  // Add new item
  addItem: async (itemData: Partial<InventoryItem>) => {
    const response = await api.post('/storekeeper/inventory', itemData);
    return response.data;
  },

  // Update item
  updateItem: async (itemId: string, itemData: Partial<InventoryItem>) => {
    const response = await api.put(`/storekeeper/inventory/${itemId}`, itemData);
    return response.data;
  },

  // Delete item
  deleteItem: async (itemId: string) => {
    const response = await api.delete(`/storekeeper/inventory/${itemId}`);
    return response.data;
  },

  // Bulk import
  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/storekeeper/inventory/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update stock quantity
  updateQuantity: async (itemId: string, quantity: number, reason: string) => {
    const response = await api.patch(`/storekeeper/inventory/${itemId}/quantity`, { quantity, reason });
    return response.data;
  },

  // Get item history
  getItemHistory: async (itemId: string) => {
    const response = await api.get(`/storekeeper/inventory/${itemId}/history`);
    return response.data;
  },
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesAPI = {
  getCategories: async (): Promise<StoreKeeperApiResponse<InventoryCategory[]>> => {
    const response = await api.get('/storekeeper/categories');
    return response.data;
  },

  addCategory: async (categoryData: Partial<InventoryCategory>) => {
    const response = await api.post('/storekeeper/categories', categoryData);
    return response.data;
  },

  updateCategory: async (categoryId: string, categoryData: Partial<InventoryCategory>) => {
    const response = await api.put(`/storekeeper/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId: string) => {
    const response = await api.delete(`/storekeeper/categories/${categoryId}`);
    return response.data;
  },
};

// ============================================
// SUPPLIERS API
// ============================================
export const suppliersAPI = {
  getSuppliers: async (params?: { status?: string; search?: string; category?: string }): Promise<StoreKeeperApiResponse<Supplier[]>> => {
    const response = await api.get('/storekeeper/suppliers', { params });
    return response.data;
  },

  getSupplier: async (supplierId: string): Promise<StoreKeeperApiResponse<Supplier>> => {
    const response = await api.get(`/storekeeper/suppliers/${supplierId}`);
    return response.data;
  },

  getSupplierProducts: async (supplierId: string): Promise<StoreKeeperApiResponse<SupplierProduct[]>> => {
    const response = await api.get(`/storekeeper/suppliers/${supplierId}/products`);
    return response.data;
  },

  addSupplier: async (supplierData: Partial<Supplier>) => {
    const response = await api.post('/storekeeper/suppliers', supplierData);
    return response.data;
  },

  updateSupplier: async (supplierId: string, supplierData: Partial<Supplier>) => {
    const response = await api.put(`/storekeeper/suppliers/${supplierId}`, supplierData);
    return response.data;
  },

  deleteSupplier: async (supplierId: string) => {
    const response = await api.delete(`/storekeeper/suppliers/${supplierId}`);
    return response.data;
  },

  getSupplierOrders: async (supplierId: string) => {
    const response = await api.get(`/storekeeper/suppliers/${supplierId}/orders`);
    return response.data;
  },
};

// ============================================
// STOCK REQUESTS API
// ============================================
export const requestsAPI = {
  getRequests: async (params?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<StoreKeeperApiResponse<StockRequest[]>> => {
    const response = await api.get('/storekeeper/requests', { params });
    return response.data;
  },

  getRequest: async (requestId: string): Promise<StoreKeeperApiResponse<StockRequest>> => {
    const response = await api.get(`/storekeeper/requests/${requestId}`);
    return response.data;
  },

  approveRequest: async (requestId: string, items?: { itemId: string; quantity: number }[]) => {
    const response = await api.post(`/storekeeper/requests/${requestId}/approve`, { items });
    return response.data;
  },

  rejectRequest: async (requestId: string, reason: string) => {
    const response = await api.post(`/storekeeper/requests/${requestId}/reject`, { reason });
    return response.data;
  },

  fulfillRequest: async (requestId: string, items: { itemId: string; quantity: number }[]) => {
    const response = await api.post(`/storekeeper/requests/${requestId}/fulfill`, { items });
    return response.data;
  },

  createRequest: async (requestData: Partial<StockRequest>) => {
    const response = await api.post('/storekeeper/requests', requestData);
    return response.data;
  },
};

// ============================================
// PURCHASE ORDERS API
// ============================================
export const purchaseOrdersAPI = {
  getPurchaseOrders: async (params?: {
    status?: string;
    supplierId?: string;
    page?: number;
    limit?: number;
  }): Promise<StoreKeeperApiResponse<PurchaseOrder[]>> => {
    const response = await api.get('/storekeeper/purchase-orders', { params });
    return response.data;
  },

  getPurchaseOrder: async (poId: string): Promise<StoreKeeperApiResponse<PurchaseOrder>> => {
    const response = await api.get(`/storekeeper/purchase-orders/${poId}`);
    return response.data;
  },

  createPurchaseOrder: async (poData: Partial<PurchaseOrder>) => {
    const response = await api.post('/storekeeper/purchase-orders', poData);
    return response.data;
  },

  updatePurchaseOrder: async (poId: string, poData: Partial<PurchaseOrder>) => {
    const response = await api.put(`/storekeeper/purchase-orders/${poId}`, poData);
    return response.data;
  },

  approvePurchaseOrder: async (poId: string) => {
    const response = await api.post(`/storekeeper/purchase-orders/${poId}/approve`);
    return response.data;
  },

  markAsSent: async (poId: string) => {
    const response = await api.post(`/storekeeper/purchase-orders/${poId}/send`);
    return response.data;
  },

  receiveOrder: async (poId: string, items: { itemId: string; quantity: number }[]) => {
    const response = await api.post(`/storekeeper/purchase-orders/${poId}/receive`, { items });
    return response.data;
  },

  cancelPurchaseOrder: async (poId: string, reason: string) => {
    const response = await api.post(`/storekeeper/purchase-orders/${poId}/cancel`, { reason });
    return response.data;
  },
};

// ============================================
// STOCK MOVEMENTS API
// ============================================
export const movementsAPI = {
  getMovements: async (params?: {
    type?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<StoreKeeperApiResponse<StockMovement[]>> => {
    const response = await api.get('/storekeeper/movements', { params });
    return response.data;
  },

  // Issue items
  issueItems: async (data: {
    itemId: string;
    quantity: number;
    issuedTo: string;
    issuedToName: string;
    notes?: string;
  }) => {
    const response = await api.post('/storekeeper/movements/issue', data);
    return response.data;
  },

  // Return items
  returnItems: async (data: {
    itemId: string;
    quantity: number;
    returnedBy: string;
    condition?: string;
    notes?: string;
  }) => {
    const response = await api.post('/storekeeper/movements/return', data);
    return response.data;
  },

  // Transfer items
  transferItems: async (data: {
    itemId: string;
    quantity: number;
    fromLocation: string;
    toLocation: string;
    notes?: string;
  }) => {
    const response = await api.post('/storekeeper/movements/transfer', data);
    return response.data;
  },

  // Write-off items
  writeOffItems: async (data: {
    itemId: string;
    quantity: number;
    reason: string;
    notes?: string;
  }) => {
    const response = await api.post('/storekeeper/movements/write-off', data);
    return response.data;
  },
};

// ============================================
// RETURNS API
// ============================================
export const returnsAPI = {
  getBorrowedItems: async (params?: { overdueOnly?: boolean }): Promise<StoreKeeperApiResponse<BorrowedItem[]>> => {
    const response = await api.get('/storekeeper/returns/borrowed', { params });
    return response.data;
  },

  getReturns: async (params?: { startDate?: string; endDate?: string; condition?: string }): Promise<StoreKeeperApiResponse<ReturnTransaction[]>> => {
    const response = await api.get('/storekeeper/returns', { params });
    return response.data;
  },

  processReturn: async (data: {
    itemId: string;
    quantity: number;
    returnedBy: string;
    returnedById: string;
    returnerType: 'teacher' | 'student' | 'staff';
    condition: 'new' | 'good' | 'fair' | 'damaged' | 'unusable';
    damageType?: string;
    damageNotes?: string;
    repairCost?: number;
    replacementCost?: number;
    chargeFee?: boolean;
    feeAmount?: number;
    notes?: string;
    receiptNumber?: string;
  }) => {
    const response = await api.post('/storekeeper/returns', data);
    return response.data;
  },

  returnBorrowedItem: async (borrowedId: string, data: {
    condition: 'new' | 'good' | 'fair' | 'damaged' | 'unusable';
    damageNotes?: string;
    repairCost?: number;
    chargeLateFee?: boolean;
  }) => {
    const response = await api.post(`/storekeeper/returns/borrowed/${borrowedId}/return`, data);
    return response.data;
  },

  sendOverdueReminder: async (borrowedId: string, method: 'sms' | 'email' | 'whatsapp') => {
    const response = await api.post(`/storekeeper/returns/borrowed/${borrowedId}/reminder`, { method });
    return response.data;
  },

  bulkSendReminders: async (borrowedIds: string[]) => {
    const response = await api.post('/storekeeper/returns/borrowed/reminders', { borrowedIds });
    return response.data;
  },

  blacklistBorrower: async (borrowerId: string) => {
    const response = await api.post('/storekeeper/returns/borrowers/blacklist', { borrowerId });
    return response.data;
  },
};

// ============================================
// STOCK TAKE API
// ============================================
export const stockTakeAPI = {
  getStockTakes: async (params?: { status?: string }): Promise<StoreKeeperApiResponse<StockTake[]>> => {
    const response = await api.get('/storekeeper/stock-takes', { params });
    return response.data;
  },

  getStockTake: async (stockTakeId: string): Promise<StoreKeeperApiResponse<StockTake>> => {
    const response = await api.get(`/storekeeper/stock-takes/${stockTakeId}`);
    return response.data;
  },

  getCountSheets: async (stockTakeId: string): Promise<StoreKeeperApiResponse<any[]>> => {
    const response = await api.get(`/storekeeper/stock-takes/${stockTakeId}/count-sheets`);
    return response.data;
  },

  createStockTake: async (stockTakeData: Partial<StockTake>) => {
    const response = await api.post('/storekeeper/stock-takes', stockTakeData);
    return response.data;
  },

  recordCount: async (data: {
    stockTakeId: string;
    itemId: string;
    physicalQuantity: number;
    notes?: string;
  }) => {
    const response = await api.post(`/storekeeper/stock-takes/${data.stockTakeId}/record`, data);
    return response.data;
  },

  applyAdjustment: async (data: {
    stockTakeId: string;
    itemId: string;
    newQuantity: number;
    reason: string;
  }) => {
    const response = await api.post(`/storekeeper/stock-takes/${data.stockTakeId}/adjust`, data);
    return response.data;
  },

  completeStockTake: async (stockTakeId: string) => {
    const response = await api.post(`/storekeeper/stock-takes/${stockTakeId}/complete`);
    return response.data;
  },

  exportVarianceReport: async (stockTakeId: string) => {
    const response = await api.get(`/storekeeper/stock-takes/${stockTakeId}/variance-report`, {
      responseType: 'blob',
    });
    return response;
  },

  exportCountSheets: async (stockTakeId: string) => {
    const response = await api.get(`/storekeeper/stock-takes/${stockTakeId}/count-sheets/export`, {
      responseType: 'blob',
    });
    return response;
  },

  importCounts: async (stockTakeId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/storekeeper/stock-takes/${stockTakeId}/import-counts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateStockTakeItem: async (stockTakeId: string, itemId: string, countedQuantity: number) => {
    const response = await api.patch(`/storekeeper/stock-takes/${stockTakeId}/items/${itemId}`, { countedQuantity });
    return response.data;
  },

  approveAdjustments: async (stockTakeId: string) => {
    const response = await api.post(`/storekeeper/stock-takes/${stockTakeId}/approve-adjustments`);
    return response.data;
  },
};

// ============================================
// BORROWINGS API
// ============================================
export const borrowingsAPI = {
  getBorrowings: async (params?: {
    status?: string;
    overdue?: boolean;
    page?: number;
    limit?: number;
  }): Promise<StoreKeeperApiResponse<BorrowingRecord[]>> => {
    const response = await api.get('/storekeeper/borrowings', { params });
    return response.data;
  },

  borrowItem: async (data: {
    itemId: string;
    borrowerId: string;
    borrowerName: string;
    borrowerRole: string;
    quantity: number;
    dueDate: string;
    notes?: string;
  }) => {
    const response = await api.post('/storekeeper/borrowings', data);
    return response.data;
  },

  returnItem: async (borrowingId: string, condition?: string) => {
    const response = await api.post(`/storekeeper/borrowings/${borrowingId}/return`, { condition });
    return response.data;
  },

  markAsLost: async (borrowingId: string, reason: string) => {
    const response = await api.post(`/storekeeper/borrowings/${borrowingId}/lost`, { reason });
    return response.data;
  },

  chargeLateFee: async (borrowingId: string, amount: number) => {
    const response = await api.post(`/storekeeper/borrowings/${borrowingId}/late-fee`, { amount });
    return response.data;
  },
};

// ============================================
// ALERTS API
// ============================================
export const alertsAPI = {
  getAlerts: async (params?: {
    type?: string;
    severity?: string;
    unreadOnly?: boolean;
  }): Promise<StoreKeeperApiResponse<StockAlert[]>> => {
    const response = await api.get('/storekeeper/alerts', { params });
    return response.data;
  },

  markAlertAsRead: async (alertId: string) => {
    const response = await api.patch(`/storekeeper/alerts/${alertId}/read`);
    return response.data;
  },

  markAllAlertsAsRead: async () => {
    const response = await api.patch('/storekeeper/alerts/read-all');
    return response.data;
  },

  getAlertStats: async () => {
    const response = await api.get('/storekeeper/alerts/stats');
    return response.data;
  },
};

// ============================================
// STORAGE LOCATIONS API
// ============================================
export const storageLocationsAPI = {
  getLocations: async (): Promise<StoreKeeperApiResponse<StorageLocation[]>> => {
    const response = await api.get('/storekeeper/locations');
    return response.data;
  },

  addLocation: async (locationData: Partial<StorageLocation>) => {
    const response = await api.post('/storekeeper/locations', locationData);
    return response.data;
  },

  updateLocation: async (locationId: string, locationData: Partial<StorageLocation>) => {
    const response = await api.put(`/storekeeper/locations/${locationId}`, locationData);
    return response.data;
  },

  deleteLocation: async (locationId: string) => {
    const response = await api.delete(`/storekeeper/locations/${locationId}`);
    return response.data;
  },
};

// ============================================
// MAINTENANCE API
// ============================================
export const maintenanceAPI = {
  getMaintenanceRecords: async (params?: {
    status?: string;
    type?: string;
  }): Promise<StoreKeeperApiResponse<MaintenanceRecord[]>> => {
    const response = await api.get('/storekeeper/maintenance', { params });
    return response.data;
  },

  createMaintenanceRecord: async (recordData: Partial<MaintenanceRecord>) => {
    const response = await api.post('/storekeeper/maintenance', recordData);
    return response.data;
  },

  updateMaintenanceRecord: async (recordId: string, recordData: Partial<MaintenanceRecord>) => {
    const response = await api.put(`/storekeeper/maintenance/${recordId}`, recordData);
    return response.data;
  },

  completeMaintenance: async (recordId: string, actualCost?: number) => {
    const response = await api.post(`/storekeeper/maintenance/${recordId}/complete`, { actualCost });
    return response.data;
  },
};

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
  generateReport: async (reportType: string, filters: any): Promise<StoreKeeperApiResponse<StockReport>> => {
    const response = await api.post('/storekeeper/reports/generate', { reportType, filters });
    return response.data;
  },

  getReportTemplates: async () => {
    const response = await api.get('/storekeeper/reports/templates');
    return response.data;
  },

  exportReport: async (reportId: string, format: 'pdf' | 'excel' | 'csv', filters?: any) => {
    const response = await api.get(`/storekeeper/reports/${reportId}/export`, {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
  },

  emailReport: async (reportId: string, filters?: any) => {
    const response = await api.post(`/storekeeper/reports/${reportId}/email`, { filters });
    return response.data;
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: async (unreadOnly?: boolean): Promise<StoreKeeperApiResponse<StoreKeeperNotification[]>> => {
    const response = await api.get('/storekeeper/notifications', { params: { unreadOnly } });
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.patch(`/storekeeper/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/storekeeper/notifications/read-all');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/storekeeper/notifications/unread-count');
    return response.data;
  },
};

// ============================================
// SETTINGS API
// ============================================
export const settingsAPI = {
  updateSettings: async (settings: any) => {
    const response = await api.put('/storekeeper/settings', settings);
    return response.data;
  },
};

// ============================================
// FIXED ASSETS API
// ============================================
export const fixedAssetsAPI = {
  getFixedAssets: async () => {
    const response = await api.get('/storekeeper/fixed-assets');
    return response.data?.data || [];
  },
};

// ============================================
// DELIVERIES API
// ============================================
export const deliveriesAPI = {
  getDeliveries: async () => {
    const response = await api.get('/storekeeper/deliveries');
    return response.data?.data || [];
  },

  markDeliveryReceived: async (id: string) => {
    const response = await api.post(`/storekeeper/deliveries/${id}/receive`);
    return response.data;
  },
};

// Export all APIs as a single object
const storeKeeperService = {
  dashboard: storeKeeperDashboardAPI,
  inventory: inventoryAPI,
  categories: categoriesAPI,
  suppliers: suppliersAPI,
  requests: requestsAPI,
  purchaseOrders: purchaseOrdersAPI,
  movements: movementsAPI,
  stockTake: stockTakeAPI,
  returns: returnsAPI,
  borrowings: borrowingsAPI,
  alerts: alertsAPI,
  locations: storageLocationsAPI,
  maintenance: maintenanceAPI,
  reports: reportsAPI,
  notifications: notificationsAPI,
  fixedAssets: fixedAssetsAPI,
  deliveries: deliveriesAPI,
  settings: settingsAPI,
  // Legacy direct methods for component compatibility
  getFixedAssets: fixedAssetsAPI.getFixedAssets,
  getFixedAssetsSummary: async () => {
    const assets = await fixedAssetsAPI.getFixedAssets();
    const list = Array.isArray(assets) ? assets : assets?.data || [];
    return {
      totalAssets: list.length,
      activeAssets: list.filter((asset: any) => asset.status === 'ACTIVE' || asset.status === 'active').length,
      maintenanceDue: list.filter((asset: any) => asset.status === 'MAINTENANCE' || asset.status === 'maintenance').length,
      totalValue: list.reduce((sum: number, asset: any) => sum + Number(asset.value || asset.purchasePrice || 0), 0),
    };
  },
  getDeliveries: deliveriesAPI.getDeliveries,
  markDeliveryReceived: deliveriesAPI.markDeliveryReceived,
  startStockTake: stockTakeAPI.createStockTake,
  generateReport: reportsAPI.generateReport,
  updateSettings: settingsAPI.updateSettings,
};

export default storeKeeperService;
