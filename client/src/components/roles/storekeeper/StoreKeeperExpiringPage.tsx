import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Package,
  Clock,
  Eye,
  Download,
  Printer,
  Mail,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  PackageX,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Settings,
  Edit,
  MoreVertical,
  ExternalLink,
  Shield,
  Award,
  Flame,
  Zap,
  Star,
  FileText,
  Upload,
  PlusCircle,
  MinusCircle,
  Building2,
  Truck,
  ShoppingCart,
  DollarSign,
  Percent,
  Users,
  MapPin,
  Phone,
  Mail as MailIcon
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';

interface ExpiringItem {
  id: string;
  name: string;
  code: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  originalQuantity: number;
  purchasePrice: number;
  totalValue: number;
  location: string;
  supplier: string;
  batchNumber?: string;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring_soon' | 'critical';
  notes?: string;
}

interface ExpirySummary {
  expiredCount: number;
  expiring7DaysCount: number;
  expiring30DaysCount: number;
  totalValue: number;
  categories: Record<string, number>;
}

const StoreKeeperExpiringPage: React.FC = () => {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [summary, setSummary] = useState<ExpirySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expired' | 'expiring_soon' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'expiryDate' | 'quantity' | 'value' | 'days'>('expiryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<ExpiringItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState<ExpiringItem | null>(null);
  const [disposeQuantity, setDisposeQuantity] = useState(0);
  const [disposeReason, setDisposeReason] = useState('expired');
  const [disposeNotes, setDisposeNotes] = useState('');
  const [disposing, setDisposing] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inventoryRes, summaryRes] = await Promise.all([
        storeKeeperService.inventory.getInventory(),
        storeKeeperService.inventory.getExpirySummary()
      ]);
      
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      
      const allItems = inventoryRes.data || [];
      const expiringItems = allItems
        .filter((item: any) => item.expiryDate)
        .map((item: any) => {
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let status: 'expired' | 'expiring_soon' | 'critical' = 'expiring_soon';
          if (daysUntilExpiry < 0) status = 'expired';
          else if (daysUntilExpiry <= 7) status = 'critical';
          else if (daysUntilExpiry <= 30) status = 'expiring_soon';
          
          return {
            ...item,
            daysUntilExpiry,
            status,
            totalValue: item.quantity * (item.purchasePrice || 0)
          };
        })
        .sort((a: ExpiringItem, b: ExpiringItem) => a.daysUntilExpiry - b.daysUntilExpiry);
      
      setItems(expiringItems);
      setSummary(summaryRes?.data || {
        expiredCount: expiringItems.filter(i => i.status === 'expired').length,
        expiring7DaysCount: expiringItems.filter(i => i.status === 'critical').length,
        expiring30DaysCount: expiringItems.filter(i => i.status === 'expiring_soon').length,
        totalValue: expiringItems.reduce((sum, i) => sum + i.totalValue, 0),
        categories: expiringItems.reduce((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
    } catch (error) {
      console.error('Failed to load expiring items:', error);
      toast.error('Failed to load expiring items');
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
                           item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.batchNumber && item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'expiryDate':
          comparison = a.daysUntilExpiry - b.daysUntilExpiry;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'value':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'days':
          comparison = a.daysUntilExpiry - b.daysUntilExpiry;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  }, [items]);

  const handleDispose = async () => {
    if (!showDisposeModal) return;
    if (disposeQuantity <= 0 || disposeQuantity > showDisposeModal.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    setDisposing(true);
    try {
      await storeKeeperService.movements.writeOffItems({
        itemId: showDisposeModal.id,
        quantity: disposeQuantity,
        reason: disposeReason,
        notes: disposeNotes || `Disposed due to ${disposeReason === 'expired' ? 'expiry' : 'damage'}`
      });
      toast.success(`${disposeQuantity} x ${showDisposeModal.name} disposed successfully`);
      setShowDisposeModal(null);
      setDisposeQuantity(0);
      setDisposeReason('expired');
      setDisposeNotes('');
      fetchData();
    } catch (error) {
      console.error('Failed to dispose items:', error);
      toast.error('Failed to dispose items');
    } finally {
      setDisposing(false);
    }
  };

  const handleBatchDispose = async () => {
    const expiredItems = items.filter(i => i.status === 'expired');
    if (expiredItems.length === 0) {
      toast.error('No expired items to dispose');
      return;
    }
    
    if (!confirm(`Dispose all ${expiredItems.length} expired items? This action cannot be undone.`)) return;
    
    setDisposing(true);
    try {
      for (const item of expiredItems) {
        await storeKeeperService.movements.writeOffItems({
          itemId: item.id,
          quantity: item.quantity,
          reason: 'expired',
          notes: 'Batch disposal from expiring items view'
        });
      }
      toast.success(`Disposed ${expiredItems.length} expired items`);
      fetchData();
    } catch (error) {
      console.error('Failed to batch dispose:', error);
      toast.error('Failed to dispose some items');
    } finally {
      setDisposing(false);
    }
  };

  const generateReport = async () => {
    try {
      const blob = await storeKeeperService.inventory.generateExpiryReport({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter || undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expiry_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    }
  };

  const getStatusBadge = (status: string, daysUntilExpiry: number) => {
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      );
    }
    if (status === 'critical' || daysUntilExpiry <= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
          <AlertTriangle className="w-3 h-3" />
          Critical ({Math.abs(daysUntilExpiry)} days)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock className="w-3 h-3" />
        Expires in {daysUntilExpiry} days
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading expiring items..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-600" />
            Expiring & Expired Items
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage items approaching expiry date
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
          <Button variant="outline" size="sm" onClick={generateReport}>
            <Download className="w-4 h-4 mr-1" />
            Report
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600">{summary.expiredCount}</p>
            <p className="text-xs text-gray-500">Expired Items</p>
          </Card>
          <Card className="text-center border-l-4 border-l-orange-500">
            <p className="text-2xl font-bold text-orange-600">{summary.expiring7DaysCount}</p>
            <p className="text-xs text-gray-500">Expiring in 7 Days</p>
          </Card>
          <Card className="text-center border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold text-yellow-600">{summary.expiring30DaysCount}</p>
            <p className="text-xs text-gray-500">Expiring in 30 Days</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalValue)}</p>
            <p className="text-xs text-gray-500">Total Value at Risk</p>
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
              placeholder="Search by item name, code, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="expired">Expired</option>
            <option value="critical">Critical (≤7 days)</option>
            <option value="expiring_soon">Expiring Soon (≤30 days)</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="expiryDate">Sort by Expiry Date</option>
            <option value="days">Sort by Days Left</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="value">Sort by Value</option>
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
              setStatusFilter('all');
              setSortBy('expiryDate');
              setSortOrder('asc');
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Batch Actions */}
      {items.filter(i => i.status === 'expired').length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleBatchDispose} isLoading={disposing}>
            <Trash2 className="w-4 h-4 mr-1" />
            Dispose All Expired ({items.filter(i => i.status === 'expired').length} items)
          </Button>
        </div>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No expiring items found</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Expiry Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold text-right">Value</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={clsx(item.daysUntilExpiry < 0 ? 'text-red-600 font-medium' : 'text-gray-900')}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </div>
                        {item.batchNumber && (
                          <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.status, item.daysUntilExpiry)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{item.quantity}</span>
                        <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.totalValue)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setShowDisposeModal(item);
                              setDisposeQuantity(item.quantity);
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Dispose
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedItemId === item.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Location</p>
                              <p className="font-medium">{item.location || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Supplier</p>
                              <p className="font-medium">{item.supplier || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Purchase Price</p>
                              <p className="font-medium">{formatCurrency(item.purchasePrice)} per {item.unit}</p>
                            </div>
                            {item.notes && (
                              <div className="col-span-2">
                                <p className="text-gray-500">Notes</p>
                                <p className="text-sm">{item.notes}</p>
                              </div>
                            )}
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
          {filteredItems.map((item) => (
            <Card key={item.id} className={clsx(
              'hover:shadow-lg transition',
              item.status === 'expired' && 'border-l-4 border-l-red-500',
              item.status === 'critical' && 'border-l-4 border-l-orange-500'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.code}</p>
                </div>
                {getStatusBadge(item.status, item.daysUntilExpiry)}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className={clsx(item.daysUntilExpiry < 0 && 'text-red-600 font-medium')}>
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-medium">{item.quantity} {item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Value:</span>
                  <span>{formatCurrency(item.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span>{item.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" fullWidth onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}>
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
                <Button size="sm" variant="outline" fullWidth className="text-red-600" onClick={() => {
                  setShowDisposeModal(item);
                  setDisposeQuantity(item.quantity);
                }}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  Dispose
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Item Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Item Details" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Item Name</p>
                <p className="font-semibold">{selectedItem.name}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Item Code</p>
                <p className="font-semibold">{selectedItem.code}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-semibold">{selectedItem.category}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Batch Number</p>
                <p className="font-semibold">{selectedItem.batchNumber || 'N/A'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Expiry Date</p>
                <p className="font-semibold text-red-600">{new Date(selectedItem.expiryDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Days Until Expiry</p>
                <p className="font-semibold">{selectedItem.daysUntilExpiry} days</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-semibold">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="font-semibold">{formatCurrency(selectedItem.totalValue)}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold">{selectedItem.location || 'Not specified'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-semibold">{selectedItem.supplier || 'Not specified'}</p>
              </div>
            </div>
            {selectedItem.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{selectedItem.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Dispose Modal */}
      <Modal isOpen={!!showDisposeModal} onClose={() => setShowDisposeModal(null)} title="Dispose Items" size="md">
        {showDisposeModal && (
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="font-medium">{showDisposeModal.name}</p>
              <p className="text-sm text-gray-600">Available: {showDisposeModal.quantity} {showDisposeModal.unit}</p>
              <p className="text-sm text-red-600">Expires: {new Date(showDisposeModal.expiryDate).toLocaleDateString()}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity to Dispose</label>
              <input
                type="number"
                value={disposeQuantity}
                onChange={(e) => setDisposeQuantity(Math.min(parseInt(e.target.value) || 0, showDisposeModal.quantity))}
                min="1"
                max={showDisposeModal.quantity}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
              <select
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="expired">Expired</option>
                <option value="damaged">Damaged</option>
                <option value="recalled">Recalled by Supplier</option>
                <option value="contaminated">Contaminated</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
              <textarea
                value={disposeNotes}
                onChange={(e) => setDisposeNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                placeholder="Additional information about disposal..."
              />
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowDisposeModal(null)}>Cancel</Button>
          <Button fullWidth onClick={handleDispose} isLoading={disposing}>
            <Trash2 className="w-4 h-4 mr-1" />
            Dispose Items
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StoreKeeperExpiringPage;