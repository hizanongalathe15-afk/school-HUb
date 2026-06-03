// client/src/components/roles/admin/AdminReportCenterPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, RefreshCcw, X, Upload, Download, 
  CheckSquare, Square, Save, FileText, Calendar, Clock, 
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  DownloadCloud, Mail, Printer, Share2, Copy, Link,
  Filter, Settings, Eye, EyeOff, AlertCircle, CheckCircle,
  Award, Users, BookOpen, DollarSign, Activity, Heart,
  Building2, GraduationCap, Clock as ClockIcon, MapPin,
  Phone, Mail as MailIcon, Globe, Shield, Lock, Unlock,
  ChevronDown, ChevronUp, MoreVertical, PlusCircle, MinusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsService } from '../../../services/adminService';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { confirmationMessages, createConfirmationWithCallback } from '../../../utils/confirmationHelper';

interface Report {
  id: string;
  title: string;
  type: 'academic' | 'financial' | 'attendance' | 'discipline' | 'inventory' | 'health' | 'staff' | 'custom';
  description: string;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
  lastRun: string | null;
  nextRun: string | null;
  status: 'active' | 'paused' | 'completed' | 'failed';
  recipients: string[];
  filters: Record<string, any>;
  columns: string[];
  createdAt: string;
  createdBy: string;
  lastGenerated: string | null;
  downloadCount: number;
  size: number;
}

interface ReportStats {
  totalReports: number;
  activeReports: number;
  totalDownloads: number;
  totalSize: number;
  last24Hours: number;
  popularTypes: Record<string, number>;
}

interface GeneratedReport {
  id: string;
  reportId: string;
  title: string;
  generatedAt: string;
  size: number;
  url: string;
  status: 'success' | 'failed' | 'processing';
}

