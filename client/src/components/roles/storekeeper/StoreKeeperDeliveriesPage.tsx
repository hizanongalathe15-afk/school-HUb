import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Truck,
  RefreshCcw,
  Check,
  X,
  Search,
  Filter,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Printer,
  Mail,
  Phone,
  MapPin,
  User,
  Building,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PackageCheck,
  PackageX,
  DollarSign,
  Percent,
  Upload,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  Loader2,
  ExternalLink,
  Bell,
  Shield,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';

interface DeliveryItem {
  id: string;
  itemId: string;
  itemName: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unitPrice: number;
  totalCost: number;
  condition: 'good' | 'damaged' | 'partial';
  rejectionReason?: string;
  notes?: string;
}

interface Delivery {
  id: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierContact?: string;
  expectedDate: string;
  actualDate?: string;
  status: 'pending' | 'partial' | 'complete' | 'rejected' | 'cancelled';
  items: DeliveryItem[];
  deliveryNote?: string;
  receivedBy?: string;
  receivedAt?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DeliverySummary {
  totalDeliveries: number;
  pendingCount: number;
  completedCount: number;
  partialCount: number;
  totalValue: number;
  damagedItems: number;
}

const StoreKeeperDeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<Delivery | null>(null);
  const [receiveItems, setReceiveItems] = useState<Record<string, { accepted: number; rejected: number; condition: string; reason: string }>>({});
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deliveriesRes, summaryRes] = await Promise.all([
        storeKeeperService.deliveries.getDeliveries(),
        storeKeeperService.deliveries.getDeliverySummary()
      ]);
      setDeliveries(Array.isArray(deliveriesRes) ? deliveriesRes : deliveriesRes?.data || []);
      setSummary(summaryRes?.data || null);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const matchesSearch = delivery.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           delivery.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? delivery.status === statusFilter : true;
      const matchesSupplier = supplierFilter ? delivery.supplierId === supplierFilter : true;
      const matchesDate = (!dateRange.start || new Date(delivery.expectedDate) >= new Date(dateRange.start)) &&
                         (!dateRange.end || new Date(delivery.expectedDate) <= new Date(dateRange.end));
      return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
    });
  }, [deliveries, searchTerm, statusFilter, supplierFilter, dateRange]);

  const markReceived = async () => {
    if (!showReceiveModal) return;

    const items = showReceiveModal.items.map(item => ({
      itemId: item.id,
      itemName: item.itemName,
      orderedQuantity: item.orderedQuantity,
      deliveredQuantity: receiveItems[item.id]?.accepted || 0,
      rejectedQuantity: receiveItems[item.id]?.rejected || 0,
      condition: receiveItems[item.id]?.condition || 'good',
      rejectionReason: receiveItems[item.id]?.reason
    }));

    try {
      await storeKeeperService.purchaseOrders.receiveOrder(showReceiveModal.poId, items);
      toast.success('Stock received successfully');
      setShowReceiveModal(null);
      setReceiveItems({});
      fetchData();
    } catch (error) {
      console.error('Failed to receive order:', error);
      toast.error('Failed to receive order');
    }
  };

  const generateDeliveryReport = async () => {
    setGeneratingReport(true);
    try {
      const blob = await storeKeeperService.deliveries.generateReport({
        status: statusFilter || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deliveries_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock className="w-3 h-3" /> },
      partial: { label: 'Partial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Package className="w-3 h-3" /> },
      complete: { label: 'Complete', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="w-3 h-3" /> },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: <XCircle className="w-3 h-3" /> }
    };
    const c = config[status as keyof typeof config] || config.pending;
    return (
      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', c.color)}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  const getConditionBadge = (condition: string) => {
    const config = {
      good: { label: 'Good', color: 'bg-green-100 text-green-800' },
      damaged: { label: 'Damaged', color: 'bg-red-100 text-red-800' },
      partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-800' }
    };
    const c = config[condition as keyof typeof config] || config.good;
    return <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', c.color)}>{c.label}</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-600">Overdue by {Math.abs(diffDays)} days</span>;
    if (diffDays === 0) return <span className="text-orange-600">Today</span>;
    if (diffDays <= 3) return <span className="text-yellow-600">In {diffDays} days</span>;
    return <span>{date.toLocaleDateString()}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading deliveries..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Deliveries Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage incoming deliveries, receive stock, and handle returns
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'table' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'card' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Card View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={generateDeliveryReport} isLoading={generatingReport}>
            <Download className="w-4 h-4 mr-1" />
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalDeliveries}</p>
            <p className="text-xs text-gray-500">Total Deliveries</p>
          </Card>
          <Card className="text-center border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </Card>
          <Card className="text-center border-l-4 border-l-green-500">
            <p className="text-2xl font-bold text-green-600">{summary.completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </Card>
          <Card className="text-center border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold text-blue-600">{summary.partialCount}</p>
            <p className="text-xs text-gray-500">Partial</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalValue)}</p>
            <p className="text-xs text-gray-500">Total Value</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-600">{summary.damagedItems}</p>
            <p className="text-xs text-gray-500">Damaged Items</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="complete">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="date"
            placeholder="From"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          />
          <input
            type="date"
            placeholder="To"
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
              setDateRange({ start: '', end: '' });
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No deliveries found</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">PO #</th>
                  <th className="px-4 py-3 font-semibold">Supplier</th>
                  <th className="px-4 py-3 font-semibold">Expected Date</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDeliveries.map((delivery) => (
                  <React.Fragment key={delivery.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => setExpandedDeliveryId(expandedDeliveryId === delivery.id ? null : delivery.id)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{delivery.poNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{delivery.supplierName}</p>
                          {delivery.supplierContact && (
                            <p className="text-xs text-gray-500">{delivery.supplierContact}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(delivery.expectedDate)}</td>
                      <td className="px-4 py-3">{delivery.items?.length || 0} items</td>
                      <td className="px-4 py-3">{getStatusBadge(delivery.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          {delivery.status !== 'complete' && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const initialItems: Record<string, any> = {};
                                delivery.items.forEach(item => {
                                  initialItems[item.id] = {
                                    accepted: item.deliveredQuantity || item.orderedQuantity,
                                    rejected: 0,
                                    condition: 'good',
                                    reason: ''
                                  };
                                });
                                setReceiveItems(initialItems);
                                setShowReceiveModal(delivery);
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Receive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
{expandedDeliveryId === delivery.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="text-sm space-y-2">
                              <p><strong>Delivery Note:</strong> {delivery.deliveryNote || 'No notes'}</p>
                              {delivery.receivedBy && (
                                <p><strong>Received By:</strong> {delivery.receivedBy} on {delivery.receivedAt ? new Date(delivery.receivedAt).toLocaleString() : '-'}</p>
                              )}
                              <div className="mt-2">
                                <strong>Items:</strong>
                                <div className="mt-1 space-y-1">
                                  {delivery.items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 text-xs">
                                      <span className="w-32">{item.itemName}</span>
                                      <span>Ordered: {item.orderedQuantity}</span>
                                      <span>Delivered: {item.deliveredQuantity || 0}</span>
                                      {item.condition && <span>Condition: {getConditionBadge(item.condition)}</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="hover:shadow-lg transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{delivery.poNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{delivery.supplierName}</p>
                </div>
                {getStatusBadge(delivery.status)}
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expected: {new Date(delivery.expectedDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {delivery.items?.length || 0} items
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" fullWidth onClick={() => {
                  setSelectedDelivery(delivery);
                  setShowDetailModal(true);
                }}>
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
                {delivery.status !== 'complete' && (
                  <Button size="sm" fullWidth onClick={() => {
                    const initialItems: Record<string, any> = {};
                    delivery.items.forEach(item => {
                      initialItems[item.id] = {
                        accepted: item.deliveredQuantity || item.orderedQuantity,
                        rejected: 0,
                        condition: 'good',
                        reason: ''
                      };
                    });
                    setReceiveItems(initialItems);
                    setShowReceiveModal(delivery);
                  }}>
                    <Check className="w-3 h-3 mr-1" />
                    Receive
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delivery Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Delivery Details" size="lg">
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">PO Number</p>
                <p className="font-semibold">{selectedDelivery.poNumber}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-semibold">{selectedDelivery.supplierName}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Expected Date</p>
                <p className="font-semibold">{new Date(selectedDelivery.expectedDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                {getStatusBadge(selectedDelivery.status)}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Items</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-right">Ordered</th>
                      <th className="px-3 py-2 text-right">Delivered</th>
                      <th className="px-3 py-2 text-right">Accepted</th>
                      <th className="px-3 py-2 text-right">Rejected</th>
                      <th className="px-3 py-2 text-left">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDelivery.items.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{item.itemName}</td>
                        <td className="px-3 py-2 text-right">{item.orderedQuantity}</td>
                        <td className="px-3 py-2 text-right">{item.deliveredQuantity || '-'}</td>
                        <td className="px-3 py-2 text-right">{item.acceptedQuantity || '-'}</td>
                        <td className="px-3 py-2 text-right">{item.rejectedQuantity || '-'}</td>
                        <td className="px-3 py-2">{item.condition && getConditionBadge(item.condition)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedDelivery.deliveryNote && (
              <div>
                <h4 className="font-semibold mb-1">Delivery Note</h4>
                <p className="text-sm text-gray-600">{selectedDelivery.deliveryNote}</p>
              </div>
            )}
            
            {selectedDelivery.receivedBy && (
              <div className="text-sm text-gray-500">
                Received by: {selectedDelivery.receivedBy} at {selectedDelivery.receivedAt && new Date(selectedDelivery.receivedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Receive Delivery Modal */}
      <Modal isOpen={!!showReceiveModal} onClose={() => setShowReceiveModal(null)} title="Receive Delivery" size="lg">
        {showReceiveModal && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="font-medium">Receiving: {showReceiveModal.poNumber}</p>
              <p className="text-sm text-gray-600">Supplier: {showReceiveModal.supplierName}</p>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-right">Ordered</th>
                    <th className="px-3 py-2 text-right">Accepted</th>
                    <th className="px-3 py-2 text-right">Rejected</th>
                    <th className="px-3 py-2 text-left">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {showReceiveModal.items.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{item.itemName}</td>
                      <td className="px-3 py-2 text-right">{item.orderedQuantity}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={receiveItems[item.id]?.accepted || item.orderedQuantity}
                          onChange={(e) => setReceiveItems(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], accepted: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-20 px-2 py-1 border rounded text-right"
                          min="0"
                          max={item.orderedQuantity}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={receiveItems[item.id]?.rejected || 0}
                          onChange={(e) => setReceiveItems(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], rejected: parseInt(e.target.value) || 0 }
                          }))}
                          className="w-20 px-2 py-1 border rounded text-right"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={receiveItems[item.id]?.condition || 'good'}
                          onChange={(e) => setReceiveItems(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], condition: e.target.value }
                          }))}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="partial">Partial</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowReceiveModal(null)}>Cancel</Button>
          <Button fullWidth onClick={markReceived}>Confirm Receipt</Button>
        </div>
      </Modal>
    </div>
  );
};

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default StoreKeeperDeliveriesPage;