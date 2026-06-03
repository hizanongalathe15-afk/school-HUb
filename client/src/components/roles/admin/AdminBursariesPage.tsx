// client/src/components/roles/admin/AdminBursariesPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Filter, Download,
  Upload, Eye, CheckCircle, XCircle, Clock, AlertCircle,
  Send, Mail, FileText, Calendar, DollarSign, Users,
  TrendingUp, TrendingDown, PieChart, BarChart3, Activity,
  Award, Heart, Shield, UserCheck, UserX, MessageCircle,
  Receipt, Banknote, CreditCard, Wallet, Printer, Share2,
  Copy, Archive, Settings, Bell, Zap, Star, Flag, Lock,
  ChevronLeft, ChevronRight, MoreVertical, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { financeService, notificationService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

interface BursaryRecipient {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentPhone: string;
  studentEmail: string;
  amount: number;
  amountDisbursed: number;
  amountRemaining: number;
  provider: string;
  providerType: 'government' | 'ngo' | 'corporate' | 'private' | 'scholarship';
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  status: 'pending' | 'approved' | 'disbursed' | 'completed' | 'rejected' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  purpose: string;
  academicYear: string;
  term: number;
  paymentPlan: 'one-time' | 'termly' | 'monthly';
  remainingTerms: number;
  termsPaid: number;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  financialNeed: number; // 1-10 scale
  academicPerformance: number; // grade average
  attendance: number; // percentage
  reviewNotes: string;
  reviewerId?: string;
  reviewerName?: string;
  documents: { id: string; name: string; url: string; type: string }[];
  notes: string[];
  lastUpdated: Date;
}

interface ApplicationStats {
  totalApplications: number;
  totalAmount: number;
  totalDisbursed: number;
  pendingAmount: number;
  approvedAmount: number;
  averageAmount: number;
  byStatus: Record<string, number>;
  byProvider: Record<string, number>;
  byPriority: Record<string, number>;
  byClass: Record<string, number>;
}

export default function AdminBursariesPage() {
  const confirmation = useConfirmationDialog();
  
  // State Management
  const [bursaries, setBursaries] = useState<BursaryRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editing, setEditing] = useState<BursaryRecipient | null>(null);
  const [selectedBursary, setSelectedBursary] = useState<BursaryRecipient | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'stats'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [disbursementAmount, setDisbursementAmount] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<BursaryRecipient>>({
    studentName: '', studentId: '', studentClass: '', studentPhone: '', studentEmail: '',
    amount: 0, provider: '', providerType: 'ngo', purpose: '', academicYear: new Date().getFullYear().toString(),
    term: 1, paymentPlan: 'one-time', parentName: '', parentPhone: '', parentEmail: '',
    financialNeed: 5, academicPerformance: 70, attendance: 90, priority: 'medium'
  });

  const fetchData = async () => {
    setLoading(true);
    try { 
      const data = await financeService.getBursaries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        provider: providerFilter !== 'all' ? providerFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        class: classFilter !== 'all' ? classFilter : undefined,
        search: searchTerm || undefined,
        page: currentPage
      });
      setBursaries(data.items);
      setTotalPages(data.pages);
      setStats(data.stats);
    } catch (error) { 
      toast.error('Failed to load bursaries'); 
      console.error(error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [currentPage, statusFilter, providerFilter, priorityFilter, classFilter, searchTerm]);

  const handleCreate = async () => {
    if (!form.studentName || !form.amount || !form.provider) {
      toast.error('Student name, amount, and provider are required');
      return;
    }
    try { 
      await financeService.createBursary(form); 
      toast.success('Bursary application created');
      fetchData(); 
      setShowModal(false); 
      resetForm();
    } catch (error: any) { 
      toast.error(error.message || 'Failed to create'); 
    }
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    try { 
      await financeService.updateBursary(editing.id, form); 
      toast.success('Bursary updated successfully');
      fetchData(); 
      setShowModal(false); 
      setEditing(null);
      resetForm();
    } catch (error: any) { 
      toast.error(error.message || 'Failed to update'); 
    }
  };

  const handleDelete = async (id: string) => {
    const bursary = bursaries.find(b => b.id === id);
    if (bursary?.status === 'disbursed' || bursary?.status === 'completed') {
      toast.error('Cannot delete already disbursed bursary');
      return;
    }
    
    const confirmOptions = {
      title: 'Delete Bursary Record',
      message: `Are you sure you want to delete bursary for ${bursary?.studentName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger' as const,
    };

    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await financeService.deleteBursary(id);
        toast.success('Bursary deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleApprove = async (id: string, notes?: string) => {
    try {
      await financeService.approveBursary(id, { notes, approvedBy: 'admin' });
      toast.success('Bursary approved');
      await sendNotification(id, 'approved');
      fetchData();
      setShowReviewModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await financeService.rejectBursary(id, { reason, rejectedBy: 'admin' });
      toast.success('Bursary rejected');
      await sendNotification(id, 'rejected', reason);
      fetchData();
      setShowReviewModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject');
    }
  };

  const handleDisburse = async () => {
    if (!selectedBursary || !disbursementAmount) {
      toast.error('Please enter disbursement amount');
      return;
    }
    
    if (disbursementAmount > selectedBursary.amountRemaining) {
      toast.error(`Amount exceeds remaining balance of KES ${selectedBursary.amountRemaining}`);
      return;
    }
    
    try {
      await financeService.disburseBursary(selectedBursary.id, {
        amount: disbursementAmount,
        date: new Date(),
        receiptNumber: `BURS-${Date.now()}`
      });
      toast.success(`KES ${disbursementAmount} disbursed successfully`);
      await sendNotification(selectedBursary.id, 'disbursed', `KES ${disbursementAmount} has been sent`);
      fetchData();
      setShowDisburseModal(false);
      setDisbursementAmount(0);
    } catch (error: any) {
      toast.error(error.message || 'Disbursement failed');
    }
  };

  const sendNotification = async (bursaryId: string, action: string, message?: string) => {
    try {
      const bursary = bursaries.find(b => b.id === bursaryId);
      if (!bursary) return;
      
      await notificationService.sendBursaryNotification({
        bursaryId,
        recipientEmail: bursary.studentEmail,
        recipientPhone: bursary.studentPhone,
        action,
        message,
        amount: bursary.amount
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.length === 0) return;
    
    const actionText = bulkAction === 'approve' ? 'approve' : bulkAction === 'reject' ? 'reject' : 'delete';
    const confirmMsg = `Are you sure you want to ${actionText} ${selected.length} bursar${selected.length > 1 ? 'ies' : 'y'}?`;
    
    const confirmOptions = {
      title: `Bulk ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      message: confirmMsg,
      confirmText: `Yes, ${actionText}`,
      cancelText: 'Cancel',
      type: bulkAction === 'delete' ? 'danger' as const : 'warning' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await financeService.bulkActionBursaries(selected, bulkAction);
        toast.success(`${selected.length} bursar${selected.length > 1 ? 'ies' : 'y'} ${actionText}d`);
        setSelected([]);
        fetchData();
        setShowBulkModal(false);
      } catch (error: any) {
        toast.error(error.message || `Failed to ${actionText} bursaries`);
      }
    }
  };

  const exportData = async () => {
    try {
      const blob = await financeService.exportBursaries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        provider: providerFilter !== 'all' ? providerFilter : undefined,
        format: 'excel'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bursaries_export_${new Date().toISOString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const resetForm = () => {
    setForm({
      studentName: '', studentId: '', studentClass: '', studentPhone: '', studentEmail: '',
      amount: 0, provider: '', providerType: 'ngo', purpose: '', academicYear: new Date().getFullYear().toString(),
      term: 1, paymentPlan: 'one-time', parentName: '', parentPhone: '', parentEmail: '',
      financialNeed: 5, academicPerformance: 70, attendance: 90, priority: 'medium'
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="status-badge pending"><Clock size={12} /> Pending</span>;
      case 'approved': return <span className="status-badge approved"><CheckCircle size={12} /> Approved</span>;
      case 'disbursed': return <span className="status-badge disbursed"><DollarSign size={12} /> Disbursed</span>;
      case 'completed': return <span className="status-badge completed"><Award size={12} /> Completed</span>;
      case 'rejected': return <span className="status-badge rejected"><XCircle size={12} /> Rejected</span>;
      case 'cancelled': return <span className="status-badge cancelled"><AlertCircle size={12} /> Cancelled</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high': return <span className="priority-badge high"><AlertCircle size={10} /> High</span>;
      case 'medium': return <span className="priority-badge medium"><Clock size={10} /> Medium</span>;
      case 'low': return <span className="priority-badge low"><CheckCircle size={10} /> Low</span>;
      default: return null;
    }
  };

  const getProviderTypeIcon = (type: string) => {
    switch(type) {
      case 'government': return <Shield size={14} />;
      case 'ngo': return <Heart size={14} />;
      case 'corporate': return <Banknote size={14} />;
      case 'private': return <UserCheck size={14} />;
      default: return <Award size={14} />;
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(b => b.id));
    }
  };

  const filtered = bursaries.filter(b => 
    (b.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.provider || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.studentId || '').includes(searchTerm)
  );

  const uniqueClasses = [...new Set(bursaries.map(b => b.studentClass).filter(c => c))];
  const uniqueProviders = [...new Set(bursaries.map(b => b.provider).filter(p => p))];

  return (
    <div className="bursary-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><Heart size={24} /> Bursary & Financial Aid Management</h2>
          <p>Manage bursary applications, approvals, disbursements, and track financial aid</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📋 List</button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>🎴 Grid</button>
            <button className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`} onClick={() => setViewMode('stats')}>📊 Stats</button>
          </div>
          <button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export</button>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}><RefreshCcw size={16} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Application</button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && viewMode === 'stats' && (
        <div className="stats-dashboard">
          <div className="stats-grid">
            <div className="stat-card"><DollarSign size={24} /><div><div className="stat-value">KES {stats.totalAmount.toLocaleString()}</div><div className="stat-label">Total Applied</div></div></div>
            <div className="stat-card green"><CheckCircle size={24} /><div><div className="stat-value">KES {stats.totalDisbursed.toLocaleString()}</div><div className="stat-label">Disbursed</div></div></div>
            <div className="stat-card orange"><Clock size={24} /><div><div className="stat-value">KES {stats.pendingAmount.toLocaleString()}</div><div className="stat-label">Pending</div></div></div>
            <div className="stat-card blue"><Users size={24} /><div><div className="stat-value">{stats.totalApplications}</div><div className="stat-label">Applications</div></div></div>
            <div className="stat-card purple"><Award size={24} /><div><div className="stat-value">{stats.byStatus.approved || 0}</div><div className="stat-label">Approved</div></div></div>
            <div className="stat-card red"><XCircle size={24} /><div><div className="stat-value">{stats.byStatus.rejected || 0}</div><div className="stat-label">Rejected</div></div></div>
          </div>
          <div className="stats-row">
            <div className="stats-panel"><h4>By Provider</h4>{Object.entries(stats.byProvider).map(([k,v]) => <div key={k} className="stat-row"><span>{k}</span><span>{v}</span></div>)}</div>
            <div className="stats-panel"><h4>By Priority</h4>{Object.entries(stats.byPriority).map(([k,v]) => <div key={k} className="stat-row"><span>{k}</span><span>{v}</span></div>)}</div>
            <div className="stats-panel"><h4>By Class</h4>{Object.entries(stats.byClass).slice(0,5).map(([k,v]) => <div key={k} className="stat-row"><span>{k}</span><span>{v}</span></div>)}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search by student, provider, ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="disbursed">Disbursed</option><option value="completed">Completed</option><option value="rejected">Rejected</option></select>
        <select value={providerFilter} onChange={e => setProviderFilter(e.target.value)}><option value="all">All Providers</option>{uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}</select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}><option value="all">All Priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}><option value="all">All Classes</option>{uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
        {selected.length > 0 && (<div className="bulk-actions"><button className="btn btn-primary" onClick={() => { setBulkAction('approve'); setShowBulkModal(true); }}><CheckCircle size={14} /> Approve ({selected.length})</button><button className="btn btn-danger" onClick={() => { setBulkAction('reject'); setShowBulkModal(true); }}><XCircle size={14} /> Reject</button><button className="btn btn-danger" onClick={() => { setBulkAction('delete'); setShowBulkModal(true); }}><Trash2 size={14} /> Delete</button></div>)}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading bursary applications...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th><button onClick={toggleAll}>{selected.length === filtered.length && filtered.length > 0 ? <CheckCircle size={16} /> : <div className="checkbox-placeholder" />}</button></th>
                <th>Student</th><th>Amount</th><th>Provider</th><th>Disbursed</th><th>Remaining</th><th>Status</th><th>Priority</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className={selected.includes(b.id) ? 'selected' : ''}>
                  <td><button onClick={() => toggleSelect(b.id)} className="checkbox-btn">{selected.includes(b.id) ? <CheckCircle size={16} className="checked" /> : <div className="checkbox-empty" />}</button></td>
                  <td><div><strong>{b.studentName}</strong><div className="sub-text">{b.studentId} | {b.studentClass}</div></div></td>
                  <td className="amount">KES {b.amount.toLocaleString()}</td>
                  <td><div className="provider-cell">{getProviderTypeIcon(b.providerType)} {b.provider}</div></td>
                  <td>KES {(b.amountDisbursed || 0).toLocaleString()}</td>
                  <td className={b.amountRemaining > 0 ? 'remaining' : 'completed'}>KES {b.amountRemaining.toLocaleString()}</td>
                  <td>{getStatusBadge(b.status)}</td>
                  <td>{getPriorityBadge(b.priority)}</td>
                  <td>
                    <div className="action-buttons">
                      <button title="View Details" onClick={() => { setSelectedBursary(b); setShowDetailsModal(true); }}><Eye size={14} /></button>
                      {b.status === 'pending' && <button title="Review" onClick={() => { setSelectedBursary(b); setShowReviewModal(true); }}><MessageCircle size={14} /></button>}
                      {b.status === 'approved' && b.amountRemaining > 0 && <button title="Disburse" onClick={() => { setSelectedBursary(b); setDisbursementAmount(b.amountRemaining); setShowDisburseModal(true); }}><Wallet size={14} /></button>}
                      <button title="Edit" onClick={() => { setEditing(b); setForm(b); setShowModal(true); }}><Edit size={14} /></button>
                      <button title="Delete" className="danger" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="empty-state"><Heart size={48} /><p>No bursary applications found</p><button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create First Application</button></td></tr>}
            </tbody>
          </table>
          {totalPages > 1 && (<div className="pagination"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Previous</button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={16} /></button></div>)}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid-view">
          {filtered.map(b => (
            <div key={b.id} className="bursary-card">
              <div className="card-header">
                <div className="student-info"><div className="student-avatar">{b.studentName.charAt(0)}</div><div><h4>{b.studentName}</h4><p>{b.studentId} • {b.studentClass}</p></div></div>
                {getPriorityBadge(b.priority)}
              </div>
              <div className="card-details">
                <div className="detail-row"><DollarSign size={14} /> Amount: <strong>KES {b.amount.toLocaleString()}</strong></div>
                <div className="detail-row"><Wallet size={14} /> Disbursed: KES {(b.amountDisbursed || 0).toLocaleString()}</div>
                <div className="detail-row"><Award size={14} /> Provider: {b.provider}</div>
                <div className="detail-row"><Calendar size={14} /> Applied: {new Date(b.applicationDate).toLocaleDateString()}</div>
                <div className="status-row">{getStatusBadge(b.status)}</div>
              </div>
              <div className="card-actions">
                <button onClick={() => { setSelectedBursary(b); setShowDetailsModal(true); }}>View</button>
                {b.status === 'pending' && <button onClick={() => { setSelectedBursary(b); setShowReviewModal(true); }}>Review</button>}
                {b.status === 'approved' && b.amountRemaining > 0 && <button onClick={() => { setSelectedBursary(b); setDisbursementAmount(b.amountRemaining); setShowDisburseModal(true); }}>Disburse</button>}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Bursary Application' : 'New Bursary Application'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label>Student Information</label><div className="sub-grid"><input placeholder="Student Name *" value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} /><input placeholder="Student ID" value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} /><input placeholder="Class" value={form.studentClass} onChange={e => setForm({...form, studentClass: e.target.value})} /></div></div>
                <div className="form-group"><label>Phone</label><input placeholder="Student Phone" value={form.studentPhone} onChange={e => setForm({...form, studentPhone: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input placeholder="Student Email" value={form.studentEmail} onChange={e => setForm({...form, studentEmail: e.target.value})} /></div>
                <div className="form-group"><label>Amount *</label><input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: parseInt(e.target.value)})} /></div>
                <div className="form-group"><label>Provider *</label><input placeholder="Provider Name" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} /></div>
                <div className="form-group"><label>Provider Type</label><select value={form.providerType} onChange={e => setForm({...form, providerType: e.target.value as any})}><option value="government">Government</option><option value="ngo">NGO</option><option value="corporate">Corporate</option><option value="private">Private</option><option value="scholarship">Scholarship</option></select></div>
                <div className="form-group"><label>Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                <div className="form-group"><label>Payment Plan</label><select value={form.paymentPlan} onChange={e => setForm({...form, paymentPlan: e.target.value as any})}><option value="one-time">One-time</option><option value="termly">Termly</option><option value="monthly">Monthly</option></select></div>
                <div className="form-group full"><label>Parent/Guardian</label><div className="sub-grid"><input placeholder="Parent Name" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} /><input placeholder="Parent Phone" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} /><input placeholder="Parent Email" value={form.parentEmail} onChange={e => setForm({...form, parentEmail: e.target.value})} /></div></div>
                <div className="form-group full"><label>Purpose / Notes</label><textarea rows={3} placeholder="Reason for bursary, additional information..." value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} /></div>
              </div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={editing ? handleUpdate : handleCreate}>{editing ? 'Update' : 'Create'}</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedBursary && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal modal-details" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Bursary Details: {selectedBursary.studentName}</h3><button className="modal-close" onClick={() => setShowDetailsModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item"><label>Student</label><p>{selectedBursary.studentName} ({selectedBursary.studentId})<br/><small>{selectedBursary.studentClass}</small></p></div>
                <div className="detail-item"><label>Contact</label><p>{selectedBursary.studentPhone}<br/>{selectedBursary.studentEmail}</p></div>
                <div className="detail-item"><label>Amount</label><p>KES {selectedBursary.amount.toLocaleString()}<br/><small>Disbursed: KES {(selectedBursary.amountDisbursed || 0).toLocaleString()}<br/>Remaining: KES {selectedBursary.amountRemaining.toLocaleString()}</small></p></div>
                <div className="detail-item"><label>Provider</label><p>{selectedBursary.provider}<br/>{selectedBursary.providerType}</p></div>
                <div className="detail-item"><label>Status</label><p>{getStatusBadge(selectedBursary.status)} {getPriorityBadge(selectedBursary.priority)}</p></div>
                <div className="detail-item"><label>Dates</label><p>Applied: {new Date(selectedBursary.applicationDate).toLocaleDateString()}<br/>{selectedBursary.approvalDate && `Approved: ${new Date(selectedBursary.approvalDate).toLocaleDateString()}`}</p></div>
                <div className="detail-item full"><label>Purpose</label><p>{selectedBursary.purpose || 'No purpose provided'}</p></div>
                {selectedBursary.reviewNotes && <div className="detail-item full"><label>Review Notes</label><p>{selectedBursary.reviewNotes}</p></div>}
              </div>
              <div className="modal-actions"><button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedBursary && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Review Application: {selectedBursary.studentName}</h3><button className="modal-close" onClick={() => setShowReviewModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="review-info"><p><strong>Amount Requested:</strong> KES {selectedBursary.amount.toLocaleString()}</p><p><strong>Provider:</strong> {selectedBursary.provider}</p><p><strong>Purpose:</strong> {selectedBursary.purpose || 'N/A'}</p></div>
              <div className="form-group"><label>Review Notes</label><textarea rows={4} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Enter approval/rejection reason..." /></div>
              <div className="form-actions"><button className="btn btn-danger" onClick={() => handleReject(selectedBursary.id, reviewComment)}>Reject</button><button className="btn btn-primary" onClick={() => handleApprove(selectedBursary.id, reviewComment)}>Approve</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && selectedBursary && (
        <div className="modal-overlay" onClick={() => setShowDisburseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Disburse Funds - {selectedBursary.studentName}</h3><button className="modal-close" onClick={() => setShowDisburseModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="disburse-info"><p><strong>Total Amount:</strong> KES {selectedBursary.amount.toLocaleString()}</p><p><strong>Already Disbursed:</strong> KES {(selectedBursary.amountDisbursed || 0).toLocaleString()}</p><p><strong>Remaining Balance:</strong> KES {selectedBursary.amountRemaining.toLocaleString()}</p></div>
              <div className="form-group"><label>Amount to Disburse *</label><input type="number" value={disbursementAmount} onChange={e => setDisbursementAmount(parseInt(e.target.value))} max={selectedBursary.amountRemaining} /></div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowDisburseModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleDisburse}>Process Disbursement</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkModal && bulkAction && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Bulk {bulkAction === 'approve' ? 'Approval' : bulkAction === 'reject' ? 'Rejection' : 'Deletion'}</h3><button className="modal-close" onClick={() => setShowBulkModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><p>Are you sure you want to {bulkAction} {selected.length} selected bursar{selected.length > 1 ? 'ies' : 'y'}?</p><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button><button className={`btn ${bulkAction === 'delete' ? 'btn-danger' : 'btn-primary'}`} onClick={handleBulkAction}>Confirm {bulkAction}</button></div></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmation.isOpen} title={confirmation.options?.title || ''} message={confirmation.options?.message || ''} confirmLabel={confirmation.options?.confirmText} cancelLabel={confirmation.options?.cancelText} type={confirmation.options?.type} onConfirm={confirmation.handleConfirm} onCancel={confirmation.handleCancel} />

      <style>{`
        .bursary-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .stats-dashboard { margin-bottom: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-card.green .stat-value { color: #10b981; }
        .stat-card.orange .stat-value { color: #f59e0b; }
        .stat-card.blue .stat-value { color: #3b82f6; }
        .stat-card.purple .stat-value { color: #8b5cf6; }
        .stat-card.red .stat-value { color: #ef4444; }
        .stat-value { font-size: 24px; font-weight: 700; }
        .stat-label { font-size: 13px; color: #6b7280; }
        .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .stats-panel { background: white; border-radius: 12px; padding: 16px; }
        .stats-panel h4 { margin: 0 0 12px; font-size: 14px; }
        .stat-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .bulk-actions { display: flex; gap: 8px; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr.selected { background: #f0fdf4; }
        .amount { font-weight: 600; color: #1d8a8a; }
        .remaining { font-weight: 600; color: #f59e0b; }
        .completed { font-weight: 600; color: #10b981; }
        .sub-text { font-size: 11px; color: #6b7280; }
        .provider-cell { display: flex; align-items: center; gap: 6px; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.pending { background: #fed7aa; color: #f59e0b; }
        .status-badge.approved { background: #d1fae5; color: #10b981; }
        .status-badge.disbursed { background: #e0e7ff; color: #4f46e5; }
        .status-badge.completed { background: #d1fae5; color: #059669; }
        .status-badge.rejected { background: #fee2e2; color: #ef4444; }
        .status-badge.cancelled { background: #f1f5f9; color: #64748b; }
        .priority-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: 600; }
        .priority-badge.high { background: #fee2e2; color: #ef4444; }
        .priority-badge.medium { background: #fed7aa; color: #f59e0b; }
        .priority-badge.low { background: #d1fae5; color: #10b981; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .checkbox-btn { background: none; border: none; cursor: pointer; padding: 0; }
        .checkbox-empty { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 4px; }
        .checked { color: #1d8a8a; }
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .bursary-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .bursary-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .student-info { display: flex; gap: 12px; align-items: center; }
        .student-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; }
        .student-info h4 { margin: 0; font-size: 16px; }
        .student-info p { margin: 2px 0 0; font-size: 12px; color: #6b7280; }
        .card-details { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin: 12px 0; }
        .detail-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .status-row { margin-top: 8px; }
        .card-actions { display: flex; gap: 8px; }
        .card-actions button { flex: 1; padding: 6px; border: 1px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; font-size: 12px; }
        .card-actions button:hover { background: #f1f5f9; border-color: #1d8a8a; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; padding: 16px; margin-top: 16px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-details { max-width: 600px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1 / -1; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .sub-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .detail-item label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .detail-item p { margin: 0; font-size: 14px; color: #1f2937; }
        .detail-item.full { grid-column: span 2; }
        .review-info { background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        .review-info p { margin: 4px 0; font-size: 13px; }
        .disburse-info { background: #e0e7ff; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .empty-state { text-align: center; padding: 60px; color: #6b7280; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .sub-grid { grid-template-columns: 1fr; } .details-grid { grid-template-columns: 1fr; } .detail-item.full { grid-column: span 1; } }
      `}</style>
    </div>
  );
}