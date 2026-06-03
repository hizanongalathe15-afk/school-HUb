export interface InventoryItem {
  id: string;
  name: string;
  code?: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  price: number;
  supplier?: string;
  location?: string;
}

export interface StockRequest {
  id: string;
  itemId: string;
  requestedBy: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  items: string[];
}