export default function AdminReportCenterPage() {
  const confirmation = useConfirmationDialog();
  const [reports, setReports] = useState<Report[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    activeReports: 0,
    totalDownloads: 0,
    totalSize: 0,
    last24Hours: 0,
    popularTypes: {}
  });
  const [form, setForm] = useState({
    title: '',
    type: 'academic' as const,
    description: '',
    format: 'pdf' as const,
    schedule: 'monthly' as const,
    recipients: [] as string[],
    filters: {},
    columns: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, generatedData, statsData] = await Promise.all([
        reportsService.getAllReports(),
        reportsService.getGeneratedReports(),
        reportsService.getReportStats()
      ]);
      setReports(reportsData || []);
      setGeneratedReports(generatedData || []);
      setStats(statsData);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generateReport = async (reportId: string) => {
    setGenerating(true);
    try {
      const result = await reportsService.generateReport(reportId);
      toast.success(`Report generated: ${result.filename}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string, generatedId: string) => {
    try {
      const blob = await reportsService.downloadReport(generatedId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
      fetchData();
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const scheduleReport = async () => {
    if (!form.title) {
      toast.error('Report title required');
      return;
    }
    try {
      await reportsService.createReport(form);
      toast.success('Report scheduled successfully');
      fetchData();
      setShowModal(false);
      setForm({ title: '', type: 'academic', description: '', format: 'pdf', schedule: 'monthly', recipients: [], filters: {}, columns: [] });
    } catch (error) {
      toast.error('Failed to schedule report');
    }
  };

  const deleteReport = async (id: string) => {
    const confirmOptions = createConfirmationWithCallback(
      confirmationMessages.deleteReport(reports.find(r => r.id === id)?.title || 'this report'),
      async () => {
        await reportsService.deleteReport(id);
        toast.success('Report deleted');
        fetchData();
      }
    );
    await confirmation.confirm(confirmOptions);
  };

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(r => r.id));
  const bulkDelete = async () => {
    const confirmed = await confirmation.confirm({
      title: 'Bulk Delete',
      message: `Delete ${selected.length} report(s)?`,
      confirmText: 'Delete All',
      type: 'danger'
    });
    if (confirmed) {
      await Promise.all(selected.map(id => reportsService.deleteReport(id)));
      toast.success('Deleted');
      setSelected([]);
      fetchData();
    }
  };

  const exportConfigs = async () => {
    const blob = await reportsService.exportReportConfigs();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_configs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configs exported');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImportFiles(Array.from(e.dataTransfer.files));
    setShowImport(true);
  };

  const doImport = async () => {
    for (const file of importFiles) {
      await reportsService.importReportConfigs(file);
    }
    toast.success('Configs imported');
    setShowImport(false);
    fetchData();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      academic: <GraduationCap size={14} />,
      financial: <DollarSign size={14} />,
      attendance: <Calendar size={14} />,
      discipline: <Shield size={14} />,
      inventory: <Package size={14} />,
      health: <Heart size={14} />,
      staff: <Users size={14} />
    };
    return icons[type] || <FileText size={14} />;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800'
    };
    return <span className={`status-badge ${colors[status]}`}>{status}</span>;
  };

  const getScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      on_demand: 'On Demand'
    };
    return labels[schedule] || schedule;
  };

  const filtered = reports.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="report-center-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><FileText size={28} /> Report Center</h1>
          <p>Schedule, generate, and export comprehensive school reports</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportConfigs} className="btn-secondary">
            <Download size={16} /> Export Configs
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={16} /> Import Configs
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Schedule Report
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card"><FileText size={20} /><div><span className="stat-value">{stats.totalReports}</span><span className="stat-label">Total Reports</span></div></div>
        <div className="stat-card stat-green"><CheckCircle size={20} /><div><span className="stat-value">{stats.activeReports}</span><span className="stat-label">Active</span></div></div>
        <div className="stat-card"><Download size={20} /><div><span className="stat-value">{stats.totalDownloads}</span><span className="stat-label">Downloads</span></div></div>
        <div className="stat-card"><Clock size={20} /><div><span className="stat-value">{stats.last24Hours}</span><span className="stat-label">Last 24h</span></div></div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} report(s) selected</span>
          <button onClick={bulkDelete} className="btn-danger"><Trash2 size={14} /> Delete Selected</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search reports by title or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
          <option value="all">All Types</option>
          <option value="academic">Academic</option>
          <option value="financial">Financial</option>
          <option value="attendance">Attendance</option>
          <option value="discipline">Discipline</option>
          <option value="inventory">Inventory</option>
          <option value="health">Health</option>
          <option value="staff">Staff</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Drag & Drop Import Area */}
      <div className="drag-drop-area" onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
        <Upload size={28} />
        <p>Drag & drop report configuration files (JSON, Excel)</p>
        <small>Batch import multiple report schedules</small>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading reports...</p></div>
      ) : (
        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                <th>Report Name</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Next Run</th>
                <th>Status</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(report => (
                <tr key={report.id}>
                  <td><input type="checkbox" checked={selected.includes(report.id)} onChange={() => toggle(report.id)} /></td>
                  <td>
                    <div className="report-cell">
                      <FileText size={16} />
                      <div>
                        <div className="report-title">{report.title}</div>
                        <div className="report-desc">{report.description.substring(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="type-badge">{getTypeIcon(report.type)} {report.type}</span></td>
                  <td>{getScheduleLabel(report.schedule)}</td>
                  <td>{report.lastRun ? new Date(report.lastRun).toLocaleDateString() : 'Never'}</td>
                  <td>{report.nextRun ? new Date(report.nextRun).toLocaleDateString() : '-'}</td>
                  <td>{getStatusBadge(report.status)}</td>
                  <td>{report.downloadCount || 0}</td>
                  <td className="actions-cell">
                    <button onClick={() => generateReport(report.id)} disabled={generating} title="Generate Now"><RefreshCcw size={14} /></button>
                    <button onClick={() => { setSelectedReport(report); setShowDetailsModal(true); }} title="View Details"><Eye size={14} /></button>
                    <button onClick={() => { setForm(report); setShowModal(true); }} title="Edit"><Edit size={14} /></button>
                    <button onClick={() => deleteReport(report.id)} className="danger" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="empty-state">No reports found. Schedule your first report.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{form.title ? 'Edit Report' : 'Schedule New Report'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); scheduleReport(); }}>
                <div className="form-group"><label>Report Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., Termly Academic Report" required /></div>
                <div className="form-group"><label>Report Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                  <option value="academic">Academic Report</option>
                  <option value="financial">Financial Report</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="discipline">Discipline Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="health">Health Report</option>
                  <option value="staff">Staff Report</option>
                </select></div>
                <div className="form-group"><label>Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="What data should this report include?" /></div>
                <div className="form-row"><div className="form-group"><label>Format</label><select value={form.format} onChange={e => setForm({...form, format: e.target.value as any})}><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option><option value="json">JSON</option></select></div>
                <div className="form-group"><label>Schedule</label><select value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value as any})}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="on_demand">On Demand (Manual)</option></select></div></div>
                <div className="form-group"><label>Recipients (comma separated emails)</label><input value={form.recipients.join(', ')} onChange={e => setForm({...form, recipients: e.target.value.split(',').map(s => s.trim())})} placeholder="admin@school.com, principal@school.com" /></div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary"><Save size={16} /> {form.title ? 'Update' : 'Schedule'} Report</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedReport.title}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-section"><strong>Type:</strong> {selectedReport.type}</div>
              <div className="detail-section"><strong>Description:</strong> {selectedReport.description}</div>
              <div className="detail-section"><strong>Schedule:</strong> {getScheduleLabel(selectedReport.schedule)}</div>
              <div className="detail-section"><strong>Format:</strong> {selectedReport.format.toUpperCase()}</div>
              <div className="detail-section"><strong>Last Run:</strong> {selectedReport.lastRun ? new Date(selectedReport.lastRun).toLocaleString() : 'Never'}</div>
              <div className="detail-section"><strong>Next Run:</strong> {selectedReport.nextRun ? new Date(selectedReport.nextRun).toLocaleString() : 'Not scheduled'}</div>
              <div className="detail-section"><strong>Recipients:</strong> {selectedReport.recipients?.join(', ') || 'None'}</div>
              <div className="detail-section"><strong>Total Downloads:</strong> {selectedReport.downloadCount || 0}</div>
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button><button className="btn-primary" onClick={() => generateReport(selectedReport.id)}>Generate Now</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Import Report Configurations</h3><button className="close-btn" onClick={() => setShowImport(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <p>Upload JSON or Excel files with report configurations</p>
              <input type="file" multiple accept=".json,.xlsx,.csv" onChange={e => e.target.files && setImportFiles(Array.from(e.target.files))} />
              <div className="modal-footer"><button className="btn-secondary" onClick={() => setShowImport(false)}>Cancel</button><button className="btn-primary" onClick={doImport}>Import {importFiles.length} File(s)</button></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText || 'Confirm'}
        cancelLabel={confirmation.options?.cancelText || 'Cancel'}
        type={confirmation.options?.type || 'default'}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />

      <style>{`
        .report-center-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-danger { background: #ef4444; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .stats-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-label { font-size: 12px; color: #64748b; }
        .stat-green { border-left: 3px solid #10b981; }
        .bulk-bar { background: #fee2e2; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
        .drag-drop-area { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px; background: #f8fafc; cursor: pointer; }
        .table-container { background: white; border-radius: 12px; overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .reports-table { width: 100%; border-collapse: collapse; }
        .reports-table th { text-align: left; padding: 12px 16px; background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .reports-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .report-cell { display: flex; align-items: center; gap: 12px; }
        .report-title { font-weight: 600; }
        .report-desc { font-size: 11px; color: #64748b; }
        .type-badge { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 11px; text-transform: capitalize; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
        .actions-cell { display: flex; gap: 6px; }
        .actions-cell button { background: none; border: none; padding: 6px; border-radius: 4px; cursor: pointer; color: #64748b; }
        .actions-cell button:hover { background: #f1f5f9; }
        .actions-cell button.danger:hover { background: #fee2e2; color: #ef4444; }
        .empty-state { text-align: center; padding: 40px; color: #64748b; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-medium { width: 500px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: #374151; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .detail-section { margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-section strong { display: inline-block; width: 100px; }
        .loading-state { text-align: center; padding: 60px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// Add missing import
import { Package } from 'lucide-react';