// client/src/components/roles/admin/AdminTransactionsPage.tsx
import React, { useEffect, useState } from 'react';
import { 
  Search, RefreshCcw, Download, Upload, CheckSquare, Square, Save, X,
  Filter, Calendar, DollarSign, CreditCard, Banknote, Smartphone,
  CheckCircle, XCircle, Clock, Eye, Printer, Mail, MessageCircle,
  TrendingUp, TrendingDown, AlertCircle, Shield, UserCheck,
  Receipt, FileText, Copy, Share2, BarChart3, PieChart,
  ArrowUpDown, Wallet, Building2, Landmark, QrCode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { financeService, mpesaService } from '../../../services/adminService';

interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  amount: number;
  method: 'cash' | 'mpesa' | 'bank' | 'cheque';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reference: string;
  mpesaCode?: string;
  bankSlip?: string;
  receiptNumber: string;
  date: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  category: 'fees' | 'library' | 'sports' | 'other';
  paymentFor: string;
  term: string;
  year: number;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'mpesa' | 'bank' | 'cheque'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    mpesaCount: 0,
    cashCount: 0,
    bankCount: 0
  });

  const [form, setForm] = useState({
    studentId: '',
    studentName: '',
    amount: 0,
    method: 'cash' as 'cash' | 'mpesa' | 'bank' | 'cheque',
    reference: '',
    mpesaCode: '',
    category: 'fees',
    paymentFor: '',
    term: '',
    year: new Date().getFullYear(),
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await financeService.getTransactions();
      const transactionsList = Array.isArray(data) ? data : data?.transactions || [];
      setTransactions(transactionsList);
      
      setStats({
        totalTransactions: transactionsList.length,
        totalAmount: transactionsList.reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0),
        pendingAmount: transactionsList.filter((t: Transaction) => t.status === 'pending').reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0),
        approvedAmount: transactionsList.filter((t: Transaction) => t.status === 'approved' || t.status === 'completed').reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0),
        mpesaCount: transactionsList.filter((t: Transaction) => t.method === 'mpesa').length,
        cashCount: transactionsList.filter((t: Transaction) => t.method === 'cash').length,
        bankCount: transactionsList.filter((t: Transaction) => t.method === 'bank').length
      });
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveTransaction = async () => {
    if (!form.studentId || !form.amount || !form.paymentFor) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (form.method === 'mpesa' && !form.mpesaCode) {
        toast.error('M-Pesa transaction code required');
        return;
      }

      const transaction = {
        ...form,
        status: 'pending',
        receiptNumber: `RCP-${Date.now()}`,
        date: new Date().toISOString()
      };
      
      await financeService.createTransaction(transaction);
      toast.success('Transaction recorded successfully');
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to record transaction');
    }
  };

  const resetForm = () => {
    setForm({
      studentId: '',
      studentName: '',
      amount: 0,
      method: 'cash',
      reference: '',
      mpesaCode: '',
      category: 'fees',
      paymentFor: '',
      term: '',
      year: new Date().getFullYear(),
      notes: ''
    });
  };

  const approveTransaction = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await financeService.updateTransactionStatus(id, status, notes);
      toast.success(`Transaction ${status}`);
      fetchData();
      setShowApprovalModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await financeService.deleteTransaction(id);
      toast.success('Transaction deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} transactions?`)) return;
    await Promise.all(selected.map(id => financeService.deleteTransaction(id)));
    toast.success(`Deleted ${selected.length} transactions`);
    setSelected([]);
    fetchData();
  };

  const bulkApprove = async () => {
    if (!confirm(`Approve ${selected.length} transactions?`)) return;
    await Promise.all(selected.map(id => financeService.updateTransactionStatus(id, 'approved')));
    toast.success(`Approved ${selected.length} transactions`);
    setSelected([]);
    fetchData();
  };

  const exportTransactions = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const blob = await financeService.exportTransactions({
        format,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        method: methodFilter !== 'all' ? methodFilter : undefined,
        dateRange: dateRange.start && dateRange.end ? { start: dateRange.start, end: dateRange.end } : undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const reconcileWithBank = async () => {
    try {
      const reconciled = await financeService.reconcileTransactions(dateRange);
      toast.success(`Reconciled ${reconciled.count} transactions`);
      fetchData();
      setShowReconcileModal(false);
    } catch (error) {
      toast.error('Reconciliation failed');
    }
  };

  const verifyMpesaPayment = async (mpesaCode: string) => {
    try {
      const result = await mpesaService.verifyPayment(mpesaCode);
      if (result.verified) {
        toast.success('M-Pesa payment verified');
        return result;
      } else {
        toast.error('Payment not found');
        return null;
      }
    } catch (error) {
      toast.error('Verification failed');
      return null;
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(t => t.id));
    }
  };

  const filtered = transactions.filter(t => {
    const matchesSearch = t.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.mpesaCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || t.method === methodFilter;
    const matchesDate = (!dateRange.start || new Date(t.date) >= new Date(dateRange.start)) &&
                        (!dateRange.end || new Date(t.date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportFiles(Array.from(e.dataTransfer.files));
    setShowImport(true);
  };

  const doImport = async () => {
    for (const file of importFiles) {
      await financeService.importTransactions(file);
    }
    toast.success(`${importFiles.length} file(s) imported`);
    setShowImport(false);
    setImportFiles([]);
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'cash': return <Banknote size={14} />;
      case 'mpesa': return <Smartphone size={14} />;
      case 'bank': return <Building2 size={14} />;
      case 'cheque': return <Receipt size={14} />;
      default: return <CreditCard size={14} />;
    }
  };

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Transaction Management</h1>
          <p>Track, approve, and reconcile all financial transactions</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} /> Import
          </button>
          <button onClick={() => exportTransactions('excel')} className="btn-secondary">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total"><DollarSign size={24} /></div>
          <div><span className="stat-value">KES {stats.totalAmount.toLocaleString()}</span><span className="stat-label">Total Collection</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending"><Clock size={24} /></div>
          <div><span className="stat-value">KES {stats.pendingAmount.toLocaleString()}</span><span className="stat-label">Pending Approval</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon approved"><CheckCircle size={24} /></div>
          <div><span className="stat-value">KES {stats.approvedAmount.toLocaleString()}</span><span className="stat-label">Approved</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon mpesa"><Smartphone size={24} /></div>
          <div><span className="stat-value">{stats.mpesaCount}</span><span className="stat-label">M-Pesa Payments</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cash"><Banknote size={24} /></div>
          <div><span className="stat-value">{stats.cashCount}</span><span className="stat-label">Cash Payments</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bank"><Landmark size={24} /></div>
          <div><span className="stat-value">{stats.bankCount}</span><span className="stat-label">Bank Transfers</span></div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} transactions selected</span>
          <div className="bulk-buttons">
            <button onClick={bulkApprove} className="btn-sm success"><CheckCircle size={14} /> Approve</button>
            <button onClick={bulkDelete} className="btn-sm danger"><Trash2 size={14} /> Delete</button>
            <button onClick={() => setSelected([])} className="btn-sm">Clear</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search by student, receipt, M-Pesa code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="filter-select">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value as any)} className="filter-select">
          <option value="all">All Methods</option>
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="bank">Bank Transfer</option>
          <option value="cheque">Cheque</option>
        </select>

        <div className="date-range">
          <input type="date" placeholder="From" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          <span>to</span>
          <input type="date" placeholder="To" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
        </div>

        <button onClick={() => setShowReconcileModal(true)} className="btn-reconcile">
          <Shield size={16} /> Reconcile
        </button>
      </div>

      {/* Drag & Drop Import */}
      <div className="drag-area" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={32} />
        <p>Drag & drop Excel/CSV files here for bulk import</p>
        <small>Supports .xlsx, .csv, .xls formats</small>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading transactions...</p></div>
      ) : (
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th className="checkbox"><button onClick={toggleSelectAll}>{selected.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(transaction => (
                <tr key={transaction.id} className={transaction.status === 'pending' ? 'pending-row' : ''}>
                  <td className="checkbox"><button onClick={() => toggleSelect(transaction.id)}>{selected.includes(transaction.id) ? <CheckSquare size={16} className="text-teal-600" /> : <Square size={16} />}</button></td>
                  <td><strong>{transaction.receiptNumber}</strong><br /><small>{transaction.id.slice(0, 8)}</small></td>
                  <td>{new Date(transaction.date).toLocaleDateString()}<br /><small>{new Date(transaction.date).toLocaleTimeString()}</small></td>
                  <td className="student-cell">{transaction.studentName}</td>
                  <td>{transaction.admissionNumber}</td>
                  <td><strong className="amount">KES {transaction.amount.toLocaleString()}</strong></td>
                  <td><span className="method-badge">{getMethodIcon(transaction.method)} {transaction.method.toUpperCase()}</span></td>
                  <td>{transaction.mpesaCode || transaction.reference || '-'}</td>
                  <td><span className={`status-badge ${getStatusBadge(transaction.status)}`}>{transaction.status}</span></td>
                  <td className="actions">
                    <button onClick={() => { setSelectedTransaction(transaction); setShowDetailsModal(true); }} title="View Details"><Eye size={14} /></button>
                    {transaction.status === 'pending' && (
                      <button onClick={() => { setSelectedTransaction(transaction); setShowApprovalModal(true); }} title="Approve/Reject"><Shield size={14} /></button>
                    )}
                    <button onClick={() => deleteTransaction(transaction.id)} className="danger" title="Delete"><Trash2 size={14} /></button>
                    <button onClick={() => window.open(`/receipts/${transaction.receiptNumber}`, '_blank')} title="Print Receipt"><Printer size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record New Payment</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Student Name *</label>
                  <input value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} placeholder="Enter student name" />
                </div>
                <div className="form-group">
                  <label>Student ID *</label>
                  <input value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="Admission number" />
                </div>
                <div className="form-group">
                  <label>Amount (KES) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select value={form.method} onChange={e => setForm({...form, method: e.target.value as any})}>
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment For *</label>
                  <input value={form.paymentFor} onChange={e => setForm({...form, paymentFor: e.target.value})} placeholder="e.g., Term 1 Fees" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                    <option value="fees">School Fees</option>
                    <option value="library">Library</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {form.method === 'mpesa' && (
                  <div className="form-group">
                    <label>M-Pesa Transaction Code *</label>
                    <input value={form.mpesaCode} onChange={e => setForm({...form, mpesaCode: e.target.value})} placeholder="e.g., QWERTY123" />
                    <button className="btn-verify" onClick={() => verifyMpesaPayment(form.mpesaCode)}>Verify</button>
                  </div>
                )}
                <div className="form-group full-width">
                  <label>Reference / Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Additional notes..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTransaction}>Record Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowApprovalModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review Transaction</h3>
              <button className="close-btn" onClick={() => setShowApprovalModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="transaction-details">
                <p><strong>Student:</strong> {selectedTransaction.studentName}</p>
                <p><strong>Amount:</strong> KES {selectedTransaction.amount.toLocaleString()}</p>
                <p><strong>Method:</strong> {selectedTransaction.method.toUpperCase()}</p>
                <p><strong>Reference:</strong> {selectedTransaction.mpesaCode || selectedTransaction.reference || 'N/A'}</p>
                <p><strong>Payment For:</strong> {selectedTransaction.paymentFor}</p>
              </div>
              <div className="approval-notes">
                <textarea placeholder="Approval notes (optional)" id="approval-notes" rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={() => {
                const notes = (document.getElementById('approval-notes') as HTMLTextAreaElement).value;
                approveTransaction(selectedTransaction.id, 'rejected', notes);
              }}>Reject</button>
              <button className="btn-primary" onClick={() => {
                const notes = (document.getElementById('approval-notes') as HTMLTextAreaElement).value;
                approveTransaction(selectedTransaction.id, 'approved', notes);
              }}>Approve</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transaction Details</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div><label>Receipt Number:</label><span>{selectedTransaction.receiptNumber}</span></div>
                <div><label>Transaction ID:</label><span>{selectedTransaction.id}</span></div>
                <div><label>Date & Time:</label><span>{new Date(selectedTransaction.date).toLocaleString()}</span></div>
                <div><label>Student Name:</label><span>{selectedTransaction.studentName}</span></div>
                <div><label>Admission Number:</label><span>{selectedTransaction.admissionNumber}</span></div>
                <div><label>Amount:</label><span className="amount-highlight">KES {selectedTransaction.amount.toLocaleString()}</span></div>
                <div><label>Payment Method:</label><span>{selectedTransaction.method.toUpperCase()}</span></div>
                <div><label>Reference:</label><span>{selectedTransaction.mpesaCode || selectedTransaction.reference || '-'}</span></div>
                <div><label>Status:</label><span className={`status-badge ${getStatusBadge(selectedTransaction.status)}`}>{selectedTransaction.status}</span></div>
                <div><label>Payment For:</label><span>{selectedTransaction.paymentFor}</span></div>
                <div><label>Category:</label><span>{selectedTransaction.category}</span></div>
                <div><label>Term:</label><span>{selectedTransaction.term || 'N/A'}</span></div>
                {selectedTransaction.approvedBy && (
                  <div><label>Approved By:</label><span>{selectedTransaction.approvedBy}</span></div>
                )}
                {selectedTransaction.approvedAt && (
                  <div><label>Approved At:</label><span>{new Date(selectedTransaction.approvedAt).toLocaleString()}</span></div>
                )}
                {selectedTransaction.notes && (
                  <div className="full-width"><label>Notes:</label><p>{selectedTransaction.notes}</p></div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => window.print()}>Print</button>
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation Modal */}
      {showReconcileModal && (
        <div className="modal-overlay" onClick={() => setShowReconcileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bank Reconciliation</h3>
              <button className="close-btn" onClick={() => setShowReconcileModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Reconcile transactions with bank statement</p>
              <div className="form-group">
                <label>Upload Bank Statement</label>
                <input type="file" accept=".csv,.xlsx" />
              </div>
              <div className="reconcile-summary">
                <p>Total Transactions: {filtered.length}</p>
                <p>Total Amount: KES {stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowReconcileModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={reconcileWithBank}>Reconcile</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Transactions</h3>
              <button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="import-area">
                <Upload size={48} />
                <p>Select Excel or CSV files</p>
                <input type="file" multiple accept=".xlsx,.csv,.xls" onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} />
                {importFiles.length > 0 && (
                  <div className="file-list">{importFiles.map((f, i) => <span key={i}>{f.name}</span>)}</div>
                )}
              </div>
              <a href="/templates/transactions-template.xlsx" download className="template-link">Download template</a>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn-primary" onClick={doImport} disabled={importFiles.length === 0}>Import {importFiles.length} Files</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .transactions-page { padding: 24px; max-width: 1400px; margin: 0 auto; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-header h1 { font-size: 28px; margin: 0 0 8px 0; }
        .page-header p { margin: 0; color: #6b7280; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; border: 1px solid #e5e7eb; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.total { background: #e0e7ff; color: #4338ca; }
        .stat-icon.pending { background: #fef3c7; color: #d97706; }
        .stat-icon.approved { background: #d1fae5; color: #059669; }
        .stat-icon.mpesa { background: #dbeafe; color: #2563eb; }
        .stat-icon.cash { background: #f3e8ff; color: #9333ea; }
        .stat-icon.bank { background: #fed7aa; color: #c2410c; }
        .stat-value { font-size: 18px; font-weight: bold; display: block; }
        .stat-label { font-size: 11px; color: #6b7280; }
        .bulk-bar { background: #e0f2fe; border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .bulk-buttons { display: flex; gap: 8px; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; background: white; padding: 16px; border-radius: 16px; border: 1px solid #e5e7eb; }
        .search-box { display: flex; align-items: center; gap: 8px; flex: 1; background: #f9fafb; padding: 8px 12px; border-radius: 10px; }
        .search-box input { flex: 1; border: none; outline: none; background: transparent; }
        .filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: white; }
        .date-range { display: flex; align-items: center; gap: 8px; }
        .date-range input { padding: 8px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .btn-reconcile { background: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .drag-area { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 20px; background: #fafbfc; cursor: pointer; }
        .table-container { background: white; border-radius: 16px; overflow-x: auto; border: 1px solid #e5e7eb; }
        .transactions-table { width: 100%; border-collapse: collapse; }
        .transactions-table th, .transactions-table td { padding: 12px; text-align: left; border-bottom: 1px solid #f3f4f6; }
        .transactions-table th { background: #f9fafb; font-weight: 600; }
        .pending-row { background: #fffbeb; }
        .checkbox { width: 40px; text-align: center; }
        .student-cell { font-weight: 500; }
        .amount { color: #059669; }
        .method-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #f3f4f6; border-radius: 20px; font-size: 11px; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .actions { display: flex; gap: 8px; }
        .actions button { padding: 6px; border-radius: 6px; border: none; cursor: pointer; background: #f3f4f6; }
        .actions button.danger { color: #dc2626; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 20px; width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 20px; }
        .modal-footer { padding: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 12px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
        .form-group input, .form-group select, .form-group textarea { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
        .full-width { grid-column: span 2; }
        .btn-verify { margin-top: 8px; background: #f3f4f6; border: none; padding: 6px; border-radius: 6px; cursor: pointer; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .details-grid label { font-weight: 600; color: #6b7280; display: block; font-size: 12px; }
        .details-grid .full-width { grid-column: span 2; }
        .amount-highlight { font-size: 20px; font-weight: bold; color: #1d8a8a; }
        .btn-primary, .btn-secondary, .btn-sm { padding: 8px 16px; border-radius: 10px; font-weight: 500; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 6px; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-secondary { background: #f3f4f6; color: #374151; }
        .btn-danger { background: #fee2e2; color: #dc2626; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .btn-sm.success { background: #d1fae5; color: #059669; }
        .btn-sm.danger { background: #fee2e2; color: #dc2626; }
        .loading-state { text-align: center; padding: 60px; background: white; border-radius: 16px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}