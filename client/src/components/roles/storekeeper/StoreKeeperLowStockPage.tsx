import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  Building2,
  Truck,
  Send,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  Printer,
  Mail,
  Phone,
  MessageCircle,
  Users,
  Star,
  Award,
  Flame,
  Zap,
  Shield,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Target,
  Flag,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { InventoryItem, LowStockItem, PurchaseOrder, ReorderSuggestion } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface ReorderForm {
  supplierId: string;
  supplierName: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expectedDeliveryDate: string;
  paymentTerms: string;
  notes: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalCost: number;
  }>;
}

interface Supplier {
  id: string;
  name: string;
  leadTime?: number;
  rating?: number;
}

const StoreKeeperLowStockPage: React.FC = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'quantity' | 'percentage' | 'name'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showBatchReorderModal, setShowBatchReorderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reorderForm, setReorderForm] = useState<ReorderForm>({
    supplierId: '',
    supplierName: '',
    priority: 'normal',
    expectedDeliveryDate: '',
    paymentTerms: '30 days',
    notes: '',
    items: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [lowStockRes, suppliersRes] = await Promise.all([
        storeKeeperService.inventory.getLowStockItems(),
        storeKeeperService.suppliers.getSuppliers()
      ]);
      setItems(lowStockRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load low stock items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      let matchesSeverity = true;
      if (severityFilter === 'critical') matchesSeverity = item.quantity === 0;
      else if (severityFilter === 'warning') matchesSeverity = item.quantity > 0 && item.quantity <= (item.reorderLevel || 0);
      return matchesSearch && matchesCategory && matchesSeverity;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
      else if (sortBy === 'percentage') {
        const aPercent = a.reorderLevel ? (a.quantity / a.reorderLevel) * 100 : 100;
        const bPercent = b.reorderLevel ? (b.quantity / b.reorderLevel) * 100 : 100;
        comparison = aPercent - bPercent;
      } else comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, searchTerm, categoryFilter, severityFilter, sortBy, sortOrder]);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map(i => i.category).filter(Boolean)));
  }, [items]);

  const statistics = useMemo(() => {
    const total = items.length;
    const critical = items.filter(i => i.quantity === 0).length;
    const warning = items.filter(i => i.quantity > 0 && i.quantity <= (i.reorderLevel || 0)).length;
    const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);
    const estimatedReorderCost = items.reduce((sum, i) => sum + (((i.reorderLevel || 0) - i.quantity) * (i.unitPrice || 0)), 0);
    return { total, critical, warning, totalValue, estimatedReorderCost };
  }, [items]);

  const openReorderModal = (item: LowStockItem) => {
    const suggestedQty = Math.max((item.reorderLevel || 0) - item.quantity, 1);
    setSelectedItem(item);
    setReorderForm({
      supplierId: item.supplierId || '',
      supplierName: item.supplier?.name || '',
      priority: item.quantity === 0 ? 'urgent' : 'normal',
      expectedDeliveryDate: new Date(Date.now() + (item.supplier?.leadTime || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: '30 days',
      notes: `Auto-generated reorder for ${item.name} - Low stock alert`,
      items: [{
        itemId: item.id,
        itemName: item.name,
        quantity: suggestedQty,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        totalCost: suggestedQty * (item.unitPrice || 0)
      }]
    });
    setShowReorderModal(true);
  };

  const openBatchReorderModal = () => {
    const selectedItemsData = items.filter(i => selectedItems.includes(i.id));
    setReorderForm({
      supplierId: '',
      supplierName: '',
      priority: 'normal',
      expectedDeliveryDate: '',
      paymentTerms: '30 days',
      notes: 'Batch reorder for multiple low stock items',
      items: selectedItemsData.map(item => {
        const quantity = Math.max((item.reorderLevel || 0) - item.quantity, 1);
        return {
          itemId: item.id,
          itemName: item.name,
          quantity,
          unit: item.unit || 'pcs',
          unitPrice: item.unitPrice || 0,
          totalCost: quantity * (item.unitPrice || 0)
        };
      })
    });
    setShowBatchReorderModal(true);
  };

  const submitReorder = async () => {
    if (!reorderForm.supplierId && !reorderForm.supplierName) {
      toast.error('Please select a supplier');
      return;
    }
    if (reorderForm.items.some(i => i.quantity <= 0)) {
      toast.error('Please enter valid quantities');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<PurchaseOrder> = {
        ...reorderForm,
        status: 'pending_approval',
        createdAt: new Date().toISOString()
      };
      await storeKeeperService.purchaseOrders.createPurchaseOrder(payload);
      toast.success('Purchase order created successfully');
      setShowReorderModal(false);
      setShowBatchReorderModal(false);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      toast.error('Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const exportReport = () => {
    const csv = [
      ['Item', 'Code', 'Category', 'Current Quantity', 'Unit', 'Reorder Level', 'Status', 'Supplier', 'Estimated Cost'],
      ...filteredItems.map(item => [
        item.name,
        item.code || '',
        item.category || '',
        item.quantity,
        item.unit || 'pcs',
        item.reorderLevel || 0,
        item.quantity === 0 ? 'Out of Stock' : 'Low Stock',
        item.supplier?.name || '',
        ((item.reorderLevel || 0) - item.quantity) * (item.unitPrice || 0)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low_stock_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getSeverityBadge = (item: LowStockItem) => {
    if (item.quantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> };
    }
    if (item.quantity <= (item.reorderLevel || 0)) {
      const percentage = (item.quantity / (item.reorderLevel || 1)) * 100;
      if (percentage <= 25) {
        return { label: 'Critical', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <Flame className="w-3 h-3" /> };
      }
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertTriangle className="w-3 h-3" /> };
    }
    return { label: 'Normal', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading low stock items..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Low Stock Items
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor and reorder items that are running low
          </p>
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <Button onClick={openBatchReorderModal} variant="primary" size="sm">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Batch Reorder ({selectedItems.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="w-4 h-4 mr-1" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">Total Low Stock Items</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.critical}</p>
          <p className="text-xs text-gray-500">Out of Stock</p>
        </Card>
        <Card className="text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-600">{statistics.warning}</p>
          <p className="text-xs text-gray-500">Below Reorder Level</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{statistics.totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Current Stock Value</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{statistics.estimatedReorderCost.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Estimated Reorder Cost</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
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
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Severities</option>
            <option value="critical">Out of Stock</option>
            <option value="warning">Low Stock</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="quantity">Sort by Quantity</option>
            <option value="percentage">Sort by Stock Percentage</option>
            <option value="name">Sort by Name</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setSeverityFilter('all');
              setSortBy('quantity');
              setSortOrder('asc');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No low stock items found</p>
          <p className="text-sm text-gray-400 mt-1">All inventory levels are normal</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedItems(filteredItems.map(i => i.id));
                        else setSelectedItems([]);
                      }}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Reorder Level</th>
                  <th className="px-4 py-3 font-semibold text-right">Stock %</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => {
                  const severity = getSeverityBadge(item);
                  const stockPercentage = item.reorderLevel ? Math.min(100, (item.quantity / item.reorderLevel) * 100) : 100;
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItems([...selectedItems, item.id]);
                              else setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            {item.code && <p className="text-xs text-gray-400 font-mono">{item.code}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">{item.category || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={clsx('font-bold', item.quantity === 0 ? 'text-red-600' : 'text-orange-600')}>
                            {item.quantity}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{item.reorderLevel || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className={clsx(
                                  'rounded-full h-1.5',
                                  stockPercentage <= 25 ? 'bg-red-600' : stockPercentage <= 50 ? 'bg-orange-600' : 'bg-yellow-600'
                                )}
                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs">{stockPercentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', severity.color)}>
                            {severity.icon}
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.supplier?.name || '-'}</td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" onClick={() => openReorderModal(item)}>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Reorder
                          </Button>
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Location</p>
                                <p className="font-medium">{item.location || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Unit Price</p>
                                <p className="font-medium">{item.unitPrice?.toLocaleString() || 0} KES</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Total Value</p>
                                <p className="font-medium">{((item.quantity * (item.unitPrice || 0))).toLocaleString()} KES</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Suggested Order</p>
                                <p className="font-medium">{Math.max((item.reorderLevel || 0) - item.quantity, 0)} {item.unit}</p>
                              </div>
                              {item.lastOrderedDate && (
                                <div>
                                  <p className="text-gray-500">Last Ordered</p>
                                  <p className="font-medium">{new Date(item.lastOrderedDate).toLocaleDateString()}</p>
                                </div>
                              )}
                              {item.supplier?.leadTime && (
                                <div>
                                  <p className="text-gray-500">Supplier Lead Time</p>
                                  <p className="font-medium">{item.supplier.leadTime} days</p>
                                </div>
                              )}
                            </div>
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
      )}

      {/* Single Item Reorder Modal */}
      <Modal isOpen={showReorderModal} onClose={() => setShowReorderModal(false)} title="Create Purchase Order" size="lg">
        {selectedItem && (
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">{selectedItem.name}</span>
                <span className="text-red-600">Current: {selectedItem.quantity} {selectedItem.unit}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
                <select
                  value={reorderForm.supplierId}
                  onChange={(e) => {
                    const supplier = suppliers.find(s => s.id === e.target.value);
                    setReorderForm({
                      ...reorderForm,
                      supplierId: e.target.value,
                      supplierName: supplier?.name || '',
                      expectedDeliveryDate: supplier ? new Date(Date.now() + (supplier.leadTime || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Lead time: {s.leadTime || 7} days)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={reorderForm.priority}
                  onChange={(e) => setReorderForm({ ...reorderForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  value={reorderForm.items[0]?.quantity || 0}
                  onChange={(e) => setReorderForm({
                    ...reorderForm,
                    items: [{ ...reorderForm.items[0], quantity: parseInt(e.target.value) || 0 }]
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price (KES)</label>
                <input
                  type="number"
                  value={reorderForm.items[0]?.unitPrice || 0}
                  onChange={(e) => setReorderForm({
                    ...reorderForm,
                    items: [{ ...reorderForm.items[0], unitPrice: parseFloat(e.target.value) || 0 }]
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={reorderForm.expectedDeliveryDate}
                  onChange={(e) => setReorderForm({ ...reorderForm, expectedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
                <select
                  value={reorderForm.paymentTerms}
                  onChange={(e) => setReorderForm({ ...reorderForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="cash">Cash on Delivery</option>
                  <option value="7 days">7 Days</option>
                  <option value="15 days">15 Days</option>
                  <option value="30 days">30 Days</option>
                  <option value="60 days">60 Days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={reorderForm.notes}
                onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total Cost:</span>
                <span className="font-bold">{(reorderForm.items[0]?.quantity * reorderForm.items[0]?.unitPrice || 0).toLocaleString()} KES</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowReorderModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitReorder} isLoading={submitting}>Create Purchase Order</Button>
        </div>
      </Modal>

      {/* Batch Reorder Modal */}
      <Modal isOpen={showBatchReorderModal} onClose={() => setShowBatchReorderModal(false)} title="Batch Reorder" size="xl">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
              <select
                value={reorderForm.supplierId}
                onChange={(e) => {
                  const supplier = suppliers.find(s => s.id === e.target.value);
                  setReorderForm({
                    ...reorderForm,
                    supplierId: e.target.value,
                    supplierName: supplier?.name || '',
                    expectedDeliveryDate: supplier ? new Date(Date.now() + (supplier.leadTime || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : ''
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (Lead time: {s.leadTime || 7} days)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                value={reorderForm.priority}
                onChange={(e) => setReorderForm({ ...reorderForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={reorderForm.expectedDeliveryDate}
                onChange={(e) => setReorderForm({ ...reorderForm, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
              <select
                value={reorderForm.paymentTerms}
                onChange={(e) => setReorderForm({ ...reorderForm, paymentTerms: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="cash">Cash on Delivery</option>
                <option value="7 days">7 Days</option>
                <option value="15 days">15 Days</option>
                <option value="30 days">30 Days</option>
                <option value="60 days">60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items to Reorder</label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Current Qty</th>
                    <th className="px-3 py-2 text-right">Reorder Qty</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reorderForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{item.itemName}</td>
                      <td className="px-3 py-2 text-right">{selectedItem?.id === item.itemId ? selectedItem?.quantity : '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...reorderForm.items];
                            newItems[idx].quantity = parseInt(e.target.value) || 0;
                            setReorderForm({ ...reorderForm, items: newItems });
                          }}
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const newItems = [...reorderForm.items];
                            newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                            setReorderForm({ ...reorderForm, items: newItems });
                          }}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{(item.quantity * item.unitPrice).toLocaleString()} KES</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right font-bold">Total:</td>
                    <td className="px-3 py-2 text-right font-bold">
                      {reorderForm.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toLocaleString()} KES
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={reorderForm.notes}
              onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowBatchReorderModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitReorder} isLoading={submitting}>Create Batch Purchase Order</Button>
        </div>
      </Modal>
    </div>
  );
};

export default StoreKeeperLowStockPage;