// client/src/components/roles/storekeeper/StoreKeeperPurchaseOrdersPage.tsx (COMPLETE)
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Search, RefreshCcw, X, Eye, Edit, Trash2, Send, CheckCircle, XCircle,
  Truck, Package, DollarSign, Calendar, Clock, Filter, Download, Printer, Mail,
  Phone, Building2, User, FileText, AlertCircle, ChevronDown, ChevronUp,
  MoreVertical, Flag, Shield, CreditCard, SendHorizontal, PackageCheck,
  PackageX, RotateCcw, AlertTriangle, Info, Copy, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { PurchaseOrder, PurchaseOrderItem, Supplier } from '../../../types/storeKeeper';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface POForm {
  supplierId: string;
  supplierName: string;
  expectedDeliveryDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  paymentTerms: string;
  shippingAddress: string;
  notes: string;
  items: PurchaseOrderItem[];
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <Flag className="w-3 h-3" /> },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Flag className="w-3 h-3" /> },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <Flag className="w-3 h-3" /> },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="w-3 h-3" /> },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: <Edit className="w-3 h-3" /> },
  pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="w-3 h-3" /> },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
  sent: { label: 'Sent to Supplier', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Send className="w-3 h-3" /> },
  partial: { label: 'Partially Received', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: <Package className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <PackageCheck className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
};

const paymentTermsOptions = ['Cash on Delivery', '7 Days', '15 Days', '30 Days', '45 Days', '60 Days'];

