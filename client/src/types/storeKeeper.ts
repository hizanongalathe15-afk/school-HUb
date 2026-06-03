// Store Keeper Role Types - Complete Inventory Management System

// ============================================
// ROLE DEFINITIONS
// ============================================
export enum StoreKeeperRole {
  STORE_KEEPER = 'STORE_KEEPER',
}

// ============================================
// INVENTORY ITEM TYPES
// ============================================
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  reorderLevel: number;
  maxLevel?: number;
  location: string;
  shelf?: string;
  supplier?: Supplier;
  supplierId?: string;
  barcode?: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  subCategories: InventoryCategory[];
  itemCount: number;
  totalValue: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  quantity: number;
  reorderLevel?: number;
  unit?: string;
  unitPrice?: number;
  supplierId?: string;
  supplier?: {
    id: string;
    name: string;
    leadTime?: number;
    rating?: number;
  };
  status?: string;
  location?: string;
  lastOrderedDate?: string;
}

export interface ReorderSuggestion {
  id: string;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reorderLevel: number;
  suggestedQuantity: number;
  supplierId?: string;
  supplierName?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// SUPPLIER TYPES
// ============================================
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit?: number;
  rating: number;
  status: 'active' | 'inactive' | 'suspended';
  items: InventoryItem[];
  totalOrders: number;
  totalSpent: number;
  leadTime?: number;
  categories?: string[];
  lastOrderDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProduct {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit?: string;
  unitPrice?: number;
  totalOrdered?: number;
  lastOrdered?: string;
  supplierId?: string;
  status?: string;
}

// ============================================
// STOCK REQUEST TYPES
// ============================================
export interface StockRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  department?: string;
  items: RequestItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  purpose: string;
  status: 'pending' | 'approved' | 'partially_fulfilled' | 'fulfilled' | 'rejected' | 'cancelled';
  requestedDate: string;
  requiredDate: string;
  approvedBy?: string;
  approvedAt?: string;
  fulfilledBy?: string;
  fulfilledAt?: string;
  notes?: string;
  rejectionReason?: string;
}

export interface RequestItem {
  itemId: string;
  itemName: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  fulfilledQuantity?: number;
  unit: string;
  unitPrice?: number;
  totalCost?: number;
  notes?: string;
}

// ============================================
// PURCHASE ORDER TYPES
// ============================================
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  total?: number;
  taxAmount?: number;
  discountAmount?: number;
  grandTotal: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partial_delivery' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  deliveryAddress: string;
  paymentTerms: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  deliveredQuantity?: number;
  receivedDate?: string;
}

export interface BorrowedItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode?: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'teacher' | 'student' | 'staff' | string;
  borrowerType?: 'teacher' | 'student' | 'staff';
  borrowedBy: string;
  borrowedById?: string;
  borrowedDate: string;
  dueDate: string;
  daysOverdue: number;
  lateFee?: number;
  quantity: number;
  receiptNumber?: string;
  returnStatus?: 'pending' | 'returned' | 'overdue';
  status?: string;
}

export interface ReturnTransaction {
  id: string;
  itemId: string;
  itemName: string;
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
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// STOCK MOVEMENT TYPES
// ============================================
export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type?: string;
  movementType: 'issue' | 'return' | 'transfer' | 'adjustment' | 'write_off';
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalValue?: number;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  issuedTo?: string;
  issuedToName?: string;
  issuedById: string;
  issuedByName: string;
  performedByName?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// STOCK TAKE TYPES
// ============================================
export interface StockTake {
  id: string;
  stockTakeNumber: string;
  name: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'full' | 'partial';
  startDate: string;
  scheduledDate: string;
  completedDate?: string;
  frozen?: boolean;
  categories?: string[];
  locations?: string[];
  items: StockTakeItem[];
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  adjustedValue: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTakeItem {
  itemId: string;
  itemName: string;
  category: string;
  location: string;
  systemQuantity: number;
  countedQuantity?: number;
  variance: number;
  variancePercentage: number;
  unitPrice: number;
  varianceValue: number;
  status: 'pending' | 'counted' | 'verified' | 'discrepancy';
  countedBy?: string;
  countedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

// ============================================
// BORROWING TYPES
// ============================================
export interface BorrowingRecord {
  id: string;
  borrowingNumber: string;
  itemId: string;
  itemName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  condition: 'new' | 'good' | 'fair' | 'damaged';
  returnCondition?: string;
  lateFee?: number;
  lateFeePaid?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ALERT TYPES
// ============================================
export interface StockAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'overstock' | 'reorder_point';
  severity: 'low' | 'medium' | 'high' | 'critical';
  itemId: string;
  itemName: string;
  currentQuantity: number;
  reorderLevel?: number;
  message: string;
  action?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================
// STORAGE LOCATION TYPES
// ============================================
export interface StorageLocation {
  id: string;
  name: string;
  code: string;
  type: 'storeroom' | 'shelf' | 'cabinet' | 'warehouse' | 'display';
  section?: string;
  responsiblePerson?: string;
  building?: string;
  floor?: string;
  room?: string;
  capacity?: number;
  currentUsage?: number;
  temperature?: number;
  humidity?: number;
  status: 'active' | 'inactive' | 'maintenance';
  items: InventoryItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MAINTENANCE RECORD TYPES
// ============================================
export interface MaintenanceRecord {
  id: string;
  itemId: string;
  itemName: string;
  type: 'repair' | 'servicing' | 'inspection' | 'replacement';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToName?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// FIXED ASSET TYPES
// ============================================
export interface FixedAsset {
  id: string;
  assetTag: string;
  name: string;
  description: string;
  category: string;
  location: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  depreciationRate: number;
  status: 'active' | 'maintenance' | 'disposed';
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DELIVERY TYPES
// ============================================
export interface Delivery {
  id: string;
  deliveryNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  expectedDate: string;
  deliveredDate?: string;
  status: 'pending' | 'partial' | 'complete' | 'received';
  items: DeliveryItem[];
  receivedBy?: string;
  receivedByName?: string;
  notes?: string;
}

export interface DeliveryItem {
  itemId: string;
  itemName: string;
  orderedQuantity: number;
  deliveredQuantity?: number;
  unit: string;
  receivedDate?: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface StoreKeeperDashboard {
  quickStats: StoreKeeperQuickStats;
  lowStockItems: InventoryItem[];
  pendingRequests: StockRequest[];
  expiringItems: InventoryItem[];
  overdueBorrowings: BorrowingRecord[];
  recentMovements: StockMovement[];
  alerts: StockAlert[];
  topMovingItems?: Array<{ itemId: string; itemName: string; movementCount: number; totalQuantity: number }>;
}

export interface StoreKeeperQuickStats {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingRequestsCount: number;
  expiringItemsCount: number;
  overdueBorrowingsCount: number;
  monthlyIssuesCount: number;
  monthlyReturnsCount: number;
}

// ============================================
// REPORT TYPES
// ============================================
export interface StockReport {
  id: string;
  name: string;
  type: 'stock_levels' | 'movements' | 'requests' | 'purchases' | 'valuation' | 'variance';
  filters: ReportFilters;
  data: any[];
  summary: ReportSummary;
  generatedAt: string;
  generatedBy: string;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  categories?: string[];
  locations?: string[];
  suppliers?: string[];
  status?: string[];
}

export interface ReportSummary {
  totalItems: number;
  totalValue: number;
  totalQuantity: number;
  averageValue: number;
  // Additional summary fields based on report type
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface StoreKeeperNotification {
  id: string;
  type: 'request' | 'alert' | 'reminder' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface StoreKeeperApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}