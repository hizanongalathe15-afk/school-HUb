// client/src/components/roles/storekeeper/StoreKeeperStockTakePage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Upload, RefreshCcw, Download, CheckCircle2, XCircle, AlertTriangle,
  ClipboardList, FileText, Printer, Eye, Search, Filter, Calendar,
  Clock, User, Package, DollarSign, TrendingUp, TrendingDown,
  Plus, Edit, Trash2, ChevronDown, ChevronUp, MoreVertical,
  BarChart3, PieChart, LineChart, Activity, Shield, AlertCircle,
  CheckCircle, X, Save, RotateCcw, Barcode, Scan, Tablet
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import toast from 'react-hot-toast';
import storeKeeperService from '../../../services/storeKeeperService';
import { clsx } from 'clsx';

interface StockTake {
  id: string;
  name: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type: 'full' | 'partial';
  categories?: string[];
  startDate: string;
  endDate?: string;
  createdBy: string;
  frozen?: boolean;
  totalItems: number;
  countedItems: number;
  discrepancies: number;
}

interface CountSheet {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  category: string;
  location: string;
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;
  varianceAmount: number;
  status: 'pending' | 'counted' | 'verified' | 'adjusted';
  countedBy: string;
  countedAt?: string;
  verifiedBy?: string;
  notes?: string;
  barcodeScanned?: string;
}

const stockTakeStatusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: <Edit className="w-3 h-3" /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" /> },
};

