import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Package,
  AlertTriangle,
  Save,
  X,
  Upload,
  Filter,
  Download,
  Printer,
  Eye,
  Copy,
  Archive,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Barcode,
  QrCode,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Building2,
  MapPin,
  Tag,
  Hash,
  FileText,
  Image,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Layers,
  Grid,
  List,
  Maximize2,
  Minimize2,
  RotateCcw,
  Star,
  Award,
  Crown,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { InventoryItem } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface FormState {
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  sellingPrice: number;
  supplier: string;
  supplierId: string;
  location: string;
  shelf: string;
  reorderLevel: number;
  maxStockLevel: number;
  expiryDate: string;
  batchNumber: string;
  serialNumber: string;
  description: string;
  imageUrl: string;
  photo: File | null;
  manufacturer: string;
  warrantyMonths: number;
  isTaxable: boolean;
  taxRate: number;
}

const emptyForm: FormState = {
  name: '',
  code: '',
  category: '',
  quantity: 0,
  unit: 'pcs',
  unitPrice: 0,
  sellingPrice: 0,
  supplier: '',
  supplierId: '',
  location: '',
  shelf: '',
  reorderLevel: 10,
  maxStockLevel: 100,
  expiryDate: '',
  batchNumber: '',
  serialNumber: '',
  description: '',
  imageUrl: '',
  photo: null,
  manufacturer: '',
  warrantyMonths: 0,
  isTaxable: true,
  taxRate: 16,
};

const categories = [
  'Stationery', 'Textbooks', 'Uniforms', 'Sports Equipment',
  'Laboratory Equipment', 'Computer Lab', 'Library Books',
  'Furniture', 'Cleaning Supplies', 'Kitchen/Dining',
  'Medical Supplies', 'Maintenance Tools', 'Electronics', 'Vehicles/Spares',
];

const units = ['pcs', 'kg', 'litres', 'boxes', 'reams', 'sets', 'pairs', 'dozen', 'cartons', 'rolls'];

