import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  ArrowUpRight,
  Package,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  History,
  FileText,
  Send,
  Mail,
  Phone,
  MessageCircle,
  Users,
  GraduationCap,
  Briefcase,
  Calendar as CalendarIcon,
  DollarSign,
  Percent,
  Tag,
  Barcode,
  QrCode,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  Info,
  Shield,
  Award,
  Star,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import storeKeeperService from '../../../services/storeKeeperService';
import type { InventoryItem, IssueRecord } from '../../../types/storeKeeper';
import { clsx } from 'clsx';

interface IssueForm {
  itemId: string;
  quantity: number;
  issuedToType: 'teacher' | 'student' | 'staff' | 'department';
  issuedToId: string;
  issuedToName: string;
  department: string;
  purpose: string;
  expectedReturnDate: string;
  isBorrowable: boolean;
  notes: string;
  signature?: string;
}

interface IssueHistory extends IssueRecord {
  itemName: string;
  itemCode: string;
  returned: boolean;
  returnedDate?: string;
  returnedQuantity?: number;
  condition?: 'good' | 'damaged' | 'lost';
}

const emptyForm: IssueForm = {
  itemId: '',
  quantity: 1,
  issuedToType: 'teacher',
  issuedToId: '',
  issuedToName: '',
  department: '',
  purpose: '',
  expectedReturnDate: '',
  isBorrowable: false,
  notes: '',
};

const issueTypes = [
  { value: 'teacher', label: 'Teacher', icon: <Users className="w-4 h-4" /> },
  { value: 'student', label: 'Student', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'staff', label: 'Staff', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'department', label: 'Department', icon: <Building2 className="w-4 h-4" /> },
];

const departments = [
  'Academic', 'Sports', 'Laboratory', 'Library', 'Administration',
  'Maintenance', 'Kitchen', 'Transport', 'ICT', 'Boarding'
];

const purposes = [
  'Classroom Use', 'Laboratory Work', 'Sports Practice', 'Library Reference',
  'Staff Office', 'Student Project', 'Maintenance Work', 'Event', 'Examination', 'Other'
];

