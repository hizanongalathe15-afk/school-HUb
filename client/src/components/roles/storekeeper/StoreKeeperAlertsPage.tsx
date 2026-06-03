import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Package,
  PackageX,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Filter,
  Search,
  X,
  Eye,
  EyeOff,
  Download,
  Printer,
  Mail,
  Send,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Star,
  Flame,
  Zap,
  Shield,
  Truck,
  PackageCheck,
  AlertOctagon,
  Info,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Target,
  Flag,
  Award,
  Crown,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Phone,
  Share2,
  Bookmark,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  Bluetooth,
  Battery,
  BatteryCharging,
  Plug,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Thermometer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { StockAlert, AlertSummary, ReorderSuggestion } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

const urgencyConfig: Record<string, { label: string; color: string; icon: React.ReactNode; priority: number }> = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <Flame size={14} />, priority: 4 },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertTriangle size={14} />, priority: 3 },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertCircle size={14} />, priority: 2 },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Info size={14} />, priority: 1 },
};

const alertTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  low_stock: { label: 'Low Stock', icon: <TrendingDown size={14} />, color: 'bg-yellow-100 text-yellow-800' },
  out_of_stock: { label: 'Out of Stock', icon: <PackageCheck size={14} />, color: 'bg-red-100 text-red-800' },
  expiring: { label: 'Expiring Soon', icon: <Calendar size={14} />, color: 'bg-orange-100 text-orange-800' },
  expired: { label: 'Expired', icon: <AlertOctagon size={14} />, color: 'bg-red-100 text-red-800' },
  overstock: { label: 'Overstock', icon: <TrendingUp size={14} />, color: 'bg-blue-100 text-blue-800' },
  reorder: { label: 'Reorder Suggested', icon: <ShoppingCart size={14} />, color: 'bg-green-100 text-green-800' },
};

