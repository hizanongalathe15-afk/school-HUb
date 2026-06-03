// client/src/components/roles/storekeeper/StoreKeeperReturnsPage.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  RefreshCw, RotateCcw, Plus, Search, Filter, Download, Eye,
  CheckCircle, XCircle, AlertTriangle, Clock, Calendar, User,
  Package, DollarSign, Camera, FileText, Printer, Mail,
  Phone, MessageCircle, Flag, Trash2, Edit, ChevronDown,
  ChevronUp, MoreVertical, Shield, CreditCard, AlertCircle,
  TrendingUp, TrendingDown, Award, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { InventoryItem, ReturnTransaction, BorrowedItem } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface ReturnFormData {
  itemId: string;
  quantity: number;
  returnedBy: string;
  returnedById: string;
  returnerType: 'teacher' | 'student' | 'staff';
  condition: 'new' | 'good' | 'fair' | 'damaged' | 'unusable';
  damageType?: string;
  damageNotes?: string;
  repairCost?: number;
  replacementCost?: number;
  chargeFee?: boolean;
  feeAmount?: number;
  notes: string;
  receiptNumber?: string;
}

interface BorrowedItemWithDetails extends BorrowedItem {
  itemName: string;
  itemCode: string;
  itemValue: number;
  daysOverdue: number;
  lateFee: number;
}

