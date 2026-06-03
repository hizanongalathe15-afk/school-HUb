import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ArrowUpDown,
  Trash2,
  RotateCcw,
  Filter,
  Download,
  Eye,
  Calendar,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  Printer,
  Mail,
  User,
  Building2,
  Truck,
  PackageCheck,
  PackageX,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  AlertTriangle,
  Info,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Target,
  Flag,
  Star,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { StockMovement, MovementSummary } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface IssueForm {
  itemId: string;
  itemName: string;
  quantity: number;
  issuedToType: 'teacher' | 'student' | 'staff' | 'department';
  issuedToName: string;
  department: string;
  purpose: string;
  notes: string;
}

interface AdjustmentForm {
  itemId: string;
  itemName: string;
  quantity: number;
  adjustmentType: 'increase' | 'decrease';
  reason: 'damage' | 'loss' | 'found' | 'correction' | 'return';
  notes: string;
}

const movementTypeConfig = {
  issue: { label: 'Issue', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Package className="w-3 h-3" /> },
  receive: { label: 'Receive', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <Truck className="w-3 h-3" /> },
  return: { label: 'Return', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: <RotateCcw className="w-3 h-3" /> },
  adjustment: { label: 'Adjustment', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Edit className="w-3 h-3" /> },
  write_off: { label: 'Write-off', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <Trash2 className="w-3 h-3" /> },
  transfer: { label: 'Transfer', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400', icon: <ArrowUpDown className="w-3 h-3" /> },
};

const StoreKeeperMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<MovementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
  const [issueForm, setIssueForm] = useState<IssueForm>({
    itemId: '',
    itemName: '',
    quantity: 1,
    issuedToType: 'teacher',
    issuedToName: '',
    department: '',
    purpose: '',
    notes: ''
  });
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentForm>({
    itemId: '',
    itemName: '',
    quantity: 1,
    adjustmentType: 'decrease',
    reason: 'damage',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [movementsRes, summaryRes, itemsRes] = await Promise.all([
        storeKeeperService.movements.getMovements({ type: filterType || undefined, startDate: dateRange.start || undefined, endDate: dateRange.end || undefined }),
        storeKeeperService.movements.getMovementSummary(),
        storeKeeperService.inventory.getInventory()
      ]);
      setMovements(movementsRes.data || []);
      setSummary(summaryRes.data || null);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error('Failed to load movements:', error);
      toast.error('Failed to load movements');
    } finally {
      setLoading(false);
    }
  }, [filterType, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = (m.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (m.referenceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (m.performedByName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [movements, searchTerm]);

  const statistics = useMemo(() => {
    if (!summary) return null;
    return {
      totalIssues: summary.totalIssues || 0,
      totalReceives: summary.totalReceives || 0,
      totalReturns: summary.totalReturns || 0,
      totalAdjustments: summary.totalAdjustments || 0,
      totalWriteoffs: summary.totalWriteoffs || 0,
      totalValue: summary.totalValue || 0,
      netMovement: (summary.totalIssues || 0) - (summary.totalReturns || 0)
    };
  }, [summary]);

  const submitIssue = async () => {
    if (!issueForm.itemId) {
      toast.error('Please select an item');
      return;
    }
    if (issueForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!issueForm.issuedToName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    setSubmitting(true);
    try {
      await storeKeeperService.movements.issueItems({
        itemId: issueForm.itemId,
        quantity: issueForm.quantity,
        issuedToType: issueForm.issuedToType,
        issuedToName: issueForm.issuedToName,
        department: issueForm.department,
        purpose: issueForm.purpose,
        notes: issueForm.notes
      });
      toast.success('Item issued successfully');
      setShowIssueModal(false);
      setIssueForm({
        itemId: '',
        itemName: '',
        quantity: 1,
        issuedToType: 'teacher',
        issuedToName: '',
        department: '',
        purpose: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to issue item:', error);
      toast.error('Failed to issue item');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjustment = async () => {
    if (!adjustmentForm.itemId) {
      toast.error('Please select an item');
      return;
    }
    if (adjustmentForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await storeKeeperService.movements.adjustStock({
        itemId: adjustmentForm.itemId,
        quantity: adjustmentForm.quantity,
        adjustmentType: adjustmentForm.adjustmentType,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes
      });
      toast.success(`Stock ${adjustmentForm.adjustmentType === 'increase' ? 'increased' : 'decreased'} successfully`);
      setShowAdjustmentModal(false);
      setAdjustmentForm({
        itemId: '',
        itemName: '',
        quantity: 1,
        adjustmentType: 'decrease',
        reason: 'damage',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error('Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const processReturn = async (movementId: string, itemId: string, quantity: number) => {
    if (!confirm(`Return ${quantity} item(s) to stock?`)) return;
    try {
      await storeKeeperService.movements.returnItems({
        movementId,
        itemId,
        quantity,
        condition: 'good',
        notes: 'Returned from issued items'
      });
      toast.success('Items returned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to process return:', error);
      toast.error('Failed to process return');
    }
  };

  const exportMovements = () => {
    const csv = [
      ['Date', 'Type', 'Item', 'Quantity', 'Reference', 'Performed By', 'Notes'],
      ...filteredMovements.map(m => [
        new Date(m.createdAt).toLocaleDateString(),
        m.type,
        m.itemName,
        m.quantity,
        m.referenceNumber || '',
        m.performedByName || '',
        m.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_movements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading stock movements..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-blue-600" />
            Stock Movements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track all inventory transactions including issues, returns, and adjustments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportMovements}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowIssueModal(true)}>
            <Package className="w-4 h-4 mr-1" />
            Issue Item
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAdjustmentModal(true)}>
            <Edit className="w-4 h-4 mr-1" />
            Adjust Stock
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{statistics.totalIssues}</p>
            <p className="text-xs text-gray-500">Issues</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{statistics.totalReceives}</p>
            <p className="text-xs text-gray-500">Receives</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{statistics.totalReturns}</p>
            <p className="text-xs text-gray-500">Returns</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{statistics.totalAdjustments}</p>
            <p className="text-xs text-gray-500">Adjustments</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-600">{statistics.totalWriteoffs}</p>
            <p className="text-xs text-gray-500">Write-offs</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900">{statistics.totalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Value (KES)</p>
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
              placeholder="Search by item name, reference, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Types</option>
            <option value="issue">Issue</option>
            <option value="receive">Receive</option>
            <option value="return">Return</option>
            <option value="adjustment">Adjustment</option>
            <option value="write_off">Write-off</option>
            <option value="transfer">Transfer</option>
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
              setFilterType('');
              setDateRange({ start: '', end: '' });
            }}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Movements Table */}
      {filteredMovements.length === 0 ? (
        <Card className="text-center py-12">
          <ArrowUpDown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No stock movements found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Performed By</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMovements.map((movement) => {
                  const config = movementTypeConfig[movement.type as keyof typeof movementTypeConfig] || movementTypeConfig.issue;
                  return (
                    <React.Fragment key={movement.id}>
                      <tr 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                        onClick={() => setExpandedId(expandedId === movement.id ? null : movement.id)}
                      >
                        <td className="px-4 py-3 text-sm">
                          {new Date(movement.createdAt).toLocaleDateString()}
                          <div className="text-xs text-gray-400">{new Date(movement.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
                            {config.icon}
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{movement.itemName}</p>
                            {movement.itemCode && <p className="text-xs text-gray-400">{movement.itemCode}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{movement.quantity} {movement.unit}</td>
                        <td className="px-4 py-3 text-sm font-mono">{movement.referenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm">{movement.performedByName || '-'}</td>
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => {
                              setSelectedMovement(movement);
                              setShowDetailModal(true);
                            }}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            {movement.type === 'issue' && movement.quantity > 0 && (
                              <Button size="sm" variant="outline" onClick={() => processReturn(movement.id, movement.itemId, movement.quantity)}>
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === movement.id && (
                        <tr className="bg-gray-50 dark:bg-gray-800/50">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {movement.issuedToName && (
                                <div>
                                  <p className="text-gray-500">Issued To</p>
                                  <p className="font-medium">{movement.issuedToName}</p>
                                  <p className="text-xs text-gray-400 capitalize">{movement.issuedToType}</p>
                                </div>
                              )}
                              {movement.department && (
                                <div>
                                  <p className="text-gray-500">Department</p>
                                  <p className="font-medium">{movement.department}</p>
                                </div>
                              )}
                              {movement.purpose && (
                                <div>
                                  <p className="text-gray-500">Purpose</p>
                                  <p className="font-medium">{movement.purpose}</p>
                                </div>
                              )}
                              {movement.fromLocation && movement.toLocation && (
                                <>
                                  <div>
                                    <p className="text-gray-500">From Location</p>
                                    <p className="font-medium">{movement.fromLocation}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">To Location</p>
                                    <p className="font-medium">{movement.toLocation}</p>
                                  </div>
                                </>
                              )}
                              {movement.reason && (
                                <div>
                                  <p className="text-gray-500">Reason</p>
                                  <p className="font-medium capitalize">{movement.reason}</p>
                                </div>
                              )}
                            </div>
                            {movement.notes && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500">Notes</p>
                                <p className="text-sm">{movement.notes}</p>
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
      )}

      {/* Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue Item" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Item *</label>
            <select
              value={issueForm.itemId}
              onChange={(e) => {
                const item = items.find(i => i.id === e.target.value);
                setIssueForm({
                  ...issueForm,
                  itemId: e.target.value,
                  itemName: item?.name || ''
                });
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select item</option>
              {items.filter(i => i.quantity > 0).map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - {item.quantity} {item.unit} available
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
              <input
                type="number"
                value={issueForm.quantity}
                onChange={(e) => setIssueForm({ ...issueForm, quantity: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issued To Type</label>
              <select
                value={issueForm.issuedToType}
                onChange={(e) => setIssueForm({ ...issueForm, issuedToType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="department">Department</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name *</label>
              <input
                value={issueForm.issuedToName}
                onChange={(e) => setIssueForm({ ...issueForm, issuedToName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., John Mwangi, Form 3A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input
                value={issueForm.department}
                onChange={(e) => setIssueForm({ ...issueForm, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Science Department"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
              <input
                value={issueForm.purpose}
                onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Classroom use, Laboratory work"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowIssueModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitIssue} isLoading={submitting}>Issue Item</Button>
        </div>
      </Modal>

      {/* Adjustment Modal */}
      <Modal isOpen={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} title="Adjust Stock" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Item *</label>
            <select
              value={adjustmentForm.itemId}
              onChange={(e) => {
                const item = items.find(i => i.id === e.target.value);
                setAdjustmentForm({
                  ...adjustmentForm,
                  itemId: e.target.value,
                  itemName: item?.name || ''
                });
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} - Current: {item.quantity} {item.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adjustment Type</label>
              <select
                value={adjustmentForm.adjustmentType}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, adjustmentType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="decrease">Decrease Stock (-)</option>
                <option value="increase">Increase Stock (+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
              <input
                type="number"
                value={adjustmentForm.quantity}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
              <select
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="damage">Damage</option>
                <option value="loss">Loss</option>
                <option value="found">Found</option>
                <option value="correction">Correction</option>
                <option value="return">Return to Supplier</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Explain the reason for adjustment..."
              />
            </div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Stock adjustments are permanent and will be recorded in audit logs. Please ensure accuracy.
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowAdjustmentModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitAdjustment} isLoading={submitting}>
            {adjustmentForm.adjustmentType === 'increase' ? 'Increase Stock' : 'Decrease Stock'}
          </Button>
        </div>
      </Modal>

      {/* Movement Details Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Movement Details" size="lg">
        {selectedMovement && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="font-medium">{new Date(selectedMovement.createdAt).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Type</p>
                <p className="font-medium capitalize">{selectedMovement.type}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Item</p>
                <p className="font-medium">{selectedMovement.itemName}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="font-medium">{selectedMovement.quantity} {selectedMovement.unit}</p>
              </div>
              {selectedMovement.referenceNumber && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500">Reference Number</p>
                  <p className="font-mono text-sm">{selectedMovement.referenceNumber}</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Performed By</p>
                <p className="font-medium">{selectedMovement.performedByName || '-'}</p>
              </div>
            </div>
            {selectedMovement.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm">{selectedMovement.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StoreKeeperMovementsPage;