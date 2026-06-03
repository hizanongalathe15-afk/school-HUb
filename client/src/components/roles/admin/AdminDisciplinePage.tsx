// client/src/components/roles/admin/AdminDisciplinePage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, Save, AlertTriangle, CheckCircle, Clock,
  Eye, Bell, Mail, MessageCircle, FileText, Filter, TrendingUp,
  TrendingDown, BarChart3, PieChart, Activity, Zap, Shield,
  Award, Heart, Flag, BookOpen, Users, Calendar, Settings,
  Copy, Archive, Printer, Share2, Star, AlertOctagon, Gavel
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disciplineService, notificationService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

interface DisciplineRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  studentEmail: string;
  studentPhone: string;
  type: 'merit' | 'demerit' | 'warning' | 'suspension' | 'expulsion';
  category: 'academic' | 'behavior' | 'attendance' | 'uniform' | 'other';
  description: string;
  points: number;
  date: Date;
  reportedBy: string;
  reportedByName: string;
  witnesses: string[];
  actionTaken: string;
  followUpDate?: Date;
  resolved: boolean;
  resolutionNotes?: string;
  parentNotified: boolean;
  parentResponse?: string;
  attachments: string[];
}

interface DisciplineRule {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  isActive: boolean;
  displayOnPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StudentStats {
  studentId: string;
  studentName: string;
  totalMerits: number;
  totalDemerits: number;
  totalWarnings: number;
  netPoints: number;
  status: 'good' | 'warning' | 'critical';
}

export default function AdminDisciplinePage() {
  const confirmation = useConfirmationDialog();
  
  // State Management
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [rules, setRules] = useState<DisciplineRule[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editing, setEditing] = useState<DisciplineRecord | null>(null);
  const [editingRule, setEditingRule] = useState<DisciplineRule | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<FileList | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'stats' | 'rules'>('list');
  const [selectedStudent, setSelectedStudent] = useState<StudentStats | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'email' | 'sms' | 'both'>('both');

  const [form, setForm] = useState<Partial<DisciplineRecord>>({ 
    studentId: '', type: 'demerit', category: 'behavior', description: '', 
    points: 1, reportedBy: '', witnesses: [], actionTaken: '', resolved: false
  });

  const [ruleForm, setRuleForm] = useState<Partial<DisciplineRule>>({
    title: '', description: '', category: 'behavior', points: 1, isActive: true, displayOnPublic: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsData, rulesData, statsData] = await Promise.all([
        disciplineService.getAll({
          type: typeFilter !== 'all' ? typeFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          resolved: statusFilter === 'resolved' ? true : statusFilter === 'pending' ? false : undefined,
          search: searchTerm || undefined
        }),
        disciplineService.getRules?.() || [],
        disciplineService.getStats?.() || []
      ]);
      setRecords(recordsData || []);
      setRules(rulesData || []);
      setStudentStats(statsData || []);
    } catch (error) {
      toast.error('Failed to load discipline data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [typeFilter, categoryFilter, statusFilter, searchTerm]);

  const saveRecord = async () => {
    if (!form.studentId || !form.description) {
      toast.error('Student ID and description are required');
      return;
    }
    
    try {
      let savedRecord;
      if (editing) {
        savedRecord = await disciplineService.updateRecord(editing.id, form);
        toast.success('Record updated successfully');
      } else {
        savedRecord = await disciplineService.createRecord(form);
        toast.success('Discipline record created');
        
        // Send notifications for demerits/warnings
        if (form.type === 'demerit' || form.type === 'warning' || form.type === 'suspension') {
          await sendParentNotification(savedRecord);
        }
      }
      
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save record');
    }
  };

  const sendParentNotification = async (record: DisciplineRecord) => {
    try {
      const student = await disciplineService.getStudentDetails(record.studentId);
      if (student?.parentEmail || student?.parentPhone) {
        await notificationService.sendDisciplineAlert({
          studentName: student.name,
          studentClass: student.class,
          type: record.type,
          description: record.description,
          points: record.points,
          parentEmail: student.parentEmail,
          parentPhone: student.parentPhone,
          channels: notificationType === 'email' ? ['email'] : notificationType === 'sms' ? ['sms'] : ['email', 'sms']
        });
        toast.success(`Parent notified via ${notificationType}`);
      }
    } catch (error) {
      console.error('Notification failed:', error);
    }
  };

  const saveRule = async () => {
    if (!ruleForm.title || !ruleForm.description) {
      toast.error('Title and description are required');
      return;
    }
    
    try {
      if (editingRule) {
        await disciplineService.updateRule(editingRule.id, ruleForm);
        toast.success('Rule updated');
      } else {
        await disciplineService.createRule(ruleForm);
        toast.success('Rule created');
      }
      fetchData();
      setShowRulesModal(false);
      setRuleForm({ title: '', description: '', category: 'behavior', points: 1, isActive: true, displayOnPublic: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save rule');
    }
  };

  const deleteRecord = async (id: string) => {
    const confirmOptions = {
      title: 'Delete Record',
      message: 'Are you sure you want to delete this discipline record?',
      confirmText: 'Delete',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await disciplineService.deleteRecord(id);
        toast.success('Record deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const deleteRule = async (id: string) => {
    const confirmOptions = {
      title: 'Delete Rule',
      message: 'Remove this discipline rule?',
      confirmText: 'Delete',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await disciplineService.deleteRule(id);
        toast.success('Rule deleted');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const resolveRecord = async (id: string, resolutionNotes: string) => {
    try {
      await disciplineService.resolveRecord(id, resolutionNotes);
      toast.success('Record marked as resolved');
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve');
    }
  };

  const bulkDelete = async () => {
    const confirmOptions = {
      title: 'Bulk Delete',
      message: `Delete ${selected.length} selected records?`,
      confirmText: 'Delete All',
      type: 'danger' as const,
    };
    
    const result = await confirmation.confirm(confirmOptions);
    if (result) {
      try {
        await Promise.all(selected.map(id => disciplineService.deleteRecord(id)));
        toast.success(`${selected.length} records deleted`);
        setSelected([]);
        fetchData();
      } catch (error) {
        toast.error('Bulk delete failed');
      }
    }
  };

  const exportData = async () => {
    try {
      const blob = await disciplineService.exportRecords({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        startDate: undefined,
        endDate: undefined
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `discipline_records_${new Date().toISOString()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportFiles(e.dataTransfer.files);
    setShowImport(true);
  };

  const doImport = async () => {
    if (!importFiles) return;
    try {
      for (const file of Array.from(importFiles)) {
        await disciplineService.importRecords(file);
      }
      toast.success('Import completed');
      setShowImport(false);
      fetchData();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(r => r.id));
    }
  };

  const resetForm = () => {
    setForm({ 
      studentId: '', type: 'demerit', category: 'behavior', description: '', 
      points: 1, reportedBy: '', witnesses: [], actionTaken: '', resolved: false
    });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'merit': return <Award size={14} className="text-green-600" />;
      case 'demerit': return <AlertTriangle size={14} className="text-red-600" />;
      case 'warning': return <AlertOctagon size={14} className="text-orange-600" />;
      case 'suspension': return <Clock size={14} className="text-purple-600" />;
      case 'expulsion': return <X size={14} className="text-red-800" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      merit: 'bg-green-100 text-green-800',
      demerit: 'bg-red-100 text-red-800',
      warning: 'bg-orange-100 text-orange-800',
      suspension: 'bg-purple-100 text-purple-800',
      expulsion: 'bg-red-200 text-red-900'
    };
    return <span className={`type-badge ${styles[type as keyof typeof styles]}`}>{type.toUpperCase()}</span>;
  };

  const getStatusBadge = (resolved: boolean) => {
    return resolved 
      ? <span className="status-badge resolved"><CheckCircle size={12} /> Resolved</span>
      : <span className="status-badge pending"><Clock size={12} /> Pending</span>;
  };

  const filtered = records.filter(r => 
    (r.studentName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeRules = rules.filter(r => r.isActive && r.displayOnPublic);
  const totalMerits = records.filter(r => r.type === 'merit').reduce((sum, r) => sum + r.points, 0);
  const totalDemerits = records.filter(r => r.type === 'demerit' || r.type === 'warning').reduce((sum, r) => sum + r.points, 0);
  const pendingCases = records.filter(r => !r.resolved).length;

  return (
    <div className="discipline-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><Gavel size={24} /> Discipline Management System</h2>
          <p>Track student behavior, manage rules, and maintain discipline records</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>📋 Records</button>
            <button className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`} onClick={() => setViewMode('stats')}>📊 Stats</button>
            <button className={`view-btn ${viewMode === 'rules' ? 'active' : ''}`} onClick={() => setViewMode('rules')}>📜 Rules</button>
          </div>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}><RefreshCcw size={16} /> Refresh</button>
          <button className="btn btn-secondary" onClick={exportData}><Download size={16} /> Export</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); resetForm(); setShowModal(true); }}><Plus size={16} /> Add Record</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="quick-stat"><Award size={20} /><div><span>{totalMerits}</span><label>Total Merits</label></div></div>
        <div className="quick-stat warning"><AlertTriangle size={20} /><div><span>{totalDemerits}</span><label>Total Demerits</label></div></div>
        <div className="quick-stat info"><Clock size={20} /><div><span>{pendingCases}</span><label>Pending Cases</label></div></div>
        <div className="quick-stat success"><CheckCircle size={20} /><div><span>{records.length}</span><label>Total Records</label></div></div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box"><Search size={16} /><input placeholder="Search by student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">All Types</option><option value="merit">Merit</option><option value="demerit">Demerit</option><option value="warning">Warning</option><option value="suspension">Suspension</option><option value="expulsion">Expulsion</option></select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="all">All Categories</option><option value="academic">Academic</option><option value="behavior">Behavior</option><option value="attendance">Attendance</option><option value="uniform">Uniform</option><option value="other">Other</option></select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="resolved">Resolved</option></select>
        {selected.length > 0 && (<button className="btn btn-danger" onClick={bulkDelete}><Trash2 size={16} /> Delete ({selected.length})</button>)}
      </div>

      {/* Drag & Drop Import */}
      <div className="drag-zone" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={24} /> Drag & drop Excel/CSV files here for bulk import
      </div>

      {/* Content Views */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading discipline records...</p></div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th><button onClick={toggleAll}>{selected.length === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}</button></th><th>Student</th><th>Type</th><th>Category</th><th>Description</th><th>Points</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className={!r.resolved ? 'unresolved' : ''}>
                  <td><button onClick={() => toggleSelect(r.id)}>{selected.includes(r.id) ? <CheckSquare size={16} className="checked" /> : <Square size={16} />}</button></td>
                  <td><div><strong>{r.studentName}</strong><div className="sub-text">{r.studentId} | {r.studentClass}</div></div></td>
                  <td>{getTypeBadge(r.type)}</td>
                  <td><span className="category-badge">{r.category}</span></td>
                  <td className="description-cell">{r.description}</td>
                  <td className={r.type === 'merit' ? 'points-positive' : 'points-negative'}>{r.type === 'merit' ? '+' : '-'}{r.points}</td>
                  <td>{getStatusBadge(r.resolved)}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td><div className="action-buttons"><button title="Edit" onClick={() => { setEditing(r); setForm(r); setShowModal(true); }}><Edit size={14} /></button><button title="Notify Parent" onClick={() => { setSelectedStudent({ studentId: r.studentId, studentName: r.studentName } as any); setNotificationMessage(r.description); setShowNotificationModal(true); }}><Bell size={14} /></button><button title="Resolve" onClick={() => { const notes = prompt('Resolution notes:'); if (notes) resolveRecord(r.id, notes); }}><CheckCircle size={14} /></button><button title="Delete" className="danger" onClick={() => deleteRecord(r.id)}><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'stats' ? (
        <div className="stats-view">
          <div className="stats-header"><h3>Student Behavior Summary</h3><button className="btn btn-secondary" onClick={() => setShowStatsModal(true)}><BarChart3 size={16} /> Detailed Report</button></div>
          <div className="student-stats-grid">
            {studentStats.map(s => (
              <div key={s.studentId} className={`student-stat-card ${s.status}`}>
                <div className="student-stat-header"><strong>{s.studentName}</strong><span className="student-id">{s.studentId}</span></div>
                <div className="student-stat-points"><div className="merits">👍 {s.totalMerits}</div><div className="demerits">👎 {s.totalDemerits}</div><div className="net">Net: {s.netPoints}</div></div>
                <div className="student-stat-status">{s.status === 'good' ? '✅ Good Standing' : s.status === 'warning' ? '⚠️ Warning' : '🔴 Critical'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rules-view">
          <div className="rules-header"><h3>School Discipline Rules & Guidelines</h3><button className="btn btn-primary" onClick={() => { setEditingRule(null); setRuleForm({ title: '', description: '', category: 'behavior', points: 1, isActive: true, displayOnPublic: true }); setShowRulesModal(true); }}><Plus size={16} /> Add Rule</button></div>
          <div className="rules-grid">
            {rules.map(rule => (
              <div key={rule.id} className={`rule-card ${!rule.isActive ? 'inactive' : ''}`}>
                <div className="rule-header"><h4>{rule.title}</h4><div className="rule-actions"><button onClick={() => { setEditingRule(rule); setRuleForm(rule); setShowRulesModal(true); }}><Edit size={14} /></button><button className="danger" onClick={() => deleteRule(rule.id)}><Trash2 size={14} /></button></div></div>
                <p className="rule-description">{rule.description}</p>
                <div className="rule-meta"><span className="rule-category">{rule.category}</span><span className="rule-points">{rule.points} point{rule.points !== 1 ? 's' : ''}</span>{rule.displayOnPublic && <span className="public-badge">🌐 Public</span>}</div>
              </div>
            ))}
          </div>
          {activeRules.length > 0 && (
            <div className="public-rules"><h4>📢 Rules Displayed to Public</h4><div className="public-rules-list">{activeRules.map(rule => <div key={rule.id} className="public-rule-item"><strong>{rule.title}</strong><p>{rule.description}</p></div>)}</div></div>
          )}
        </div>
      )}

      {/* Add/Edit Record Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Discipline Record' : 'New Discipline Record'}</h3><button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label>Student ID *</label><input value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})} placeholder="Enter student ID" /></div>
                <div className="form-group"><label>Type *</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}><option value="merit">Merit (Positive)</option><option value="demerit">Demerit (Negative)</option><option value="warning">Warning</option><option value="suspension">Suspension</option><option value="expulsion">Expulsion</option></select></div>
                <div className="form-group"><label>Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}><option value="academic">Academic</option><option value="behavior">Behavior</option><option value="attendance">Attendance</option><option value="uniform">Uniform</option><option value="other">Other</option></select></div>
                <div className="form-group"><label>Points</label><input type="number" value={form.points} onChange={e => setForm({...form, points: parseInt(e.target.value)})} /></div>
                <div className="form-group full"><label>Description *</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the incident..." /></div>
                <div className="form-group"><label>Reported By</label><input value={form.reportedBy} onChange={e => setForm({...form, reportedBy: e.target.value})} placeholder="Teacher/Admin name" /></div>
                <div className="form-group"><label>Action Taken</label><input value={form.actionTaken} onChange={e => setForm({...form, actionTaken: e.target.value})} placeholder="What action was taken?" /></div>
                <div className="form-group checkbox"><label><input type="checkbox" checked={form.resolved} onChange={e => setForm({...form, resolved: e.target.checked})} /> Mark as Resolved</label></div>
              </div>
              <div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveRecord}>Save Record</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="modal-overlay" onClick={() => setShowRulesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editingRule ? 'Edit Rule' : 'Add New Rule'}</h3><button className="modal-close" onClick={() => setShowRulesModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><div className="form-group"><label>Title *</label><input value={ruleForm.title} onChange={e => setRuleForm({...ruleForm, title: e.target.value})} placeholder="Rule title" /></div><div className="form-group"><label>Description *</label><textarea rows={3} value={ruleForm.description} onChange={e => setRuleForm({...ruleForm, description: e.target.value})} placeholder="Detailed rule description" /></div><div className="form-group"><label>Category</label><select value={ruleForm.category} onChange={e => setRuleForm({...ruleForm, category: e.target.value})}><option value="academic">Academic</option><option value="behavior">Behavior</option><option value="attendance">Attendance</option><option value="uniform">Uniform</option></select></div><div className="form-group"><label>Points</label><input type="number" value={ruleForm.points} onChange={e => setRuleForm({...ruleForm, points: parseInt(e.target.value)})} /></div><div className="form-group checkbox"><label><input type="checkbox" checked={ruleForm.isActive} onChange={e => setRuleForm({...ruleForm, isActive: e.target.checked})} /> Active</label></div><div className="form-group checkbox"><label><input type="checkbox" checked={ruleForm.displayOnPublic} onChange={e => setRuleForm({...ruleForm, displayOnPublic: e.target.checked})} /> Display on Public Page</label></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowRulesModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveRule}>{editingRule ? 'Update' : 'Create'}</button></div></div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Notify Parent - {selectedStudent.studentName}</h3><button className="modal-close" onClick={() => setShowNotificationModal(false)}><X size={20} /></button></div>
            <div className="modal-body"><div className="form-group"><label>Message</label><textarea rows={4} value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} placeholder="Message to parent..." /></div><div className="form-group"><label>Send via</label><select value={notificationType} onChange={e => setNotificationType(e.target.value as any)}><option value="email">Email Only</option><option value="sms">SMS Only</option><option value="both">Both Email & SMS</option></select></div><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowNotificationModal(false)}>Cancel</button><button className="btn btn-primary" onClick={async () => { await sendParentNotification({ studentId: selectedStudent.studentId } as any); setShowNotificationModal(false); }}>Send Notification</button></div></div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Discipline Records</h3><button className="modal-close" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body"><input type="file" multiple onChange={e => setImportFiles(e.target.files)} accept=".xlsx,.csv" /><div className="form-actions"><button className="btn btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn btn-primary" onClick={doImport}>Import</button></div></div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmation.isOpen} title={confirmation.options?.title || ''} message={confirmation.options?.message || ''} confirmLabel={confirmation.options?.confirmText} cancelLabel={confirmation.options?.cancelText} type={confirmation.options?.type} onConfirm={confirmation.handleConfirm} onCancel={confirmation.handleCancel} />

      <style>{`
        .discipline-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        .page-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .quick-stat { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .quick-stat span { font-size: 24px; font-weight: 700; display: block; }
        .quick-stat label { font-size: 12px; color: #6b7280; }
        .quick-stat.warning { border-left: 4px solid #f59e0b; }
        .quick-stat.info { border-left: 4px solid #3b82f6; }
        .quick-stat.success { border-left: 4px solid #10b981; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .drag-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px; background: white; cursor: pointer; }
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr.unresolved { background: #fffbeb; }
        .sub-text { font-size: 11px; color: #6b7280; }
        .type-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .category-badge { background: #e0e7ff; color: #4f46e5; padding: 2px 6px; border-radius: 8px; font-size: 10px; }
        .points-positive { color: #10b981; font-weight: 600; }
        .points-negative { color: #ef4444; font-weight: 600; }
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
        .status-badge.resolved { background: #d1fae5; color: #10b981; }
        .status-badge.pending { background: #fed7aa; color: #f59e0b; }
        .description-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .action-buttons { display: flex; gap: 4px; }
        .action-buttons button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .action-buttons button:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-buttons button.danger:hover { background: #fef2f2; color: #dc2626; }
        .stats-view { background: white; border-radius: 12px; padding: 20px; }
        .stats-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .student-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
        .student-stat-card { padding: 16px; border-radius: 12px; background: white; border: 1px solid #e5e7eb; }
        .student-stat-card.good { border-left: 4px solid #10b981; }
        .student-stat-card.warning { border-left: 4px solid #f59e0b; }
        .student-stat-card.critical { border-left: 4px solid #ef4444; background: #fef2f2; }
        .student-stat-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .student-id { font-size: 11px; color: #6b7280; }
        .student-stat-points { display: flex; gap: 16px; margin-bottom: 8px; font-size: 13px; }
        .merits { color: #10b981; }
        .demerits { color: #ef4444; }
        .net { font-weight: 600; }
        .student-stat-status { font-size: 12px; }
        .rules-view { background: white; border-radius: 12px; padding: 20px; }
        .rules-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .rules-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 32px; }
        .rule-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .rule-card.inactive { opacity: 0.6; background: #f8fafc; }
        .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .rule-header h4 { margin: 0; font-size: 16px; }
        .rule-actions { display: flex; gap: 4px; }
        .rule-description { font-size: 13px; color: #4b5563; margin-bottom: 12px; }
        .rule-meta { display: flex; gap: 8px; font-size: 11px; }
        .rule-category { background: #e0e7ff; padding: 2px 6px; border-radius: 4px; }
        .rule-points { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .public-badge { background: #d1fae5; color: #10b981; padding: 2px 6px; border-radius: 4px; }
        .public-rules { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
        .public-rules-list { display: grid; gap: 12px; margin-top: 12px; }
        .public-rule-item { padding: 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1d8a8a; }
        .public-rule-item strong { display: block; margin-bottom: 4px; }
        .public-rule-item p { margin: 0; font-size: 13px; color: #4b5563; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: span 2; }
        .form-group.checkbox { flex-direction: row; align-items: center; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } .stats-row { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}