export default function StoreKeeperPurchaseOrdersPage() {
  const { t } = useTranslation('storekeeper');
  const { t: tc } = useTranslation('common');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [poForm, setPoForm] = useState<POForm>({
    supplierId: '',
    supplierName: '',
    expectedDeliveryDate: '',
    priority: 'normal',
    paymentTerms: '30 Days',
    shippingAddress: '',
    notes: '',
    items: [{ itemName: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalCost: 0 }]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        storeKeeperService.purchaseOrders.getPurchaseOrders({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        }),
        storeKeeperService.suppliers.getSuppliers()
      ]);
      setOrders(ordersRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [orders, searchTerm]);

  const statistics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'draft').length;
    const approved = orders.filter(o => o.status === 'approved').length;
    const sent = orders.filter(o => o.status === 'sent').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { total, pending, approved, sent, completed, cancelled, totalValue };
  }, [orders]);

  const addItem = () => {
    setPoForm(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalCost: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setPoForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setPoForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItems[index].totalCost = newItems[index].quantity * newItems[index].unitPrice;
      }
      return { ...prev, items: newItems };
    });
  };

  const savePO = async () => {
    if (!poForm.supplierId && !poForm.supplierName) {
      toast.error('Supplier is required');
      return;
    }
    if (!poForm.items.length || poForm.items.some(i => !i.itemName.trim())) {
      toast.error('Add at least one valid item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...poForm,
        status: 'draft',
        supplierName: poForm.supplierName || suppliers.find(s => s.id === poForm.supplierId)?.name || '',
        items: poForm.items.map(item => ({
          ...item,
          totalCost: item.quantity * item.unitPrice
        }))
      };
      
      if (editingOrder) {
        await storeKeeperService.purchaseOrders.updatePurchaseOrder(editingOrder.id, payload);
        toast.success('Purchase order updated');
      } else {
        await storeKeeperService.purchaseOrders.createPurchaseOrder(payload);
        toast.success('Purchase order created');
      }
      setShowModal(false);
      setEditingOrder(null);
      setPoForm({
        supplierId: '',
        supplierName: '',
        expectedDeliveryDate: '',
        priority: 'normal',
        paymentTerms: '30 Days',
        shippingAddress: '',
        notes: '',
        items: [{ itemName: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalCost: 0 }]
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save purchase order:', error);
      toast.error('Failed to save purchase order');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await storeKeeperService.purchaseOrders.updateOrderStatus(orderId, status);
      toast.success(`Order marked as ${status}`);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await storeKeeperService.purchaseOrders.deletePurchaseOrder(orderId);
      toast.success('Purchase order deleted');
      fetchData();
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Failed to delete order');
    }
  };

  const exportOrders = () => {
    const csv = [
      ['PO Number', 'Supplier', 'Date', 'Expected Delivery', 'Items', 'Total', 'Priority', 'Status'],
      ...filteredOrders.map(o => [
        o.poNumber,
        o.supplierName,
        new Date(o.createdAt).toLocaleDateString(),
        o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString() : '-',
        o.items?.length || 0,
        o.total || 0,
        o.priority,
        o.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getTotalValue = (items: PurchaseOrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading purchase orders..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Purchase Orders
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage purchase orders for suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              {t('purchaseOrders.views.table') || 'Table View'}
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              {t('purchaseOrders.views.card') || 'Card View'}
            </button>
          </div>
           <Button variant="outline" size="sm" onClick={exportOrders}>
             <Download className="w-4 h-4 mr-1" />
             {t('purchaseOrders.actions.export') || 'Export'}
           </Button>
           <Button variant="outline" size="sm" onClick={() => fetchData()}>
             <RefreshCcw className="w-4 h-4 mr-1" />
             {t('purchaseOrders.actions.refresh') || 'Refresh'}
           </Button>
           <Button size="sm" onClick={() => {
             setEditingOrder(null);
             setPoForm({
               supplierId: '',
               supplierName: '',
               expectedDeliveryDate: '',
               priority: 'normal',
               paymentTerms: '30 Days',
               shippingAddress: '',
               notes: '',
               items: [{ itemName: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalCost: 0 }]
             });
             setShowModal(true);
           }}>
             <Plus className="w-4 h-4 mr-1" />
             {t('purchaseOrders.actions.createPO') || 'Create PO'}
           </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.total}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.totalOrders') || 'Total Orders'}</p>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.pending') || 'Pending'}</p>
        </Card>
        <Card className="text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.approved') || 'Approved'}</p>
        </Card>
        <Card className="text-center border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600">{statistics.sent}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.sent') || 'Sent'}</p>
        </Card>
        <Card className="text-center border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-600">{statistics.completed}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.completed') || 'Completed'}</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">{statistics.cancelled}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.cancelled') || 'Cancelled'}</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">{statistics.totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500">{t('purchaseOrders.statistics.totalValue') || 'Total Value (KES)'}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input
               type="text"
               placeholder={t('purchaseOrders.filters.searchPlaceholder') || 'Search by PO number or supplier...'}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
             />
          </div>
           <select
             value={statusFilter}
             onChange={(e) => setStatusFilter(e.target.value)}
             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
           >
             <option value="">{t('purchaseOrders.filters.allStatuses') || 'All Statuses'}</option>
             <option value="draft">{t('purchaseOrders.filters.draft') || 'Draft'}</option>
             <option value="pending">{t('purchaseOrders.filters.pendingApproval') || 'Pending Approval'}</option>
             <option value="approved">{t('purchaseOrders.filters.approved') || 'Approved'}</option>
             <option value="sent">{t('purchaseOrders.filters.sent') || 'Sent'}</option>
             <option value="partial">{t('purchaseOrders.filters.partiallyReceived') || 'Partially Received'}</option>
             <option value="completed">{t('purchaseOrders.filters.completed') || 'Completed'}</option>
             <option value="cancelled">{t('purchaseOrders.filters.cancelled') || 'Cancelled'}</option>
           </select>
           <select
             value={priorityFilter}
             onChange={(e) => setPriorityFilter(e.target.value)}
             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
           >
             <option value="">{t('purchaseOrders.filters.allPriorities') || 'All Priorities'}</option>
             <option value="low">{t('purchaseOrders.filters.low') || 'Low'}</option>
             <option value="normal">{t('purchaseOrders.filters.normal') || 'Normal'}</option>
             <option value="high">{t('purchaseOrders.filters.high') || 'High'}</option>
             <option value="urgent">{t('purchaseOrders.filters.urgent') || 'Urgent'}</option>
           </select>
           <input
             type="date"
             placeholder={t('purchaseOrders.filters.fromDate') || 'From'}
             value={dateRange.start}
             onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
           />
           <input
             type="date"
             placeholder={t('purchaseOrders.filters.toDate') || 'To'}
             value={dateRange.end}
             onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
           />
           <Button
             variant="outline"
             size="sm"
             onClick={() => {
               setSearchTerm('');
               setStatusFilter('');
               setPriorityFilter('');
               setDateRange({ start: '', end: '' });
             }}
           >
             {t('purchaseOrders.filters.clearAll') || 'Clear All'}
           </Button>
        </div>
      </Card>

      {/* Orders List */}
       {filteredOrders.length === 0 ? (
         <Card className="text-center py-12">
           <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
           <p className="text-gray-500 dark:text-gray-400">{t('purchaseOrders.emptyState.noOrders') || 'No purchase orders found'}</p>
           <Button className="mt-4" onClick={() => setShowModal(true)}>
             <Plus className="w-4 h-4 mr-1" />
             {t('purchaseOrders.emptyState.createFirstPO') || 'Create Your First PO'}
           </Button>
         </Card>
       ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
               <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                 <tr className="text-left text-sm">
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.poNumber') || 'PO #'}</th>
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.supplier') || 'Supplier'}</th>
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.date') || 'Date'}</th>
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.items') || 'Items'}</th>
                   <th className="px-4 py-3 font-semibold text-right">{t('purchaseOrders.table.headers.total') || 'Total'}</th>
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.priority') || 'Priority'}</th>
                   <th className="px-4 py-3 font-semibold">{t('purchaseOrders.table.headers.status') || 'Status'}</th>
                   <th className="px-4 py-3 font-semibold text-center">{t('purchaseOrders.table.headers.actions') || 'Actions'}</th>
                 </tr>
               </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => {
                  const priority = priorityConfig[order.priority as keyof typeof priorityConfig] || priorityConfig.normal;
                  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.draft;
                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{order.poNumber}</td>
                        <td className="px-4 py-3">{order.supplierName}</td>
                        <td className="px-4 py-3 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                         <td className="px-4 py-3">{order.items?.length || 0} {t('purchaseOrders.table.rows.items') || 'items'}</td>
                         <td className="px-4 py-3 text-right font-medium">{tc('common.currency') || 'KES'} {order.total?.toLocaleString() || getTotalValue(order.items || []).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                            {priority.icon}
                            {priority.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDetailModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            {(order.status === 'draft' || order.status === 'cancelled') && (
                              <button
                                onClick={() => {
                                  setEditingOrder(order);
                                  setPoForm({
                                    supplierId: order.supplierId || '',
                                    supplierName: order.supplierName,
                                    expectedDeliveryDate: order.expectedDeliveryDate || '',
                                    priority: order.priority,
                                    paymentTerms: order.paymentTerms || '30 Days',
                                    shippingAddress: order.shippingAddress || '',
                                    notes: order.notes || '',
                                    items: order.items || []
                                  });
                                  setShowModal(true);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <Edit className="w-4 h-4 text-blue-500" />
                              </button>
                            )}
                            {order.status === 'draft' && (
                              <button
                                onClick={() => updateStatus(order.id, 'pending')}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <Send className="w-4 h-4 text-green-500" />
                              </button>
                            )}
                            {order.status === 'approved' && (
                              <button
                                onClick={() => updateStatus(order.id, 'sent')}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              >
                                <SendHorizontal className="w-4 h-4 text-blue-500" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === order.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Expected Delivery</p>
                                  <p className="text-sm font-medium">{order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Payment Terms</p>
                                  <p className="text-sm font-medium">{order.paymentTerms || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Created By</p>
                                  <p className="text-sm font-medium">{order.createdBy || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Last Updated</p>
                                  <p className="text-sm font-medium">{new Date(order.updatedAt).toLocaleString()}</p>
                                </div>
                              </div>
                              {order.notes && (
                                <div>
                                  <p className="text-xs text-gray-500">Notes</p>
                                  <p className="text-sm">{order.notes}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-500 mb-2">Order Items</p>
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Item</th>
                                      <th className="px-3 py-2 text-right">Qty</th>
                                      <th className="px-3 py-2 text-right">Unit Price</th>
                                      <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items?.map((item, idx) => (
                                      <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                                        <td className="px-3 py-2">{item.itemName}</td>
                                        <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                                        <td className="px-3 py-2 text-right">KES {item.unitPrice.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right font-medium">KES {(item.quantity * item.unitPrice).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const priority = priorityConfig[order.priority as keyof typeof priorityConfig] || priorityConfig.normal;
            const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.draft;
            return (
              <Card key={order.id} className="hover:shadow-lg transition">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{order.poNumber}</span>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', priority.color)}>
                      {priority.icon}
                      {priority.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{order.supplierName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{order.items?.length || 0} items</span>
                    <span className="text-lg font-bold text-purple-600">KES {order.total?.toLocaleString() || getTotalValue(order.items || []).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      {(order.status === 'draft' || order.status === 'cancelled') && (
                        <button onClick={() => {
                          setEditingOrder(order);
                          setPoForm({
                            supplierId: order.supplierId || '',
                            supplierName: order.supplierName,
                            expectedDeliveryDate: order.expectedDeliveryDate || '',
                            priority: order.priority,
                            paymentTerms: order.paymentTerms || '30 Days',
                            shippingAddress: order.shippingAddress || '',
                            notes: order.notes || '',
                            items: order.items || []
                          });
                          setShowModal(true);
                        }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Edit className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit PO Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
        size="xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          {/* Supplier Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Supplier</label>
              <select
                value={poForm.supplierId}
                onChange={(e) => {
                  const supplier = suppliers.find(s => s.id === e.target.value);
                  setPoForm(prev => ({
                    ...prev,
                    supplierId: e.target.value,
                    supplierName: supplier?.name || ''
                  }));
                }}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="">Choose a supplier...</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Or Enter Supplier Name</label>
              <input
                type="text"
                value={poForm.supplierName}
                onChange={(e) => setPoForm(prev => ({ ...prev, supplierName: e.target.value, supplierId: '' }))}
                placeholder="New supplier name"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={poForm.expectedDeliveryDate}
                onChange={(e) => setPoForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Terms</label>
              <select
                value={poForm.paymentTerms}
                onChange={(e) => setPoForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                {paymentTermsOptions.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={poForm.priority}
                onChange={(e) => setPoForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Address</label>
              <input
                type="text"
                value={poForm.shippingAddress}
                onChange={(e) => setPoForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                placeholder="Main Store, School Compound"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Order Items</label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {poForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="boxes">boxes</option>
                    <option value="pairs">pairs</option>
                    <option value="sets">sets</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-28 px-3 py-2 border rounded-lg dark:bg-gray-800"
                  />
                  <span className="text-sm font-medium w-24">KES {(item.quantity * item.unitPrice).toLocaleString()}</span>
                  <button onClick={() => removeItem(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={poForm.notes}
              onChange={(e) => setPoForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Special instructions, delivery notes, etc."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>

          {/* Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  KES {getTotalValue(poForm.items).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={savePO} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
            {saving ? 'Saving...' : (editingOrder ? 'Update Order' : 'Create Order')}
          </Button>
        </div>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Purchase Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">PO Number</p>
                <p className="font-mono font-bold">{selectedOrder.poNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig[selectedOrder.status as keyof typeof statusConfig]?.color)}>
                  {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.icon}
                  {statusConfig[selectedOrder.status as keyof typeof statusConfig]?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p>{selectedOrder.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created Date</p>
                <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expected Delivery</p>
                <p>{selectedOrder.expectedDeliveryDate ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p>{selectedOrder.paymentTerms || '-'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Order Items</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Quantity</th>
                    <th className="px-3 py-2 text-right">Unit Price</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-3 py-2">{item.itemName}</td>
                      <td className="px-3 py-2 text-right">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right">KES {item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium">KES {(item.quantity * item.unitPrice).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right font-bold">Total:</td>
                    <td className="px-3 py-2 text-right font-bold text-purple-600">
                      KES {selectedOrder.total?.toLocaleString() || getTotalValue(selectedOrder.items || []).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              {(selectedOrder.status === 'draft' || selectedOrder.status === 'pending') && (
                <>
                  <Button variant="outline" onClick={() => {
                    updateStatus(selectedOrder.id, selectedOrder.status === 'draft' ? 'pending' : 'approved');
                    setShowDetailModal(false);
                  }}>
                    {selectedOrder.status === 'draft' ? 'Submit for Approval' : 'Approve'}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    updateStatus(selectedOrder.id, 'cancelled');
                    setShowDetailModal(false);
                  }} className="text-red-600">
                    Cancel Order
                  </Button>
                </>
              )}
              {selectedOrder.status === 'approved' && (
                <Button onClick={() => {
                  updateStatus(selectedOrder.id, 'sent');
                  setShowDetailModal(false);
                }}>
                  <Send className="w-4 h-4 mr-1" />
                  Send to Supplier
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}