export default function StoreKeeperAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<StockAlert | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReorderSuggestion | null>(null);
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [orderQty, setOrderQty] = useState(0);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [notes, setNotes] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, summaryRes, suggestionsRes, suppliersRes] = await Promise.all([
        storeKeeperService.alerts.getAlerts(),
        storeKeeperService.alerts.getAlertSummary(),
        storeKeeperService.alerts.getReorderSuggestions(),
        storeKeeperService.suppliers.getSuppliers(),
      ]);
      
      setAlerts(alertsRes.data || []);
      setSummary(summaryRes.data);
      setReorderSuggestions(suggestionsRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = alert.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter ? alert.severity === severityFilter : true;
      const matchesType = typeFilter ? alert.type === typeFilter : true;
      const matchesRead = readFilter === 'all' ? true : readFilter === 'read' ? alert.isRead : !alert.isRead;
      return matchesSearch && matchesSeverity && matchesType && matchesRead;
    }).sort((a, b) => {
      // Sort by priority first, then by date
      const priorityDiff = (urgencyConfig[b.severity]?.priority || 0) - (urgencyConfig[a.severity]?.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [alerts, searchTerm, severityFilter, typeFilter, readFilter]);

  const openOrderModal = (alert: StockAlert) => {
    setSelectedAlert(alert);
    const qty = alert.reorderLevel ? Math.max(alert.reorderLevel - alert.currentQuantity, 1) : alert.suggestedQuantity || 1;
    setOrderQty(qty);
    setSupplierId('');
    setPriority('normal');
    setNotes(`Reorder ${alert.itemName} - ${alert.type === 'low_stock' ? 'Low stock alert' : 'Auto-generated reorder'}`);
    setShowOrderModal(true);
  };

  const openSuggestionModal = (suggestion: ReorderSuggestion) => {
    setSelectedSuggestion(suggestion);
    setOrderQty(suggestion.suggestedQuantity);
    setSupplierId(suggestion.preferredSupplierId || '');
    setPriority('normal');
    setNotes(`Auto-generated reorder for ${suggestion.itemName} (${suggestion.reason})`);
    setShowOrderModal(true);
  };

  const submitReorder = async () => {
    if (!selectedAlert && !selectedSuggestion) return;
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    try {
      const item = selectedAlert || selectedSuggestion;
      await storeKeeperService.purchaseOrders.createPurchaseOrder({
        supplierId,
        supplierName: suppliers.find(s => s.id === supplierId)?.name || '',
        status: 'pending',
        priority,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        paymentTerms: '30 days',
        notes,
        items: [{
          itemId: item?.id,
          itemName: item?.itemName,
          quantity: orderQty,
          unit: 'pcs',
          unitPrice: 0,
          totalCost: 0
        }],
      });
      toast.success('Purchase order created successfully');
      setShowOrderModal(false);
      fetchAlerts();
    } catch (error) {
      console.error('Failed to create reorder:', error);
      toast.error('Failed to create purchase order');
    }
  };

  const markAllRead = async () => {
    try {
      await storeKeeperService.alerts.markAllAlertsAsRead();
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
      toast.success('All alerts marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Unable to mark all as read');
    }
  };

  const markRead = async (alert: StockAlert) => {
    try {
      await storeKeeperService.alerts.markAlertAsRead(alert.id);
      setAlerts(prev => prev.map(item => item.id === alert.id ? { ...item, isRead: true } : item));
      toast.success('Alert marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Unable to mark alert as read');
    }
  };

  const exportAlerts = () => {
    const csv = [
      ['Item', 'Type', 'Severity', 'Current Quantity', 'Reorder Level', 'Status', 'Created At'],
      ...filteredAlerts.map(alert => [
        alert.itemName,
        alert.type,
        alert.severity,
        alert.currentQuantity,
        alert.reorderLevel || '',
        alert.isRead ? 'Read' : 'Unread',
        new Date(alert.createdAt).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getSummaryCardColor = (type: string) => {
    const colors: Record<string, string> = {
      critical: 'from-red-500 to-red-600',
      high: 'from-orange-500 to-orange-600',
      medium: 'from-yellow-500 to-yellow-600',
      low: 'from-blue-500 to-blue-600',
      expiring: 'from-purple-500 to-purple-600',
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" showLabel label="Loading alerts..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Inventory Alerts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor low stock, expiring items, and reorder suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : '')}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : '')}
            >
              Grid View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={exportAlerts}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchAlerts()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Critical</p>
                <p className="text-2xl font-bold">{summary.critical}</p>
              </div>
              <Flame className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">High</p>
                <p className="text-2xl font-bold">{summary.high}</p>
              </div>
              <AlertTriangle className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Medium</p>
                <p className="text-2xl font-bold">{summary.medium}</p>
              </div>
              <AlertCircle className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Low Stock</p>
                <p className="text-2xl font-bold">{summary.lowStock}</p>
              </div>
              <Package className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Expiring</p>
                <p className="text-2xl font-bold">{summary.expiring}</p>
              </div>
              <Calendar className="w-8 h-8 opacity-80" />
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Out of Stock</p>
                <p className="text-2xl font-bold">{summary.outOfStock}</p>
              </div>
              <PackageX className="w-8 h-8 opacity-80" />
            </div>
          </Card>
        </div>
      )}

      {/* Reorder Suggestions Section */}
      {reorderSuggestions.length > 0 && (
        <Card title="Auto-Generated Reorder Suggestions" className="border-l-4 border-l-green-500">
          <div className="space-y-2">
            {reorderSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{suggestion.itemName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {suggestion.currentQuantity} | Suggested: {suggestion.suggestedQuantity} | {suggestion.reason}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => openSuggestionModal(suggestion)}>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Create PO
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name, message, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="overstock">Overstock</option>
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setSeverityFilter('');
              setTypeFilter('');
              setReadFilter('all');
            }}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-400"
          >
            Clear
          </button>
        </div>
      </Card>

      {/* Alerts List/Grid */}
      {filteredAlerts.length === 0 ? (
        <Card className="text-center py-12">
          <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
          <p className="text-sm text-gray-400 mt-1">All inventory levels are normal</p>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Alert</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAlerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <tr 
                      className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer', !alert.isRead && 'bg-amber-50 dark:bg-amber-950/10')}
                      onClick={() => setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {alertTypeConfig[alert.type]?.icon}
                          <span className="text-sm text-gray-900 dark:text-white">{alert.message}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{alert.itemName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm">{alert.currentQuantity}</span>
                          {alert.reorderLevel && (
                            <span className="text-xs text-gray-500">Min: {alert.reorderLevel}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', urgencyConfig[alert.severity]?.color)}>
                          {urgencyConfig[alert.severity]?.icon}
                          {urgencyConfig[alert.severity]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {alertTypeConfig[alert.type]?.icon}
                          {alertTypeConfig[alert.type]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {alert.isRead ? (
                          <span className="text-xs text-gray-500">Read</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <Bell className="w-3 h-3" />
                            New
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {!alert.isRead && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); markRead(alert); }}>
                            <Eye className="w-3 h-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); openOrderModal(alert); }}>
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Reorder
                        </Button>
                      </td>
                    </tr>
                    {expandedAlertId === alert.id && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="text-sm space-y-2">
                            <p><strong>Details:</strong> {alert.details || alert.message}</p>
                            {alert.suggestedAction && (
                              <p><strong>Suggested Action:</strong> {alert.suggestedAction}</p>
                            )}
                            {alert.createdAt && (
                              <p className="text-xs text-gray-500">Created: {new Date(alert.createdAt).toLocaleString()}</p>
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
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className={clsx('cursor-pointer hover:shadow-lg transition', !alert.isRead && 'border-l-4 border-l-amber-500')}>
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('p-2 rounded-lg', urgencyConfig[alert.severity]?.color)}>
                  {urgencyConfig[alert.severity]?.icon}
                </div>
                {!alert.isRead && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{alert.itemName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{alert.message}</p>
              <div className="flex items-center justify-between text-sm mb-3">
                <span>Current: <strong>{alert.currentQuantity}</strong></span>
                {alert.reorderLevel && <span>Min: {alert.reorderLevel}</span>}
              </div>
              <div className="flex gap-2">
                {!alert.isRead && (
                  <Button size="sm" variant="outline" fullWidth onClick={() => markRead(alert)}>
                    <Eye className="w-3 h-3 mr-1" />
                    Mark Read
                  </Button>
                )}
                <Button size="sm" fullWidth onClick={() => openOrderModal(alert)}>
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Reorder
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reorder Modal */}
      <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="Create Purchase Order" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item</label>
              <input 
                value={selectedAlert?.itemName || selectedSuggestion?.itemName || ''} 
                disabled 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
              <input
                type="number"
                value={orderQty}
                onChange={(e) => setOrderQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowOrderModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitReorder}>Create Purchase Order</Button>
        </div>
      </Modal>
    </div>
  );
}