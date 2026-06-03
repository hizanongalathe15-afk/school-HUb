// client/src/components/roles/admin/AdminInventoryPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, AlertTriangle, CheckCircle, Clock,
  Eye, TrendingUp, TrendingDown, BarChart3, PieChart,
  Package, Truck, Store, Users, Calendar, DollarSign,
  Filter, Grid, List, Printer, Share2, Copy, Archive,
  Bell, BellOff, Settings, Zap, Shield, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryService, notificationService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitCost: number;
  sellingPrice?: number;
  supplier: string;
  supplierContact: string;
  location: string;
  barcode: string;
  sku: string;
  expiryDate?: Date;
  receivedDate: Date;
  lastUpdated: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  notes: string;
  images: string[];
}

interface StockRequest {
  id: string;
  itemId: string;
  itemName: string;
  requestedBy: string;
  requestedByRole: string;
  quantity: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  notes: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  leadTime: number;
  rating: number;
}

export default function AdminInventoryPage() {
  const confirmation = useConfirmationDialog();
  
  // State Management
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stats'>('list');
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  
  // Form state
  const [form, setForm] = useState<Partial<InventoryItem>>({
    name: '', category: '', subCategory: '', quantity: 0, minStockLevel: 10,
    maxStockLevel: 100, unitCost: 0, sellingPrice: 0, supplier: '',
    supplierContact: '', location: '', barcode: '', sku: '', notes: ''
  });

  const [requestForm, setRequestForm] = useState<Partial<StockRequest>>({
    itemId: '', quantity: 1, purpose: '', requestedBy: 'admin'
  });

  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    name: '', contact: '', email: '', phone: '', address: '', categories: [], leadTime: 3, rating: 3
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, requestsData, suppliersData] = await Promise.all([
        inventoryService.getItems({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          supplier: supplierFilter !== 'all' ? supplierFilter : undefined,
          search: searchTerm || undefined
        }),
        inventoryService.getStockRequests(),
        inventoryService.getSuppliers()
      ]);
      setItems(itemsData);
      setRequests(requestsData);
      setSuppliers(suppliersData);
      
      // Calculate stats
      const lowStock = itemsData.filter(item => item.quantity <= item.minStockLevel && item.quantity > 0);
      setLowStockItems(lowStock);
      const total = itemsData.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
      setTotalValue(total);
      
      if (lowStock.length > 0) {
        toast.error(`${lowStock.length} item(s) running low on stock!`);
      }
    } catch (error) {
      toast.error('Failed to load inventory data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [categoryFilter, statusFilter, supplierFilter, searchTerm]);

  const saveItem = async () => {
    if (!form.name || !form.category || form.quantity === undefined) {
      toast.error('Name, category, and quantity are required');
      return;
    }
    
    try {
      if (editing) {
        await inventoryService.updateItem(editing.id, form);
        toast.success('Item updated successfully');
      } else {
        const newItem = await inventoryService.createItem(form);
        toast.success('Item added to inventory');
        
        // Send notification for low stock threshold
        if (form.quantity <= (form.minStockLevel || 10)) {
          await sendLowStockAlert(newItem);
        }
      }
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save item');
    }
  };

  const sendLowStockAlert = async (item: InventoryItem) => {
    try {
      await notificationService.sendLowStockAlert({
        itemName: item.name,
        currentStock: item.quantity,
        minLevel: item.minStockLevel,
        location: item.location
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  };

  const deleteItem = async (id: string) => {
    const confirmOptions = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this inventory item?',
      confirmText: 'Delete',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await inventoryService.deleteItem(id);
        toast.success('Item deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const createStockRequest = async () => {
    if (!requestForm.itemId || !requestForm.quantity) {
      toast.error('Please select an item and enter quantity');
      return;
    }
    
    try {
      await inventoryService.createStockRequest(requestForm);
      toast.success('Stock request submitted');
      fetchData();
      setShowRequestModal(false);
      setRequestForm({ itemId: '', quantity: 1, purpose: '', requestedBy: 'admin' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create request');
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      await inventoryService.approveStockRequest(requestId);
      toast.success('Request approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const fulfillRequest = async (requestId: string) => {
    try {
      await inventoryService.fulfillStockRequest(requestId);
      toast.success('Stock issued');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Insufficient stock');
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await inventoryService.rejectStockRequest(requestId);
      toast.success('Request rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const saveSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast.error('Name and phone are required');
      return;
    }
    
    try {
      await inventoryService.createSupplier(supplierForm);
      toast.success('Supplier added');
      fetchData();
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contact: '', email: '', phone: '', address: '', categories: [], leadTime: 3, rating: 3 });
    } catch (error) {
      toast.error('Failed to add supplier');
    }
  };

  const bulkDelete = async () => {
    const confirmOptions = {
      title: 'Bulk Delete',
      message: `Delete ${selected.length} items?`,
      confirmText: 'Delete All',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await Promise.all(selected.map(id => inventoryService.deleteItem(id)));
        toast.success(`${selected.length} items deleted`);
        setSelected([]);
        fetchData();
      } catch (error) {
        toast.error('Bulk delete failed');
      }
    }
  };

  const exportData = async () => {
    try {
      const blob = await inventoryService.exportInventory({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportFiles(e.dataTransfer.files);
    setShowImport(true);
  };

  const doImport = async () => {
    if (!importFiles) return;
    try {
      for (const file of Array.from(importFiles)) {
        await inventoryService.importInventory(file);
      }
      toast.success('Import completed');
      setShowImport(false);
      fetchData();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(i => i.id));
    }
  };

  const resetForm = () => {
    setForm({
      name: '', category: '', subCategory: '', quantity: 0, minStockLevel: 10,
      maxStockLevel: 100, unitCost: 0, sellingPrice: 0, supplier: '',
      supplierContact: '', location: '', barcode: '', sku: '', notes: ''
    });
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.quantity === 0) return <span className="status-badge out"><X size={12} /> Out of Stock</span>;
    if (item.quantity <= item.minStockLevel) return <span className="status-badge low"><AlertTriangle size={12} /> Low Stock</span>;
    if (item.expiryDate && new Date(item.expiryDate) < new Date()) return <span className="status-badge expired"><Clock size={12} /> Expired</span>;
    return <span className="status-badge good"><CheckCircle size={12} /> In Stock</span>;
  };

  const filtered = items.filter(i => 
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueCategories = [...new Set(items.map(i => i.category).filter(c => c))];
  const uniqueSuppliers = [...new Set(items.map(i => i.supplier).filter(s => s))];

  return (
    <div className="inventory-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><Package size={24} /> Inventory Management System</h2>
          <p>Track stock levels, manage suppliers, and handle stock requests in real-time</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /> List</button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={16} /> Grid</button>
            <button className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`} onClick={() => setViewMode('stats')}><BarChart3 size={16} /> Stats</button>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowRequestModal(true)}><Bell size={16} /> Stock Request</button>
          <button className="btn btn-secondary" onClick={() => setShowSupplierModal(true)}><Truck size={16} /> Add Supplier</button>
          <button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export</button>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}><RefreshCcw size={16} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Item</button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-row">
        <div className="stat-card"><Package size={20} /><div><span>{items.length}</span><label>Total Items</label></div></div>
        <div className="stat-card"><DollarSign size={20} /><div><span>KES {totalValue.toLocaleString()}</span><label>Inventory Value</label></div></div>
        <div className="stat-card warning"><AlertTriangle size={20} /><div><span>{lowStockItems.length}</span><label>Low Stock Items</label></div></div>
        <div className="stat-card"><Truck size={20} /><div><span>{suppliers.length}</span><label>Suppliers</label></div></div>
        <div className="stat-card"><Clock size={20} /><div><span>{requests.filter(r => r.status === 'pending').length}</span><label>Pending Requests</label></div></div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner" onClick={() => setShowStockAlertModal(true)}>
          <AlertTriangle size={20} />
          <span><strong>Low Stock Alert:</strong> {lowStockItems.length} item(s) need restocking</span>
          <button>View Details →</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search by name, SKU, category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">All Categories ({uniqueCategories.length})</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="in_stock">In Stock</option><option value="low_stock">Low Stock</option><option value="out_of_stock">Out of Stock</option></select>
        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}><option value="all">All Suppliers</option>{uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}</select>
        {selected.length > 0 && (<div className="bulk-actions"><button className="btn btn-danger" onClick={bulkDelete}><Trash2 size={16} /> Delete ({selected.length})</button><button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export Selected</button></div>)}
      </div>

      {/* Drag & Drop Import */}
      <div className="drag-zone" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={24} /> Drag & drop Excel/CSV files here for bulk import
      </div>

      {/* Content Views */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading inventory...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th><button onClick={toggleAll}>{selected.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th><th>Item</th><th>SKU</th><th>Category</th><th>Quantity</th><th>Min Level</th><th>Unit Cost</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className={item.quantity <= item.minStockLevel ? 'low-stock-row' : ''}>
                  <td><button onClick={() => toggleSelect(item.id)}>{selected.includes(item.id) ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}</button></td>
                  <td><div><strong>{item.name}</strong><div className="sub-text">{item.location}</div></div></td>
                  <td>{item.sku || '-'}</td>
                  <td><span className="category-badge">{item.category}</span></td>
                  <td className={item.quantity <= item.minStockLevel ? 'quantity-low' : 'quantity-normal'}>{item.quantity}</td>
                  <td>{item.minStockLevel}</td>
                  <td>KES {item.unitCost.toLocaleString()}</td>
                  <td>{getStatusBadge(item)}</td>
                  <td><div className="action-buttons"><button onClick={() => { setEditing(item); setForm(item); setShowModal(true); }}><Edit size={14} /></button><button onClick={() => deleteItem(item.id)} className="danger"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-view">
          {filtered.map(item => (
            <div key={item.id} className={`inventory-card ${item.quantity <= item.minStockLevel ? 'low-stock' : ''}`}>
              <div className="card-header"><h4>{item.name}</h4><div className="card-actions"><button onClick={() => { setEditing(item); setForm(item); setShowModal(true); }}><Edit size={14} /></button><button className="danger" onClick={() => deleteItem(item.id)}><Trash2 size={14} /></button></div></div>
              <div className="card-details"><div className="detail"><strong>SKU:</strong> {item.sku || '-'}</div><div className="detail"><strong>Category:</strong> {item.category}</div><div className="detail"><strong>Location:</strong> {item.location || '-'}</div><div className="detail"><strong>Supplier:</strong> {item.supplier || '-'}</div></div>
              <div className="card-stats"><div className="stat"><label>Quantity</label><span className={item.quantity <= item.minStockLevel ? 'text-red' : ''}>{item.quantity}</span></div><div className="stat"><label>Min Level</label><span>{item.minStockLevel}</span></div><div className="stat"><label>Cost</label><span>KES {item.unitCost}</span></div></div>
              <div className="card-status">{getStatusBadge(item)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-view">
          <div className="stats-header"><h3>Inventory Analytics</h3></div>
          <div className="analytics-grid">
            <div className="analytics-card"><h4>Stock by Category</h4>{Object.entries(items.reduce((acc, item) => { acc[item.category] = (acc[item.category] || 0) + item.quantity; return acc; }, {} as Record<string, number>)).map(([cat, qty]) => <div key={cat} className="analytics-row"><span>{cat}</span><span>{qty} units</span><div className="bar"><div className="bar-fill" style={{ width: `${(qty / items.reduce((sum, i) => sum + i.quantity, 0)) * 100}%` }} /></div></div>)}</div>
            <div className="analytics-card"><h4>Stock Status Distribution</h4><div className="status-stats"><div className="status-stat good"><span>In Stock</span><span>{items.filter(i => i.quantity > i.minStockLevel).length}</span></div><div className="status-stat low"><span>Low Stock</span><span>{lowStockItems.length}</span></div><div className="status-stat out"><span>Out of Stock</span><span>{items.filter(i => i.quantity === 0).length}</span></div></div></div>
            <div className="analytics-card"><h4>Pending Stock Requests</h4>{requests.filter(r => r.status === 'pending').map(req => <div key={req.id} className="request-item"><strong>{req.itemName}</strong><span>Qty: {req.quantity}</span><span>By: {req.requestedBy}</span><button onClick={() => approveRequest(req.id)}>Approve</button><button onClick={() => rejectRequest(req.id)}>Reject</button></div>)}</div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Inventory Item' : 'Add New Item'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Item Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Item name" /></div>
                <div className="form-group"><label>SKU/Barcode</label><input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="Unique SKU" /></div>
                <div className="form-group"><label>Category *</label><input value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g., Stationery, Equipment" /></div>
                <div className="form-group"><label>Sub Category</label><input value={form.subCategory} onChange={e => setForm({...form, subCategory: e.target.value})} /></div>
                <div className="form-group"><label>Quantity *</label><input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Min Stock Level</label><input type="number" value={form.minStockLevel} onChange={e => setForm({...form, minStockLevel: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Max Stock Level</label><input type="number" value={form.maxStockLevel} onChange={e => setForm({...form, maxStockLevel: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Unit Cost (KES)</label><input type="number" value={form.unitCost} onChange={e => setForm({...form, unitCost: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Selling Price (KES)</label><input type="number" value={form.sellingPrice} onChange={e => setForm({...form, sellingPrice: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="Supplier name" /></div>
                <div className="form-group"><label>Supplier Contact</label><input value={form.supplierContact} onChange={e => setForm({...form, supplierContact: e.target.value})} placeholder="Phone/Email" /></div>
                <div className="form-group"><label>Storage Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Shelf/Room/Warehouse" /></div>
                <div className="form-group full"><label>Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveItem}>Save Item</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Request Stock Item</h3><button className="modal-close" onClick={() => setShowRequestModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label>Select Item *</label><select value={requestForm.itemId} onChange={e => setRequestForm({...requestForm, itemId: e.target.value, itemName: items.find(i => i.id === e.target.value)?.name})}><option value="">Choose Item</option>{items.map(item => <option key={item.id} value={item.id}>{item.name} (Available: {item.quantity})</option>)}</select></div>
              <div className="form-group"><label>Quantity *</label><input type="number" value={requestForm.quantity} onChange={e => setRequestForm({...requestForm, quantity: parseInt(e.target.value)})} min="1" /></div>
              <div className="form-group"><label>Purpose</label><textarea rows={3} value={requestForm.purpose} onChange={e => setRequestForm({...requestForm, purpose: e.target.value})} placeholder="Why do you need this item?" /></div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createStockRequest}>Submit Request</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="modal-overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Supplier</h3><button className="modal-close" onClick={() => setShowSupplierModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-grid"><div className="form-group"><label>Supplier Name *</label><input value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} /></div><div className="form-group"><label>Contact Person</label><input value={supplierForm.contact} onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})} /></div><div className="form-group"><label>Phone *</label><input value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} /></div><div className="form-group"><label>Email</label><input type="email" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} /></div><div className="form-group full"><label>Address</label><textarea rows={2} value={supplierForm.address} onChange={e => setSupplierForm({...supplierForm, address: e.target.value})} /></div></div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowSupplierModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveSupplier}>Add Supplier</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Alert Modal */}
      {showStockAlertModal && (
        <div className="modal-overlay" onClick={() => setShowStockAlertModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3><AlertTriangle size={20} /> Low Stock Items</h3><button className="modal-close" onClick={() => setShowStockAlertModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="alert-items-list">{lowStockItems.map(item => (<div key={item.id} className="alert-item"><div><strong>{item.name}</strong><div>Current: {item.quantity} | Min: {item.minStockLevel} | Location: {item.location}</div></div><button onClick={() => { setEditing(item); setForm(item); setShowModal(true); setShowStockAlertModal(false); }}>Restock</button></div>))}</div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Inventory</h3><button className="modal-close" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body"><input type="file" multiple onChange={e => setImportFiles(e.target.files)} accept=".xlsx,.csv" /><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn btn-primary" onClick={doImport}>Import</button></div></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmation.isOpen} title={confirmation.options?.title || ''} message={confirmation.options?.message || ''} confirmLabel={confirmation.options?.confirmText} cancelLabel={confirmation.options?.cancelText} type={confirmation.options?.type} onConfirm={confirmation.handleConfirm} onCancel={confirmation.handleCancel} />

      <style>{`
        .inventory-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card span { font-size: 24px; font-weight: 700; display: block; }
        .stat-card label { font-size: 12px; color: #6b7280; }
        .stat-card.warning { border-left: 4px solid #f59e0b; }
        .alert-banner { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; cursor: pointer; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .drag-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; background: white; cursor: pointer; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr.low-stock-row { background: #fffbeb; }
        .sub-text { font-size: 11px; color: #6b7280; }
        .category-badge { background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
        .quantity-low { color: #f59e0b; font-weight: 600; }
        .quantity-normal { color: #10b981; font-weight: 600; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.good { background: #d1fae5; color: #10b981; }
        .status-badge.low { background: #fed7aa; color: #f59e0b; }
        .status-badge.out { background: #fee2e2; color: #ef4444; }
        .status-badge.expired { background: #f1f5f9; color: #64748b; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .inventory-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .inventory-card.low-stock { border-left: 4px solid #f59e0b; }
        .inventory-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .card-header h4 { margin: 0; font-size: 16px; }
        .card-details { margin-bottom: 12px; }
        .detail { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .card-stats { display: flex; gap: 16px; margin-bottom: 12px; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
        .stat { flex: 1; text-align: center; }
        .stat label { display: block; font-size: 10px; color: #6b7280; }
        .stat span { font-size: 14px; font-weight: 600; }
        .text-red { color: #ef4444; }
        .stats-view { background: white; border-radius: 12px; padding: 20px; }
        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .analytics-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .analytics-card h4 { margin: 0 0 12px; font-size: 14px; }
        .analytics-row { margin-bottom: 8px; }
        .analytics-row span { font-size: 12px; display: inline-block; width: 100px; }
        .bar { flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; display: inline-block; width: calc(100% - 120px); }
        .bar-fill { height: 100%; background: #1d8a8a; border-radius: 3px; }
        .status-stats { display: flex; flex-direction: column; gap: 8px; }
        .status-stat { display: flex; justify-content: space-between; padding: 8px; border-radius: 8px; }
        .status-stat.good { background: #d1fae5; color: #10b981; }
        .status-stat.low { background: #fed7aa; color: #f59e0b; }
        .status-stat.out { background: #fee2e2; color: #ef4444; }
        .request-item { padding: 8px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .request-item button { padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; }
        .alert-items-list { max-height: 400px; overflow-y: auto; }
        .alert-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .alert-item button { padding: 4px 12px; background: #1d8a8a; color: white; border: none; border-radius: 6px; cursor: pointer; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 800px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } }
      `}</style>
    </div>
  );
}