export default function StoreKeeperStockTakePage() {
  const [loading, setLoading] = useState(false);
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [activeStockTake, setActiveStockTake] = useState<StockTake | null>(null);
  const [countSheets, setCountSheets] = useState<CountSheet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CountSheet | null>(null);
  const [physicalCount, setPhysicalCount] = useState(0);
  const [countNotes, setCountNotes] = useState('');
  const [stockTakeName, setStockTakeName] = useState('');
  const [stockTakeType, setStockTakeType] = useState<'full' | 'partial'>('full');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const categories = [
    'Stationery', 'Textbooks', 'Uniforms', 'Sports Equipment', 
    'Laboratory Equipment', 'Computer Lab', 'Library Books', 'Furniture',
    'Cleaning Supplies', 'Kitchen/Dining', 'Medical Supplies', 'Electronics'
  ];

  const fetchStockTakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await storeKeeperService.stockTake.getStockTakes({ status: statusFilter || undefined });
      setStockTakes(response.data || []);
    } catch (error) {
      console.error('Failed to load stock takes:', error);
      toast.error('Failed to load stock takes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchStockTakes();
  }, [fetchStockTakes]);

  const fetchCountSheets = async (stockTakeId: string) => {
    setLoading(true);
    try {
      const response = await storeKeeperService.stockTake.getCountSheets(stockTakeId);
      setCountSheets(response.data || []);
    } catch (error) {
      console.error('Failed to load count sheets:', error);
      toast.error('Failed to load count sheets');
    } finally {
      setLoading(false);
    }
  };

  const startStockTake = async () => {
    if (!stockTakeName.trim()) {
      toast.error('Stock take name is required');
      return;
    }
    setProcessingId('create');
    try {
      const response = await storeKeeperService.stockTake.createStockTake({
        name: stockTakeName,
        type: stockTakeType,
        categories: stockTakeType === 'partial' ? selectedCategories : undefined,
      });
      toast.success('Stock take started successfully');
      setShowCreateModal(false);
      setStockTakeName('');
      setSelectedCategories([]);
      setStockTakeType('full');
      fetchStockTakes();
      
      // Set as active stock take
      setActiveStockTake(response.data);
      fetchCountSheets(response.data.id);
    } catch (error) {
      console.error('Failed to start stock take:', error);
      toast.error('Failed to start stock take');
    } finally {
      setProcessingId(null);
    }
  };

  const recordPhysicalCount = async () => {
    if (!selectedItem) return;
    setProcessingId(selectedItem.id);
    try {
      await storeKeeperService.stockTake.recordCount({
        stockTakeId: activeStockTake!.id,
        itemId: selectedItem.itemId,
        physicalQuantity: physicalCount,
        notes: countNotes,
      });
      toast.success(`Count recorded for ${selectedItem.itemName}`);
      setShowCountModal(false);
      setSelectedItem(null);
      setPhysicalCount(0);
      setCountNotes('');
      fetchCountSheets(activeStockTake!.id);
    } catch (error) {
      console.error('Failed to record count:', error);
      toast.error('Failed to record count');
    } finally {
      setProcessingId(null);
    }
  };

  const applyAdjustment = async () => {
    if (!selectedItem) return;
    setProcessingId(selectedItem.id);
    try {
      await storeKeeperService.stockTake.applyAdjustment({
        stockTakeId: activeStockTake!.id,
        itemId: selectedItem.itemId,
        newQuantity: selectedItem.physicalQuantity,
        reason: adjustmentReason,
      });
      toast.success(`Stock adjusted for ${selectedItem.itemName}`);
      setShowReconciliationModal(false);
      setSelectedItem(null);
      setAdjustmentReason('');
      fetchCountSheets(activeStockTake!.id);
    } catch (error) {
      console.error('Failed to apply adjustment:', error);
      toast.error('Failed to apply adjustment');
    } finally {
      setProcessingId(null);
    }
  };

  const completeStockTake = async () => {
    if (!activeStockTake) return;
    if (!confirm('Are you sure you want to complete this stock take? This will apply all pending adjustments.')) return;
    
    setProcessingId(activeStockTake.id);
    try {
      await storeKeeperService.stockTake.completeStockTake(activeStockTake.id);
      toast.success('Stock take completed');
      setActiveStockTake(null);
      setCountSheets([]);
      fetchStockTakes();
    } catch (error) {
      console.error('Failed to complete stock take:', error);
      toast.error('Failed to complete stock take');
    } finally {
      setProcessingId(null);
    }
  };

  const exportVarianceReport = async () => {
    if (!activeStockTake) return;
    try {
      const response = await storeKeeperService.stockTake.exportVarianceReport(activeStockTake.id);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `variance_report_${activeStockTake.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Variance report exported');
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  const exportCountSheets = async () => {
    if (!activeStockTake) return;
    try {
      const response = await storeKeeperService.stockTake.exportCountSheets(activeStockTake.id);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `count_sheets_${activeStockTake.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Count sheets exported');
    } catch (error) {
      console.error('Failed to export count sheets:', error);
      toast.error('Failed to export count sheets');
    }
  };

  const importCounts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeStockTake) return;
    
    setLoading(true);
    try {
      await storeKeeperService.stockTake.importCounts(activeStockTake.id, file);
      toast.success('Counts imported successfully');
      fetchCountSheets(activeStockTake.id);
    } catch (error) {
      console.error('Failed to import counts:', error);
      toast.error('Failed to import counts');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const filteredCountSheets = useMemo(() => {
    return countSheets.filter(sheet => {
      const matchesSearch = sheet.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sheet.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sheet.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || sheet.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [countSheets, searchTerm, statusFilter]);

  const statistics = useMemo(() => {
    const totalItems = countSheets.length;
    const countedItems = countSheets.filter(s => s.status !== 'pending').length;
    const verifiedItems = countSheets.filter(s => s.status === 'verified').length;
    const discrepancies = countSheets.filter(s => s.variance !== 0).length;
    const totalVariance = countSheets.reduce((sum, s) => sum + Math.abs(s.variance), 0);
    const totalVarianceValue = countSheets.reduce((sum, s) => sum + Math.abs(s.varianceAmount), 0);
    const positiveVariance = countSheets.filter(s => s.variance > 0).length;
    const negativeVariance = countSheets.filter(s => s.variance < 0).length;
    
    return { totalItems, countedItems, verifiedItems, discrepancies, totalVariance, totalVarianceValue, positiveVariance, negativeVariance };
  }, [countSheets]);

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-green-600';
    if (variance < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  if (loading && stockTakes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading stock take data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Stock Take & Audit
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Perform physical counts, reconcile discrepancies, and manage inventory accuracy
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStockTakes}>
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Stock Take
          </Button>
        </div>
      </div>

      {/* Stock Take History Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stockTakes.map(stockTake => {
          const status = stockTakeStatusConfig[stockTake.status as keyof typeof stockTakeStatusConfig];
          const progress = stockTake.totalItems > 0 ? (stockTake.countedItems / stockTake.totalItems) * 100 : 0;
          
          return (
            <Card 
              key={stockTake.id} 
              className={clsx(
                'cursor-pointer hover:shadow-lg transition',
                activeStockTake?.id === stockTake.id && 'ring-2 ring-blue-500'
              )}
              onClick={() => {
                setActiveStockTake(stockTake);
                fetchCountSheets(stockTake.id);
              }}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stockTake.name}</h3>
                  <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status?.color)}>
                    {status?.icon}
                    {status?.label}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-500">Started: {new Date(stockTake.startDate).toLocaleDateString()}</p>
                  <p className="text-gray-500">Created by: {stockTake.createdBy}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{stockTake.countedItems}/{stockTake.totalItems} counted</span>
                    <span>{stockTake.discrepancies} discrepancies</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {stockTakes.length === 0 && (
        <Card className="text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No stock takes found</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Start Your First Stock Take
          </Button>
        </Card>
      )}

      {/* Active Stock Take Section */}
      {activeStockTake && (
        <div className="space-y-6">
          {/* Active Stock Take Header */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-400">
                  Active: {activeStockTake.name}
                </h2>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Started on {new Date(activeStockTake.startDate).toLocaleString()}
                  {activeStockTake.frozen && " - Inventory Frozen"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={exportCountSheets}>
                  <Download className="w-4 h-4 mr-1" />
                  Export Sheets
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept=".xlsx,.csv" onChange={importCounts} className="hidden" />
                  <Button size="sm" variant="outline" type="button">
                    <Upload className="w-4 h-4 mr-1" />
                    Import Counts
                  </Button>
                </label>
                {activeStockTake.status === 'in_progress' && (
                  <Button size="sm" onClick={completeStockTake} disabled={processingId === activeStockTake.id}>
                    {processingId === activeStockTake.id ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                    Complete Stock Take
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{statistics.totalItems}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </Card>
            <Card className="text-center border-l-4 border-l-green-500">
              <p className="text-2xl font-bold text-green-600">{statistics.countedItems}</p>
              <p className="text-xs text-gray-500">Counted</p>
            </Card>
            <Card className="text-center border-l-4 border-l-yellow-500">
              <p className="text-2xl font-bold text-yellow-600">{statistics.discrepancies}</p>
              <p className="text-xs text-gray-500">Discrepancies</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{statistics.positiveVariance}</p>
              <p className="text-xs text-gray-500">Over (+)</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-red-600">{statistics.negativeVariance}</p>
              <p className="text-xs text-gray-500">Short (-)</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-purple-600">{statistics.totalVariance}</p>
              <p className="text-xs text-gray-500">Total Units</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-orange-600">KES {statistics.totalVarianceValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Variance Value</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Count</option>
              <option value="counted">Counted</option>
              <option value="verified">Verified</option>
              <option value="adjusted">Adjusted</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}>
              Clear
            </Button>
          </div>

          {/* Count Sheets Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr className="text-left text-sm">
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Location</th>
                    <th className="px-4 py-3 font-semibold text-right">System Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Physical Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Variance</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCountSheets.map((sheet) => (
                    <tr key={sheet.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3 font-medium">{sheet.itemName}</td>
                      <td className="px-4 py-3 text-sm font-mono">{sheet.itemCode}</td>
                      <td className="px-4 py-3 text-sm">{sheet.location}</td>
                      <td className="px-4 py-3 text-right">{sheet.systemQuantity}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {sheet.physicalQuantity !== undefined ? sheet.physicalQuantity : '-'}
                      </td>
                      <td className={clsx('px-4 py-3 text-right font-semibold', getVarianceColor(sheet.variance))}>
                        {sheet.variance !== 0 ? `${sheet.variance > 0 ? '+' : ''}${sheet.variance}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          sheet.status === 'pending' && 'bg-gray-100 text-gray-800',
                          sheet.status === 'counted' && 'bg-yellow-100 text-yellow-800',
                          sheet.status === 'verified' && 'bg-green-100 text-green-800',
                          sheet.status === 'adjusted' && 'bg-blue-100 text-blue-800'
                        )}>
                          {sheet.status === 'pending' && <Clock className="w-3 h-3" />}
                          {sheet.status === 'counted' && <CheckCircle className="w-3 h-3" />}
                          {sheet.status === 'verified' && <Shield className="w-3 h-3" />}
                          {sheet.status === 'adjusted' && <CheckCircle2 className="w-3 h-3" />}
                          {sheet.status}
                        </span>
                       </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {sheet.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedItem(sheet);
                                setPhysicalCount(sheet.systemQuantity);
                                setCountNotes('');
                                setShowCountModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Record Count"
                            >
                              <ClipboardList className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {sheet.variance !== 0 && sheet.status !== 'adjusted' && (
                            <button
                              onClick={() => {
                                setSelectedItem(sheet);
                                setAdjustmentReason('');
                                setShowReconciliationModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Reconcile"
                            >
                              <RotateCcw className="w-4 h-4 text-orange-500" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedItem(sheet);
                              setShowVarianceModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Progress Summary */}
          <Card>
            <div className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Stock Take Progress</span>
                <span className="text-sm text-gray-500">{Math.round((statistics.countedItems / statistics.totalItems) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${(statistics.countedItems / statistics.totalItems) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-500">
                <span>Counted: {statistics.countedItems}</span>
                <span>Remaining: {statistics.totalItems - statistics.countedItems}</span>
                <span>Discrepancies: {statistics.discrepancies}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Stock Take Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Start New Stock Take" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stock Take Name</label>
            <input
              type="text"
              value={stockTakeName}
              onChange={(e) => setStockTakeName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Term 1 2026 Stock Take"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stock Take Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="full"
                  checked={stockTakeType === 'full'}
                  onChange={() => setStockTakeType('full')}
                />
                <span>Full Stock Take (All Items)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="partial"
                  checked={stockTakeType === 'partial'}
                  onChange={() => setStockTakeType('partial')}
                />
                <span>Partial Stock Take (Selected Categories)</span>
              </label>
            </div>
          </div>
          {stockTakeType === 'partial' && (
            <div>
              <label className="block text-sm font-medium mb-1">Select Categories</label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={cat}
                      checked={selectedCategories.includes(cat)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== cat));
                        }
                      }}
                    />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Starting a stock take will freeze inventory transactions (no issues or returns allowed until completed).
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
          <Button onClick={startStockTake} disabled={processingId === 'create'}>
            {processingId === 'create' ? <Spinner size="sm" /> : <ClipboardList className="w-4 h-4 mr-1" />}
            Start Stock Take
          </Button>
        </div>
      </Modal>

      {/* Record Count Modal */}
      <Modal isOpen={showCountModal} onClose={() => setShowCountModal(false)} title="Record Physical Count" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedItem.itemName}</p>
              <p className="text-sm text-gray-500">Code: {selectedItem.itemCode}</p>
              <p className="text-sm text-gray-500">Location: {selectedItem.location}</p>
              <p className="text-sm">System Quantity: <span className="font-bold">{selectedItem.systemQuantity}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Physical Count</label>
              <input
                type="number"
                value={physicalCount}
                onChange={(e) => setPhysicalCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg text-lg font-bold"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Any observations during counting..."
              />
            </div>
            {physicalCount !== selectedItem.systemQuantity && (
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-600" />
                Variance: {physicalCount - selectedItem.systemQuantity} units
                {Math.abs(physicalCount - selectedItem.systemQuantity) > 5 && (
                  <p className="mt-1 text-red-600">Large variance detected. Please verify count.</p>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowCountModal(false)}>Cancel</Button>
          <Button onClick={recordPhysicalCount} disabled={processingId === selectedItem?.id}>
            {processingId === selectedItem?.id ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
            Save Count
          </Button>
        </div>
      </Modal>

      {/* Reconciliation Modal */}
      <Modal isOpen={showReconciliationModal} onClose={() => setShowReconciliationModal(false)} title="Reconcile Discrepancy" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedItem.itemName}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <span>System Quantity:</span>
                <span className="font-bold">{selectedItem.systemQuantity}</span>
                <span>Physical Count:</span>
                <span className="font-bold">{selectedItem.physicalQuantity}</span>
                <span>Variance:</span>
                <span className={clsx('font-bold', getVarianceColor(selectedItem.variance))}>
                  {selectedItem.variance > 0 ? '+' : ''}{selectedItem.variance}
                </span>
                <span>Variance Value:</span>
                <span className="font-bold">KES {selectedItem.varianceAmount?.toLocaleString() || 0}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adjustment Reason</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select a reason...</option>
                <option value="counting_error">Counting Error</option>
                <option value="data_entry_error">Data Entry Error</option>
                <option value="theft">Theft/Suspected Theft</option>
                <option value="damage">Damage/Write-off</option>
                <option value="misplacement">Misplacement</option>
                <option value="receiving_error">Receiving Error</option>
                <option value="issuing_error">Issuing Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Additional Notes</label>
              <textarea
                value={reconciliationNotes}
                onChange={(e) => setReconciliationNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Explain the discrepancy..."
              />
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              This adjustment will update the system stock quantity to match the physical count.
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowReconciliationModal(false)}>Cancel</Button>
          <Button onClick={applyAdjustment} disabled={processingId === selectedItem?.id} className="bg-orange-600 hover:bg-orange-700">
            {processingId === selectedItem?.id ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4 mr-1" />}
            Apply Adjustment
          </Button>
        </div>
      </Modal>

      {/* Variance Details Modal */}
      <Modal isOpen={showVarianceModal} onClose={() => setShowVarianceModal(false)} title="Item Details" size="md">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Item Name</p>
                <p className="font-medium">{selectedItem.itemName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Item Code</p>
                <p className="font-mono">{selectedItem.itemCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p>{selectedItem.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p>{selectedItem.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">System Quantity</p>
                <p className="text-xl font-bold">{selectedItem.systemQuantity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Physical Quantity</p>
                <p className="text-xl font-bold">{selectedItem.physicalQuantity || 'Not counted'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Variance</p>
                <p className={clsx('text-xl font-bold', getVarianceColor(selectedItem.variance))}>
                  {selectedItem.variance !== 0 ? `${selectedItem.variance > 0 ? '+' : ''}${selectedItem.variance}` : '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="capitalize">{selectedItem.status}</p>
              </div>
            </div>
            {selectedItem.countedBy && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-500">Counted by: {selectedItem.countedBy}</p>
                <p className="text-sm text-gray-500">Counted at: {selectedItem.countedAt && new Date(selectedItem.countedAt).toLocaleString()}</p>
              </div>
            )}
            {selectedItem.notes && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm">{selectedItem.notes}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button onClick={() => setShowVarianceModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
}