export default function StoreKeeperIssuesPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issueHistory, setIssueHistory] = useState<IssueHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [form, setForm] = useState<IssueForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<IssueHistory | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, historyRes] = await Promise.all([
        storeKeeperService.inventory.getInventory(),
        storeKeeperService.movements.getIssueHistory()
      ]);
      setItems(itemsRes.data || []);
      setIssueHistory(historyRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
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
                           (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter ? item.category === categoryFilter : true;
      const hasStock = item.quantity > 0;
      return matchesSearch && matchesCategory && hasStock;
    });
  }, [items, searchTerm, categoryFilter]);

  const selectedItem = useMemo(() => 
    items.find(item => item.id === form.itemId),
    [items, form.itemId]
  );

  const submitIssue = async () => {
    if (!form.itemId) {
      toast.error('Please select an item');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!form.issuedToName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }
    if (selectedItem && form.quantity > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} ${selectedItem.unit} available`);
      return;
    }

    setSubmitting(true);
    try {
      await storeKeeperService.movements.issueItems({
        itemId: form.itemId,
        quantity: form.quantity,
        issuedToType: form.issuedToType,
        issuedToId: form.issuedToId || undefined,
        issuedToName: form.issuedToName,
        department: form.department,
        purpose: form.purpose,
        expectedReturnDate: form.isBorrowable ? form.expectedReturnDate : undefined,
        isBorrowable: form.isBorrowable,
        notes: form.notes,
      });
      toast.success('Item issued successfully');
      setForm(emptyForm);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to issue item:', error);
      toast.error('Failed to issue item');
    } finally {
      setSubmitting(false);
    }
  };

  const processReturn = async (issueId: string, condition: string, notes?: string) => {
    if (!confirm('Mark this item as returned?')) return;
    
    try {
      await storeKeeperService.movements.returnItem(issueId, { condition, notes });
      toast.success('Item returned successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to process return:', error);
      toast.error('Failed to process return');
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Item', 'Quantity', 'Issued To', 'Department', 'Purpose', 'Status', 'Return Date'],
      ...issueHistory.map(record => [
        new Date(record.createdAt).toLocaleDateString(),
        record.itemName,
        record.quantity,
        record.issuedToName,
        record.department || '-',
        record.purpose || '-',
        record.returned ? 'Returned' : 'Outstanding',
        record.returnedDate ? new Date(record.returnedDate).toLocaleDateString() : '-'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issue_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Stationery': <FileText className="w-4 h-4" />,
      'Electronics': <Package className="w-4 h-4" />,
      'Uniforms': <Shield className="w-4 h-4" />,
      'Sports Equipment': <Award className="w-4 h-4" />,
    };
    return icons[category] || <Package className="w-4 h-4" />;
  };

  const outstandingCount = issueHistory.filter(h => !h.returned).length;
  const totalIssued = issueHistory.reduce((sum, h) => sum + h.quantity, 0);

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
            <ArrowUpRight className="w-6 h-6 text-blue-600" />
            Issue Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Issue items to teachers, students, and staff. Track borrowable items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportHistory}>
            <Download className="w-4 h-4 mr-1" />
            Export History
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistoryModal(true)}>
            <History className="w-4 h-4 mr-1" />
            History ({outstandingCount} outstanding)
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Issue Item
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.filter(i => i.quantity > 0).length}</p>
          <p className="text-xs text-gray-500">Available Items</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalIssued}</p>
          <p className="text-xs text-gray-500">Total Issued</p>
        </Card>
        <Card className="text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-600">{outstandingCount}</p>
          <p className="text-xs text-gray-500">Outstanding Returns</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{issueHistory.filter(h => h.returned).length}</p>
          <p className="text-xs text-gray-500">Completed Returns</p>
        </Card>
      </div>

      {/* Inventory List */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">All Categories</option>
            {Array.from(new Set(items.map(i => i.category))).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-sm">
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Available</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(item.category)}
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                      {item.code && <span className="text-xs text-gray-400 font-mono">({item.code})</span>}
                    </div>
                   </td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={clsx(
                      'font-medium',
                      item.quantity <= (item.reorderLevel || 0) ? 'text-orange-600' : 'text-gray-900'
                    )}>
                      {item.quantity}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3">{item.location || 'Main Store'}</td>
                  <td className="px-4 py-3 text-center">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setForm({ ...emptyForm, itemId: item.id });
                        setShowModal(true);
                      }}
                      disabled={item.quantity === 0}
                    >
                      <Package className="w-3 h-3 mr-1" />
                      Issue
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No items available to issue
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Issue Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Issue Item" size="lg">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item *</label>
            <select
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
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

          {selectedItem && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Available Stock:</span>
                <span className="font-semibold">{selectedItem.quantity} {selectedItem.unit}</span>
              </div>
              {selectedItem.location && (
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Location:</span>
                  <span>{selectedItem.location}</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                min={1}
                max={selectedItem?.quantity}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issued To Type *</label>
              <select
                value={form.issuedToType}
                onChange={(e) => setForm({ ...form, issuedToType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {issueTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient Name *</label>
            <input
              value={form.issuedToName}
              onChange={(e) => setForm({ ...form, issuedToName: e.target.value })}
              placeholder="e.g., John Mwangi, Form 3A, Science Department"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
              <select
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select purpose</option>
                {purposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Borrowable Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBorrowable"
              checked={form.isBorrowable}
              onChange={(e) => setForm({ ...form, isBorrowable: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isBorrowable" className="text-sm text-gray-700 dark:text-gray-300">
              This is a borrowable item (needs to be returned)
            </label>
          </div>

          {form.isBorrowable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Return Date</label>
              <input
                type="date"
                value={form.expectedReturnDate}
                onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Additional notes about this issue..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>Cancel</Button>
          <Button fullWidth onClick={submitIssue} isLoading={submitting}>
            Issue Item
          </Button>
        </div>
      </Modal>

      {/* Issue History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Issue History" size="xl">
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{issueHistory.length}</p>
              <p className="text-xs text-gray-500">Total Issues</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{issueHistory.filter(h => !h.returned).length}</p>
              <p className="text-xs text-gray-500">Outstanding</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{issueHistory.filter(h => h.returned).length}</p>
              <p className="text-xs text-gray-500">Returned</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr className="text-left text-sm">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Item</th>
                  <th className="px-4 py-2 font-semibold text-right">Qty</th>
                  <th className="px-4 py-2 font-semibold">Issued To</th>
                  <th className="px-4 py-2 font-semibold">Purpose</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {issueHistory.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-2 text-sm">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{record.itemName}</p>
                        {record.itemCode && <p className="text-xs text-gray-400">{record.itemCode}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">{record.quantity}</td>
                    <td className="px-4 py-2">
                      <div>
                        <p>{record.issuedToName}</p>
                        <p className="text-xs text-gray-400 capitalize">{record.issuedToType}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">{record.purpose || '-'}</td>
                    <td className="px-4 py-2">
                      {record.returned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <AlertTriangle className="w-3 h-3" />
                          Outstanding
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {!record.returned && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => processReturn(record.id, 'good')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Returned
                        </Button>
                      )}
</td>
                    </tr>
                  ))}
                  {issueHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No issue records found
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}