const conditionConfig = {
  new: { label: 'New', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, multiplier: 1 },
  good: { label: 'Good', color: 'bg-blue-100 text-blue-800', icon: <Package className="w-3 h-3" />, multiplier: 0.9 },
  fair: { label: 'Fair', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-3 h-3" />, multiplier: 0.7 },
  damaged: { label: 'Damaged', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="w-3 h-3" />, multiplier: 0.4 },
  unusable: { label: 'Unusable', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" />, multiplier: 0 },
};

const damageTypes = [
  'Torn pages', 'Broken cover', 'Water damage', 'Missing parts',
  'Scratched/Dented', 'Electronic failure', 'Stained', 'Broken spine',
  'Loose pages', 'Bent', 'Other'
];

const returnerTypeIcons = {
  teacher: <User className="w-4 h-4" />,
  student: <User className="w-4 h-4" />,
  staff: <User className="w-4 h-4" />,
};

export default function StoreKeeperReturnsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItemWithDetails[]>([]);
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedBorrowed, setSelectedBorrowed] = useState<BorrowedItemWithDetails | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnTransaction | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [returnForm, setReturnForm] = useState<ReturnFormData>({
    itemId: '',
    quantity: 1,
    returnedBy: '',
    returnedById: '',
    returnerType: 'student',
    condition: 'good',
    damageType: '',
    damageNotes: '',
    repairCost: 0,
    replacementCost: 0,
    chargeFee: false,
    feeAmount: 0,
    notes: '',
    receiptNumber: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, borrowedRes, returnsRes] = await Promise.all([
        storeKeeperService.inventory.getInventory(),
        storeKeeperService.returns.getBorrowedItems({ overdueOnly: statusFilter === 'overdue' }),
        storeKeeperService.returns.getReturns({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          condition: typeFilter !== 'all' ? typeFilter : undefined
        })
      ]);
      setItems(itemsRes.data || []);
      setBorrowedItems(borrowedRes.data || []);
      setReturns(returnsRes.data || []);
    } catch (error) {
      console.error('Failed to load returns data:', error);
      toast.error('Failed to load returns data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredBorrowed = useMemo(() => {
    return borrowedItems.filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.borrowedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [borrowedItems, searchTerm]);

  const statistics = useMemo(() => {
    const totalBorrowed = borrowedItems.length;
    const overdue = borrowedItems.filter(i => i.daysOverdue > 0).length;
    const dueToday = borrowedItems.filter(i => i.dueDate === new Date().toISOString().split('T')[0]).length;
    const totalReturns = returns.length;
    const damagedReturns = returns.filter(r => r.condition === 'damaged' || r.condition === 'unusable').length;
    const totalLateFees = borrowedItems.reduce((sum, i) => sum + (i.lateFee || 0), 0);
    const totalRepairCosts = returns.reduce((sum, r) => sum + (r.repairCost || 0), 0);
    
    return { totalBorrowed, overdue, dueToday, totalReturns, damagedReturns, totalLateFees, totalRepairCosts };
  }, [borrowedItems, returns]);

  const submitReturn = async () => {
    if (!returnForm.itemId || returnForm.quantity <= 0 || !returnForm.returnedBy.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setProcessingId('return');
    try {
      const response = await storeKeeperService.returns.processReturn({
        itemId: returnForm.itemId,
        quantity: returnForm.quantity,
        returnedBy: returnForm.returnedBy,
        returnedById: returnForm.returnedById,
        returnerType: returnForm.returnerType,
        condition: returnForm.condition,
        damageType: returnForm.damageType,
        damageNotes: returnForm.damageNotes,
        repairCost: returnForm.repairCost,
        replacementCost: returnForm.replacementCost,
        chargeFee: returnForm.chargeFee,
        feeAmount: returnForm.feeAmount,
        notes: returnForm.notes,
      });
      
      toast.success(`Item returned successfully. ${returnForm.feeAmount ? `Fee: KES ${returnForm.feeAmount}` : ''}`);
      setShowReturnModal(false);
      resetReturnForm();
      fetchData();
      
      // Print receipt if needed
      if (returnForm.receiptNumber) {
        printReturnReceipt(response.data);
      }
    } catch (error) {
      console.error('Failed to process return:', error);
      toast.error('Failed to process return');
    } finally {
      setProcessingId(null);
    }
  };

  const processBorrowedReturn = async (borrowed: BorrowedItemWithDetails) => {
    setProcessingId(borrowed.id);
    try {
      const response = await storeKeeperService.returns.returnBorrowedItem(borrowed.id, {
        condition: returnForm.condition,
        damageNotes: returnForm.damageNotes,
        repairCost: returnForm.repairCost,
        chargeLateFee: true
      });
      
      toast.success(`Item "${borrowed.itemName}" returned successfully`);
      setShowDetailModal(false);
      resetReturnForm();
      fetchData();
    } catch (error) {
      console.error('Failed to return borrowed item:', error);
      toast.error('Failed to return item');
    } finally {
      setProcessingId(null);
    }
  };

  const sendOverdueReminder = async (borrowedId: string, method: 'sms' | 'email' | 'whatsapp') => {
    try {
      await storeKeeperService.returns.sendOverdueReminder(borrowedId, method);
      toast.success(`${method.toUpperCase()} reminder sent`);
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const bulkSendReminders = async () => {
    const overdueItems = borrowedItems.filter(i => i.daysOverdue > 0);
    if (overdueItems.length === 0) {
      toast.error('No overdue items found');
      return;
    }
    
    try {
      await storeKeeperService.returns.bulkSendReminders(overdueItems.map(i => i.id));
      toast.success(`Reminders sent to ${overdueItems.length} borrowers`);
    } catch (error) {
      console.error('Failed to send bulk reminders:', error);
      toast.error('Failed to send reminders');
    }
  };

  const blacklistBorrower = async (borrowerId: string) => {
    if (!confirm('Are you sure you want to blacklist this borrower?')) return;
    try {
      await storeKeeperService.returns.blacklistBorrower(borrowerId);
      toast.success('Borrower blacklisted');
      fetchData();
    } catch (error) {
      console.error('Failed to blacklist:', error);
      toast.error('Failed to blacklist borrower');
    }
  };

  const printReturnReceipt = (returnData: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Return Receipt - ${returnData.receiptNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .receipt { max-width: 400px; margin: 0 auto; }
              .details { margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .fee { color: red; font-weight: bold; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>RETURN RECEIPT</h2>
                <p>${returnData.receiptNumber}</p>
              </div>
              <div class="details">
                <p><strong>Item:</strong> ${returnData.itemName}</p>
                <p><strong>Quantity:</strong> ${returnData.quantity}</p>
                <p><strong>Condition:</strong> ${returnData.condition}</p>
                <p><strong>Returned By:</strong> ${returnData.returnedBy}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                ${returnData.repairCost ? `<p><strong>Repair Cost:</strong> KES ${returnData.repairCost}</p>` : ''}
                ${returnData.replacementCost ? `<p><strong>Replacement Cost:</strong> KES ${returnData.replacementCost}</p>` : ''}
                ${returnData.lateFee ? `<p class="fee"><strong>Late Fee:</strong> KES ${returnData.lateFee}</p>` : ''}
              </div>
              <div class="footer">
                <p>Store Keeper Signature: _________________</p>
                <p>Borrower Signature: _________________</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const resetReturnForm = () => {
    setReturnForm({
      itemId: '',
      quantity: 1,
      returnedBy: '',
      returnedById: '',
      returnerType: 'student',
      condition: 'good',
      damageType: '',
      damageNotes: '',
      repairCost: 0,
      replacementCost: 0,
      chargeFee: false,
      feeAmount: 0,
      notes: '',
      receiptNumber: ''
    });
  };

  const calculateLateFee = (daysOverdue: number, itemValue: number): number => {
    const dailyRate = 0.01; // 1% per day
    return Math.min(daysOverdue * itemValue * dailyRate, itemValue * 0.5); // Cap at 50% of item value
  };

  const exportReturns = () => {
    const csv = [
      ['Receipt #', 'Item', 'Quantity', 'Condition', 'Returned By', 'Date', 'Repair Cost', 'Replacement Cost', 'Late Fee'],
      ...returns.map(r => [
        r.receiptNumber,
        r.itemName,
        r.quantity,
        r.condition,
        r.returnedBy,
        new Date(r.createdAt).toLocaleDateString(),
        r.repairCost || 0,
        r.replacementCost || 0,
        r.lateFee || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `returns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading returns data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-blue-600" />
            Returns Processing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Process item returns, assess damages, and manage overdue items
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
          <Button variant="outline" size="sm" onClick={exportReturns}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowReturnModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Process Return
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalBorrowed}</p>
          <p className="text-xs text-gray-500">Currently Borrowed</p>
        </Card>
        <Card className="text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
          <p className="text-xs text-gray-500">Overdue</p>
        </Card>
        <Card className="text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{statistics.dueToday}</p>
          <p className="text-xs text-gray-500">Due Today</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{statistics.totalReturns}</p>
          <p className="text-xs text-gray-500">Total Returns</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-600">{statistics.damagedReturns}</p>
          <p className="text-xs text-gray-500">Damaged/Lost</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-purple-600">KES {statistics.totalLateFees.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Late Fees</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">KES {statistics.totalRepairCosts.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Repair Costs</p>
        </Card>
      </div>

      {/* Overdue Alert Banner */}
      {statistics.overdue > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-400">{statistics.overdue} Overdue Items</p>
              <p className="text-sm text-red-600 dark:text-red-300">Total late fees: KES {statistics.totalLateFees.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowOverdueModal(true)}>
              View Overdue
            </Button>
            <Button size="sm" onClick={bulkSendReminders}>
              <Mail className="w-4 h-4 mr-1" />
              Send All Reminders
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item, borrower, or receipt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Borrowed Items</option>
            <option value="overdue">Overdue Only</option>
            <option value="due_soon">Due Soon (7 days)</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Returns</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
            <option value="unusable">Unusable</option>
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            placeholder="From"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            placeholder="To"
          />
          <Button variant="outline" size="sm" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
            setDateRange({ start: '', end: '' });
          }}>
            Clear All
          </Button>
        </div>
      </Card>

      {/* Borrowed Items List */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Currently Borrowed Items</h2>
        <span className="text-sm text-gray-500">{filteredBorrowed.length} items</span>
      </div>

      {filteredBorrowed.length === 0 ? (
        <Card className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No borrowed items found</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Borrower</th>
                  <th className="px-4 py-3 font-semibold">Borrowed Date</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Late Fee</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredBorrowed.map((borrowed) => {
                  const isOverdue = borrowed.daysOverdue > 0;
                  const dueSoon = borrowed.daysOverdue <= 0 && borrowed.daysOverdue >= -7;
                  
                  return (
                    <tr key={borrowed.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{borrowed.itemName}</p>
                          <p className="text-xs text-gray-500">{borrowed.itemCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {returnerTypeIcons[borrowed.borrowerType as keyof typeof returnerTypeIcons]}
                          <span>{borrowed.borrowedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(borrowed.borrowedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-sm',
                          isOverdue && 'text-red-600 font-semibold',
                          dueSoon && 'text-yellow-600'
                        )}>
                          {new Date(borrowed.dueDate).toLocaleDateString()}
                          {isOverdue && <span className="block text-xs">({borrowed.daysOverdue} days overdue)</span>}
                          {dueSoon && <span className="block text-xs">Due soon</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          isOverdue ? 'bg-red-100 text-red-800' : dueSoon ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        )}>
                          {isOverdue ? <AlertTriangle className="w-3 h-3" /> : dueSoon ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isOverdue ? 'Overdue' : dueSoon ? 'Due Soon' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {borrowed.lateFee > 0 ? (
                          <span className="text-red-600 font-semibold">KES {borrowed.lateFee.toLocaleString()}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedBorrowed(borrowed);
                              setReturnForm({
                                ...returnForm,
                                itemId: borrowed.itemId,
                                quantity: borrowed.quantity,
                                returnedBy: borrowed.borrowedBy,
                                returnedById: borrowed.borrowedById
                              });
                              setShowDetailModal(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Process Return"
                          >
                            <RotateCcw className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => sendOverdueReminder(borrowed.id, 'sms')}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Send Reminder"
                          >
                            <Mail className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => blacklistBorrower(borrowed.borrowedById)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Blacklist"
                          >
                            <Shield className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBorrowed.map((borrowed) => {
            const isOverdue = borrowed.daysOverdue > 0;
            return (
              <Card key={borrowed.id} className={clsx('hover:shadow-lg transition', isOverdue && 'border-l-4 border-l-red-500')}>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{borrowed.itemName}</h3>
                    <span className={clsx(
                      'text-xs px-2 py-1 rounded-full',
                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    )}>
                      {isOverdue ? 'Overdue' : 'Active'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Borrower:</span> {borrowed.borrowedBy}</p>
                    <p><span className="text-gray-500">Due:</span> {new Date(borrowed.dueDate).toLocaleDateString()}</p>
                    {isOverdue && (
                      <p className="text-red-600">Late Fee: KES {borrowed.lateFee?.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => {
                      setSelectedBorrowed(borrowed);
                      setShowDetailModal(true);
                    }}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Return
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendOverdueReminder(borrowed.id, 'sms')}>
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Return Item Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Process Item Return" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Select Item</label>
            <select
              value={returnForm.itemId}
              onChange={(e) => {
                const item = items.find(i => i.id === e.target.value);
                setSelectedItem(item || null);
                setReturnForm({ ...returnForm, itemId: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Choose an item...</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>{item.name} - {item.quantity} available</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                max={selectedItem?.quantity || 1}
                value={returnForm.quantity}
                onChange={(e) => setReturnForm({ ...returnForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <select
                value={returnForm.condition}
                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
                <option value="unusable">Unusable</option>
              </select>
            </div>
          </div>

          {(returnForm.condition === 'damaged' || returnForm.condition === 'unusable') && (
            <div className="space-y-3 border-t pt-3">
              <h4 className="font-medium text-red-600">Damage Assessment</h4>
              <div>
                <label className="block text-sm font-medium mb-1">Damage Type</label>
                <select
                  value={returnForm.damageType}
                  onChange={(e) => setReturnForm({ ...returnForm, damageType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select damage type...</option>
                  {damageTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Damage Notes</label>
                <textarea
                  value={returnForm.damageNotes}
                  onChange={(e) => setReturnForm({ ...returnForm, damageNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Describe the damage in detail..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Repair Cost (KES)</label>
                  <input
                    type="number"
                    value={returnForm.repairCost}
                    onChange={(e) => setReturnForm({ ...returnForm, repairCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Replacement Cost (KES)</label>
                  <input
                    type="number"
                    value={returnForm.replacementCost}
                    onChange={(e) => setReturnForm({ ...returnForm, replacementCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Returned By</label>
              <input
                type="text"
                value={returnForm.returnedBy}
                onChange={(e) => setReturnForm({ ...returnForm, returnedBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Returner Type</label>
              <select
                value={returnForm.returnerType}
                onChange={(e) => setReturnForm({ ...returnForm, returnerType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={returnForm.chargeFee}
                onChange={(e) => setReturnForm({ ...returnForm, chargeFee: e.target.checked })}
              />
              <span className="text-sm font-medium">Charge Late Fee / Damage Fee</span>
            </label>
            {returnForm.chargeFee && (
              <div className="mt-2">
                <input
                  type="number"
                  value={returnForm.feeAmount}
                  onChange={(e) => setReturnForm({ ...returnForm, feeAmount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Fee amount (KES)"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={returnForm.notes}
              onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Additional notes..."
            />
          </div>

          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Item:</strong> {selectedItem.name}</p>
              <p><strong>Current Stock:</strong> {selectedItem.quantity} {selectedItem.unit}</p>
              <p><strong>Value:</strong> KES {selectedItem.unitPrice?.toLocaleString()}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowReturnModal(false)}>Cancel</Button>
          <Button onClick={submitReturn} disabled={processingId === 'return'}>
            {processingId === 'return' ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4 mr-1" />}
            Process Return
          </Button>
        </div>
      </Modal>

      {/* Process Borrowed Return Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Return Borrowed Item" size="md">
        {selectedBorrowed && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Item:</strong> {selectedBorrowed.itemName}</p>
              <p><strong>Borrower:</strong> {selectedBorrowed.borrowedBy}</p>
              <p><strong>Borrowed:</strong> {new Date(selectedBorrowed.borrowedDate).toLocaleDateString()}</p>
              <p><strong>Due:</strong> {new Date(selectedBorrowed.dueDate).toLocaleDateString()}</p>
              {selectedBorrowed.daysOverdue > 0 && (
                <p className="text-red-600"><strong>Days Overdue:</strong> {selectedBorrowed.daysOverdue}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Item Condition</label>
              <select
                value={returnForm.condition}
                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
                <option value="unusable">Unusable</option>
              </select>
            </div>

            {(returnForm.condition === 'damaged' || returnForm.condition === 'unusable') && (
              <div>
                <label className="block text-sm font-medium mb-1">Damage Notes</label>
                <textarea
                  value={returnForm.damageNotes}
                  onChange={(e) => setReturnForm({ ...returnForm, damageNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Describe damage..."
                />
              </div>
            )}

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm">
                <strong>Late Fee:</strong> KES {selectedBorrowed.lateFee?.toLocaleString() || '0'}
                {selectedBorrowed.daysOverdue > 0 && (
                  <span className="block text-xs text-gray-500">
                    Charged at 1% of item value per day (capped at 50%)
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowDetailModal(false)}>Cancel</Button>
          <Button onClick={() => processBorrowedReturn(selectedBorrowed!)} disabled={processingId === selectedBorrowed?.id}>
            {processingId === selectedBorrowed?.id ? <Spinner size="sm" /> : <RotateCcw className="w-4 h-4 mr-1" />}
            Confirm Return
          </Button>
        </div>
      </Modal>

      {/* Overdue Items Modal */}
      <Modal isOpen={showOverdueModal} onClose={() => setShowOverdueModal(false)} title="Overdue Items" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {borrowedItems.filter(i => i.daysOverdue > 0).map(overdue => (
            <div key={overdue.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{overdue.itemName}</h4>
                  <p className="text-sm text-gray-500">Borrower: {overdue.borrowedBy}</p>
                  <p className="text-sm">Due: {new Date(overdue.dueDate).toLocaleDateString()}</p>
                  <p className="text-red-600 font-semibold">Days Overdue: {overdue.daysOverdue}</p>
                  <p className="text-red-600">Late Fee: KES {overdue.lateFee?.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => sendOverdueReminder(overdue.id, 'sms')}>
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => {
                    setSelectedBorrowed(overdue);
                    setShowDetailModal(true);
                    setShowOverdueModal(false);
                  }}>
                    Process Return
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={bulkSendReminders}>
              Send All Reminders
            </Button>
            <Button onClick={() => setShowOverdueModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}