export default function StoreKeeperInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'update' | 'export'>('delete');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await storeKeeperService.inventory.getInventory();
      setItems(response.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      let matchesStatus = true;
      if (statusFilter === 'low') matchesStatus = item.quantity <= (item.reorderLevel || 0);
      else if (statusFilter === 'out') matchesStatus = item.quantity === 0;
      else if (statusFilter === 'normal') matchesStatus = item.quantity > (item.reorderLevel || 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, categoryFilter, statusFilter]);

  const statistics = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);
    const lowStockCount = items.filter(i => i.quantity <= (i.reorderLevel || 0)).length;
    const outOfStockCount = items.filter(i => i.quantity === 0).length;
    return { totalItems, totalQuantity, totalValue, lowStockCount, outOfStockCount };
  }, [items]);

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditing(item);
      setForm({
        name: item.name,
        code: item.code || '',
        category: item.category || '',
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        supplier: item.supplier?.name || item.supplier || '',
        supplierId: item.supplierId || '',
        location: item.location || '',
        shelf: item.shelf || '',
        reorderLevel: item.reorderLevel || 10,
        maxStockLevel: item.maxStockLevel || 100,
        expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
        batchNumber: item.batchNumber || '',
        serialNumber: item.serialNumber || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        photo: null,
        manufacturer: item.manufacturer || '',
        warrantyMonths: item.warrantyMonths || 0,
        isTaxable: item.isTaxable !== false,
        taxRate: item.taxRate || 16,
      });
    } else {
      setEditing(null);
      setForm({ ...emptyForm, code: `ITM-${Date.now()}` });
    }
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (form.quantity < 0) {
      toast.error('Quantity cannot be negative');
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (form.photo) {
        const uploadRes = await storeKeeperService.inventory.uploadImage(form.photo);
        imageUrl = uploadRes.data.url;
      }

      const payload: any = {
        name: form.name,
        code: form.code,
        category: form.category,
        quantity: form.quantity,
        unit: form.unit,
        unitPrice: form.unitPrice,
        sellingPrice: form.sellingPrice,
        supplier: form.supplier,
        supplierId: form.supplierId,
        location: form.location,
        shelf: form.shelf,
        reorderLevel: form.reorderLevel,
        maxStockLevel: form.maxStockLevel,
        expiryDate: form.expiryDate || undefined,
        batchNumber: form.batchNumber,
        serialNumber: form.serialNumber,
        description: form.description,
        imageUrl,
        manufacturer: form.manufacturer,
        warrantyMonths: form.warrantyMonths,
        isTaxable: form.isTaxable,
        taxRate: form.taxRate,
      };

      if (editing) {
        await storeKeeperService.inventory.updateItem(editing.id, payload);
        toast.success('Item updated successfully');
      } else {
        await storeKeeperService.inventory.addItem(payload);
        toast.success('Item added successfully');
      }
      fetchData();
      setShowModal(false);
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setForm(f => ({ ...f, photo: file }));
      const reader = new FileReader();
      reader.onload = () => setForm(f => ({ ...f, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setForm(f => ({ ...f, photo: file }));
      const reader = new FileReader();
      reader.onload = () => setForm(f => ({ ...f, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
    try {
      await storeKeeperService.inventory.deleteItem(id);
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete item');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Name', 'Code', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Total Value', 'Location', 'Status'],
      ...filteredItems.map(item => [
        item.name,
        item.code || '',
        item.category || '',
        item.quantity,
        item.unit || 'pcs',
        item.unitPrice || 0,
        (item.quantity * (item.unitPrice || 0)),
        item.location || '',
        item.quantity <= (item.reorderLevel || 0) ? 'Low Stock' : 'OK'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> };
    }
    if (item.quantity <= (item.reorderLevel || 0)) {
      return { label: 'Low Stock', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertTriangle className="w-3 h-3" /> };
    }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading inventory..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage stock items, track quantities, and monitor inventory levels
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalItems}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalQuantity}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{statistics.totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Value (KES)</p>
        </Card>
        <Card className="text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-600">{statistics.lowStockCount}</p>
          <p className="text-xs text-gray-500">Low Stock</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.outOfStockCount}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="normal">Normal</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('all');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No items found</p>
          <Button className="mt-4" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Your First Item
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Total Value</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                          </div>
                         </td>
                        <td className="px-4 py-3 font-mono text-sm">{item.code || '-'}</td>
                        <td className="px-4 py-3">{item.category || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={clsx(
                            'font-medium',
                            item.quantity === 0 ? 'text-red-600' : item.quantity <= (item.reorderLevel || 0) ? 'text-orange-600' : 'text-gray-900'
                          )}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                         </td>
                        <td className="px-4 py-3 text-right">{item.unitPrice?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right font-medium">{(item.quantity * (item.unitPrice || 0)).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                         </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => openModal(item)}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                         </td>
                       </tr>
                      {expandedItemId === item.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{item.location || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Shelf/Rack</p>
                                <p className="font-medium">{item.shelf || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Reorder Level</p>
                                <p className="font-medium">{item.reorderLevel || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Supplier</p>
                                <p className="font-medium">{item.supplier?.name || item.supplier || 'Not specified'}</p>
                              </div>
                              {item.batchNumber && (
                                <div>
                                  <p className="text-gray-500">Batch Number</p>
                                  <p className="font-mono text-sm">{item.batchNumber}</p>
                                </div>
                              )}
                              {item.serialNumber && (
                                <div>
                                  <p className="text-gray-500">Serial Number</p>
                                  <p className="font-mono text-sm">{item.serialNumber}</p>
                                </div>
                              )}
                              {item.expiryDate && (
                                <div>
                                  <p className="text-gray-500">Expiry Date</p>
                                  <p className={clsx(new Date(item.expiryDate) < new Date() ? 'text-red-600' : '')}>
                                    {new Date(item.expiryDate).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                            {item.description && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500">Description</p>
                                <p className="text-sm">{item.description}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
             </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const status = getStockStatus(item);
            return (
              <Card key={item.id} className="hover:shadow-lg transition">
                <div className="flex items-start gap-3 mb-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.code || 'No code'}</p>
                  </div>
                  <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', status.color)}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span>{item.category || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantity:</span>
                    <span className={clsx('font-medium', item.quantity === 0 && 'text-red-600')}>
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unit Price:</span>
                    <span>{item.unitPrice?.toLocaleString() || 0} KES</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span>{item.location || '-'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" fullWidth onClick={() => openModal(item)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" fullWidth className="text-red-600" onClick={() => deleteItem(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Inventory Item' : 'Add Inventory Item'} size="xl">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Code</label>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
                placeholder="Auto-generated"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {units.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity & Pricing */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price (KES)</label>
              <input
                type="number"
                value={form.unitPrice}
                onChange={e => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (KES)</label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reorder Level</label>
              <input
                type="number"
                value={form.reorderLevel}
                onChange={e => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Main Store, Room 101"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shelf / Rack</label>
              <input
                value={form.shelf}
                onChange={e => setForm({ ...form, shelf: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Shelf A1, Rack 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
              <input
                value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Supplier name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
              <input
                value={form.manufacturer}
                onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Batch & Serial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
              <input
                value={form.batchNumber}
                onChange={e => setForm({ ...form, batchNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Serial Number</label>
              <input
                value={form.serialNumber}
                onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Additional notes about this item..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Photo</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors',
                dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 bg-gray-50 dark:bg-gray-800'
              )}
            >
              {form.imageUrl ? (
                <div className="flex items-center justify-center gap-4">
                  <img src={form.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, photo: null, imageUrl: '' })); }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Upload size={32} />
                  <span>Drop item photo here or click to upload</span>
                  <span className="text-xs">JPG, PNG, GIF (max 5MB)</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
          <Button fullWidth onClick={save} isLoading={saving}>
            <Save className="w-4 h-4 mr-1" />
            {editing ? 'Update Item' : 'Save Item'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}