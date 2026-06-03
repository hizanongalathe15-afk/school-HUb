// client/src/components/roles/admin/AdminTermsPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit, Trash2, Eye, RefreshCcw, X, Calendar,
  FileText, Clock, AlertCircle, CheckCircle, Copy, Archive,
  Settings, Users, BookOpen, DollarSign, BarChart3, Send,
  CalendarDays, Timer, Award, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight, Download, Upload, Filter,
  Lock, Unlock, Repeat, Zap, Shield, Bell, Mail, Smartphone,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService, systemSettingsService } from '../../../services/adminService';
import type { AcademicTerm, TermStatistics, TermAction } from '../../../types/admin';

export default function AdminTermsPage() {
  // State Management
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<AcademicTerm | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<AcademicTerm | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [termStatistics, setTermStatistics] = useState<TermStatistics | null>(null);
  const [systemWideSync, setSystemWideSync] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'timeline'>('list');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'archive' | 'delete' | null>(null);
  
  // Real-time calculation states
  const [calculating, setCalculating] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const data = await academicManagementService.getTerms();
      setTerms(data);
      await fetchTermStatistics();
    } catch (error) {
      toast.error('Failed to load terms');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTermStatistics = async () => {
    try {
      const stats = await academicManagementService.getTermStatistics();
      setTermStatistics(stats);
    } catch (error) {
      console.error('Failed to load term statistics:', error);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  // Auto-calculate term durations and conflicts
  const calculateTermDetails = useCallback(async (termData: Partial<AcademicTerm>) => {
    if (!autoCalculate) return termData;
    
    setCalculating(true);
    try {
      const calculated = await academicManagementService.calculateTermDetails(termData);
      return calculated;
    } catch (error) {
      console.error('Calculation failed:', error);
      return termData;
    } finally {
      setCalculating(false);
    }
  }, [autoCalculate]);

  const handleCreateTerm = async (data: Partial<AcademicTerm>) => {
    try {
      // Auto-calculate term details
      const calculatedData = await calculateTermDetails(data);
      
      // Check for conflicts
      const hasConflict = await academicManagementService.checkTermConflicts(calculatedData);
      if (hasConflict) {
        toast.error('Term dates conflict with existing terms');
        return;
      }
      
      const newTerm = await academicManagementService.createTerm(calculatedData as Omit<AcademicTerm, 'id'>);
      toast.success('Term created successfully');
      
      // System-wide synchronization
      if (systemWideSync) {
        await syncTermToSystem(newTerm);
      }
      
      // Send notifications
      await sendTermNotifications('create', newTerm);
      
      fetchTerms();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create term');
    }
  };

  const handleUpdateTerm = async (id: string, data: Partial<AcademicTerm>) => {
    try {
      // Auto-calculate updated details
      const calculatedData = await calculateTermDetails(data);
      
      // Validate if term can be updated
      const canUpdate = await academicManagementService.canModifyTerm(id);
      if (!canUpdate && !confirm('This term has started. Update anyway?')) {
        return;
      }
      
      const updatedTerm = await academicManagementService.updateTerm(id, calculatedData);
      toast.success('Term updated successfully');
      
      // System-wide sync
      if (systemWideSync) {
        await syncTermToSystem(updatedTerm);
      }
      
      // Send notifications for changes
      await sendTermNotifications('update', updatedTerm);
      
      fetchTerms();
      setShowModal(false);
      setEditingTerm(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update term');
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this term? This will affect all associated data.')) return;
    
    try {
      // Check if term has dependent data
      const dependencies = await academicManagementService.getTermDependencies(id);
      if (dependencies.length > 0) {
        toast.error(`Cannot delete: Term has ${dependencies.length} dependencies (fees, exams, etc.)`);
        return;
      }
      
      await academicManagementService.deleteTerm(id);
      toast.success('Term deleted successfully');
      fetchTerms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete term');
    }
  };

  const handleArchiveTerm = async (id: string) => {
    try {
      await academicManagementService.archiveTerm(id);
      toast.success('Term archived successfully');
      fetchTerms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive term');
    }
  };

  const handleRestoreTerm = async (id: string) => {
    try {
      await academicManagementService.restoreTerm(id);
      toast.success('Term restored successfully');
      fetchTerms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to restore term');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTerms.length === 0) return;
    
    const confirmMsg = `Are you sure you want to ${bulkAction} ${selectedTerms.length} term(s)?`;
    if (!confirm(confirmMsg)) return;
    
    try {
      await academicManagementService.bulkAction(selectedTerms, bulkAction);
      toast.success(`${selectedTerms.length} term(s) ${bulkAction}d successfully`);
      setSelectedTerms([]);
      fetchTerms();
      setShowBulkModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Bulk action failed');
    }
  };

  const syncTermToSystem = async (term: AcademicTerm) => {
    setSyncProgress(0);
    try {
      // Sync to different modules
      const modules = ['fees', 'exams', 'attendance', 'timetable', 'payroll'];
      for (let i = 0; i < modules.length; i++) {
        await academicManagementService.syncTermToModule(term.id, modules[i]);
        setSyncProgress(((i + 1) / modules.length) * 100);
      }
      toast.success('Term synced to all system modules');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Partial sync completed');
    } finally {
      setTimeout(() => setSyncProgress(0), 3000);
    }
  };

  const sendTermNotifications = async (action: string, term: AcademicTerm) => {
    try {
      const recipients = ['admins', 'teachers', 'parents'];
      for (const recipient of recipients) {
        await academicManagementService.sendTermNotification({
          action,
          term,
          recipientType: recipient,
          channels: ['email', 'sms', 'push']
        });
      }
      setNotifications(prev => [...prev, { action, term, timestamp: new Date() }]);
    } catch (error) {
      console.error('Notification failed:', error);
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Filter terms based on search term
  const filteredTerms = terms.filter(term => 
    term.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTermStatus = (term: AcademicTerm) => {
    const today = new Date();
    const start = new Date(term.startDate);
    const end = new Date(term.endDate);
    
    if (today < start) return { status: 'upcoming', color: '#f59e0b', icon: Clock };
    if (today > end) return { status: 'completed', color: '#10b981', icon: CheckCircle };
    return { status: 'active', color: '#3b82f6', icon: Activity };
  };

  const renderCalendarView = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const termsInYear = terms.filter(t => new Date(t.startDate).getFullYear() === currentYear);
    
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button onClick={() => setCurrentYear(currentYear - 1)}><ChevronLeft size={20} /></button>
          <h3>{currentYear}</h3>
          <button onClick={() => setCurrentYear(currentYear + 1)}><ChevronRight size={20} /></button>
        </div>
        <div className="calendar-grid">
          {months.map((month, idx) => {
            const termsInMonth = termsInYear.filter(t => new Date(t.startDate).getMonth() === idx);
            return (
              <div key={month} className="calendar-month">
                <div className="month-name">{month}</div>
                {termsInMonth.map(term => {
                  const startDay = new Date(term.startDate).getDate();
                  const endDay = new Date(term.endDate).getDate();
                  const status = getTermStatus(term);
                  return (
                    <div key={term.id} className="calendar-term" style={{ borderLeftColor: status.color }}>
                      <div className="term-name">{term.name}</div>
                      <div className="term-dates">{startDay}-{endDay}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimelineView = () => {
    const sortedTerms = [...terms].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const totalDuration = sortedTerms.length > 0 
      ? new Date(sortedTerms[sortedTerms.length - 1].endDate).getTime() - new Date(sortedTerms[0].startDate).getTime()
      : 1;
    
    return (
      <div className="timeline-view">
        <div className="timeline-track">
          {sortedTerms.map(term => {
            const start = new Date(term.startDate).getTime();
            const end = new Date(term.endDate).getTime();
            const startOffset = ((start - new Date(sortedTerms[0].startDate).getTime()) / totalDuration) * 100;
            const width = ((end - start) / totalDuration) * 100;
            const status = getTermStatus(term);
            
            return (
              <div 
                key={term.id} 
                className="timeline-term"
                style={{ left: `${startOffset}%`, width: `${width}%`, backgroundColor: status.color }}
              >
                <span className="timeline-label">{term.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-state">
          <div className="loader" />
          <p>Loading academic terms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-title">
          <h2>Academic Terms Management</h2>
          <p>Manage school terms, automatic calculations, and system-wide synchronization</p>
        </div>
        <div className="page-actions">
          <div className="toggle-group">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={autoCalculate} 
                onChange={(e) => setAutoCalculate(e.target.checked)} 
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">Auto-calculate</span>
            </label>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={systemWideSync} 
                onChange={(e) => setSystemWideSync(e.target.checked)} 
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">System Sync</span>
            </label>
          </div>
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <FileText size={16} /> List
            </button>
            <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
              <Calendar size={16} /> Calendar
            </button>
            <button className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`} onClick={() => setViewMode('timeline')}>
              <Clock size={16} /> Timeline
            </button>
          </div>
          <button className="btn btn-secondary" onClick={fetchTerms} disabled={loading}>
            <RefreshCcw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingTerm(null); setShowModal(true); }}>
            <Plus size={16} /> Add Term
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {termStatistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total"><CalendarDays size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.totalTerms}</span>
              <span className="stat-label">Total Terms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon active"><Activity size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.activeTerms}</span>
              <span className="stat-label">Active Terms</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon upcoming"><Clock size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.upcomingTerms}</span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed"><CheckCircle size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.completedTerms}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon archived"><Archive size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.archivedTerms}</span>
              <span className="stat-label">Archived</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning"><AlertTriangle size={24} /></div>
            <div className="stat-info">
              <span className="stat-value">{termStatistics.conflictingTerms}</span>
              <span className="stat-label">Conflicts</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search terms by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
          <select className="filter-select">
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          {selectedTerms.length > 0 && (
            <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
              Bulk Actions ({selectedTerms.length})
            </button>
          )}
        </div>
      </div>

      {/* Sync Progress Bar */}
      {syncProgress > 0 && (
        <div className="sync-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${syncProgress}%` }} />
          </div>
          <span>Syncing to system modules... {Math.round(syncProgress)}%</span>
        </div>
      )}

      {/* Content Views */}
      {viewMode === 'list' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedTerms.length === filteredTerms.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTerms(filteredTerms.map(t => t.id));
                      } else {
                        setSelectedTerms([]);
                      }
                    }}
                  />
                </th>
                <th>Term</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Duration</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.map((term) => {
                const status = getTermStatus(term);
                const daysRemaining = calculateDaysRemaining(term.endDate);
                const totalDays = Math.ceil((new Date(term.endDate).getTime() - new Date(term.startDate).getTime()) / (1000 * 60 * 60 * 24));
                const daysPassed = totalDays - daysRemaining;
                const progress = (daysPassed / totalDays) * 100;
                
                return (
                  <tr key={term.id} className={term.isArchived ? 'archived-row' : ''}>
                    <td className="checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedTerms.includes(term.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTerms([...selectedTerms, term.id]);
                          } else {
                            setSelectedTerms(selectedTerms.filter(id => id !== term.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: status.color + '20', color: status.color }}>
                          <Calendar size={20} />
                        </div>
                        <div className="user-info">
                          <span className="user-name">{term.name}</span>
                          {term.description && <span className="user-email">{term.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{new Date(term.startDate).toLocaleDateString()}</td>
                    <td>{new Date(term.endDate).toLocaleDateString()}</td>
                    <td>{totalDays} days</td>
                    <td>
                      {daysRemaining > 0 ? (
                        <span className="days-remaining">{daysRemaining} days left</span>
                      ) : daysRemaining === 0 ? (
                        <span className="days-end">Ends today</span>
                      ) : (
                        <span className="days-ended">Ended {Math.abs(daysRemaining)} days ago</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${status.status}`}>
                        {React.createElement(status.icon, { size: 12 })}
                        {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="mini-progress">
                          <div className="mini-progress-fill" style={{ width: `${progress}%`, background: status.color }} />
                        </div>
                        <span className="progress-text">{Math.round(progress)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" title="View Details" onClick={() => { setSelectedTerm(term); setShowDetailsModal(true); }}>
                          <Eye size={14} />
                        </button>
                        <button className="action-btn" title="Edit" onClick={() => { setEditingTerm(term); setShowModal(true); }}>
                          <Edit size={14} />
                        </button>
                        <button className="action-btn" title="Copy" onClick={() => handleCreateTerm({ ...term, name: `${term.name} (Copy)` })}>
                          <Copy size={14} />
                        </button>
                        {!term.isArchived ? (
                          <button className="action-btn" title="Archive" onClick={() => handleArchiveTerm(term.id)}>
                            <Archive size={14} />
                          </button>
                        ) : (
                          <button className="action-btn" title="Restore" onClick={() => handleRestoreTerm(term.id)}>
                            <Unlock size={14} />
                          </button>
                        )}
                        <button className="action-btn action-danger" title="Delete" onClick={() => handleDeleteTerm(term.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTerms.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <Calendar size={48} />
                    <p>No terms found</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                      <Plus size={16} /> Create your first term
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'timeline' && renderTimelineView()}

      {/* Add/Edit Term Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTerm ? 'Edit Term' : 'Add New Term'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  startDate: formData.get('startDate') as string,
                  endDate: formData.get('endDate') as string,
                  isActive: formData.get('isActive') === 'on',
                  academicYear: formData.get('academicYear') as string,
                  termNumber: parseInt(formData.get('termNumber') as string),
                  examPeriodStart: formData.get('examPeriodStart') as string,
                  examPeriodEnd: formData.get('examPeriodEnd') as string,
                  holidays: JSON.parse(formData.get('holidays') as string || '[]')
                };
                if (editingTerm) {
                  handleUpdateTerm(editingTerm.id, data);
                } else {
                  handleCreateTerm(data);
                }
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Term Name *</label>
                    <input type="text" name="name" defaultValue={editingTerm?.name} required placeholder="e.g., Term 1 2024" />
                  </div>
                  <div className="form-group">
                    <label>Academic Year *</label>
                    <input type="text" name="academicYear" defaultValue={editingTerm?.academicYear || new Date().getFullYear().toString()} required />
                  </div>
                  <div className="form-group">
                    <label>Term Number *</label>
                    <input type="number" name="termNumber" defaultValue={editingTerm?.termNumber || 1} min="1" max="3" required />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" name="startDate" defaultValue={editingTerm?.startDate} required />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" name="endDate" defaultValue={editingTerm?.endDate} required />
                  </div>
                  <div className="form-group">
                    <label>Exam Period Start</label>
                    <input type="date" name="examPeriodStart" defaultValue={editingTerm?.examPeriodStart} />
                  </div>
                  <div className="form-group">
                    <label>Exam Period End</label>
                    <input type="date" name="examPeriodEnd" defaultValue={editingTerm?.examPeriodEnd} />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea name="description" defaultValue={editingTerm?.description} rows={3} placeholder="Term description..." />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input type="checkbox" name="isActive" defaultChecked={editingTerm?.isActive || false} />
                      Set as Active Term
                    </label>
                  </div>
                </div>
                {calculating && (
                  <div className="calculating-indicator">
                    <div className="loader-small" />
                    <span>Calculating term details...</span>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={calculating}>
                    {editingTerm ? 'Update Term' : 'Create Term'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Term Details Modal */}
      {showDetailsModal && selectedTerm && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal modal-details" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Term Details: {selectedTerm.name}</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Term Name</label>
                  <p>{selectedTerm.name}</p>
                </div>
                <div className="detail-item">
                  <label>Academic Year</label>
                  <p>{selectedTerm.academicYear}</p>
                </div>
                <div className="detail-item">
                  <label>Term Number</label>
                  <p>{selectedTerm.termNumber}</p>
                </div>
                <div className="detail-item">
                  <label>Duration</label>
                  <p>{Math.ceil((new Date(selectedTerm.endDate).getTime() - new Date(selectedTerm.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
                </div>
                <div className="detail-item">
                  <label>Start Date</label>
                  <p>{new Date(selectedTerm.startDate).toLocaleDateString()}</p>
                </div>
                <div className="detail-item">
                  <label>End Date</label>
                  <p>{new Date(selectedTerm.endDate).toLocaleDateString()}</p>
                </div>
                {selectedTerm.examPeriodStart && (
                  <div className="detail-item">
                    <label>Exam Period</label>
                    <p>{new Date(selectedTerm.examPeriodStart).toLocaleDateString()} - {new Date(selectedTerm.examPeriodEnd!).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="detail-item full-width">
                  <label>Description</label>
                  <p>{selectedTerm.description || 'No description'}</p>
                </div>
              </div>
              
              <div className="term-actions">
                <h4>Term Actions</h4>
                <div className="action-grid">
                  <button className="action-card" onClick={() => academicManagementService.generateTermReport(selectedTerm.id)}>
                    <FileText size={20} /> Generate Report
                  </button>
                  <button className="action-card" onClick={() => syncTermToSystem(selectedTerm)}>
                    <RefreshCcw size={20} /> Sync to System
                  </button>
                  <button className="action-card" onClick={() => sendTermNotifications('reminder', selectedTerm)}>
                    <Bell size={20} /> Send Reminders
                  </button>
                  <button className="action-card" onClick={() => academicManagementService.exportTermData(selectedTerm.id)}>
                    <Download size={20} /> Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Actions</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Selected {selectedTerms.length} term(s)</p>
              <div className="bulk-actions">
                <button className="bulk-action-btn" onClick={() => setBulkAction('activate')}>
                  <Activity size={16} /> Activate All
                </button>
                <button className="bulk-action-btn" onClick={() => setBulkAction('deactivate')}>
                  <Zap size={16} /> Deactivate All
                </button>
                <button className="bulk-action-btn" onClick={() => setBulkAction('archive')}>
                  <Archive size={16} /> Archive All
                </button>
                <button className="bulk-action-btn danger" onClick={() => setBulkAction('delete')}>
                  <Trash2 size={16} /> Delete All
                </button>
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleBulkAction}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .header-title h2 { margin: 0; font-size: 24px; font-weight: 700; color: #1f2937; }
        .header-title p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        
        .page-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        
        .toggle-group { display: flex; gap: 16px; background: white; padding: 4px 12px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .toggle-switch { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; position: relative; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider { width: 40px; height: 20px; background: #cbd5e1; border-radius: 20px; display: inline-block; position: relative; transition: 0.3s; }
        .toggle-slider:before { content: ''; position: absolute; width: 16px; height: 16px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: 0.3s; }
        .toggle-switch input:checked + .toggle-slider { background: #1d8a8a; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }
        .toggle-label { font-weight: 500; }
        
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; transition: all 0.2s; }
        .view-btn.active { background: #1d8a8a; color: white; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.total { background: #e0e7ff; color: #4f46e5; }
        .stat-icon.active { background: #d1fae5; color: #10b981; }
        .stat-icon.upcoming { background: #fed7aa; color: #f59e0b; }
        .stat-icon.completed { background: #d1fae5; color: #059669; }
        .stat-icon.archived { background: #f1f5f9; color: #64748b; }
        .stat-icon.warning { background: #fee2e2; color: #ef4444; }
        .stat-info { flex: 1; }
        .stat-value { font-size: 24px; font-weight: 700; display: block; }
        .stat-label { font-size: 13px; color: #6b7280; }
        
        .filters-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; padding: 12px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .filter-group { display: flex; gap: 8px; }
        .filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
        
        .sync-progress { margin-bottom: 20px; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #1d8a8a; }
        .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
        .progress-fill { height: 100%; background: #1d8a8a; transition: width 0.3s ease; }
        
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr:hover { background: #fafbff; }
        .archived-row { opacity: 0.7; background: #f9fafb; }
        
        .checkbox-col { width: 40px; text-align: center; }
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .user-avatar { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .user-name { font-weight: 600; display: block; }
        .user-email { font-size: 11px; color: #64748b; }
        
        .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.active { background: #d1fae5; color: #10b981; }
        .status-badge.upcoming { background: #fed7aa; color: #f59e0b; }
        .status-badge.completed { background: #e0e7ff; color: #4f46e5; }
        
        .progress-cell { display: flex; align-items: center; gap: 8px; }
        .mini-progress { flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }
        .mini-progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-text { font-size: 11px; min-width: 35px; }
        
        .days-remaining { color: #f59e0b; font-size: 12px; }
        .days-end { color: #ef4444; font-size: 12px; font-weight: 600; }
        .days-ended { color: #6b7280; font-size: 12px; }
        
        .action-buttons { display: flex; gap: 4px; flex-wrap: wrap; }
        .action-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; display: inline-flex; align-items: center; transition: all 0.2s; }
        .action-btn:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-danger:hover { background: #fef2f2; color: #dc2626; }
        
        .empty-state { text-align: center; padding: 60px; color: #6b7280; }
        
        /* Calendar View */
        .calendar-view { background: white; border-radius: 12px; padding: 20px; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .calendar-header button { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; }
        .calendar-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .calendar-month { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .month-name { font-weight: 600; margin-bottom: 12px; color: #1f2937; }
        .calendar-term { border-left: 3px solid; padding-left: 8px; margin-bottom: 8px; font-size: 12px; }
        .term-name { font-weight: 500; }
        .term-dates { font-size: 10px; color: #6b7280; }
        
        /* Timeline View */
        .timeline-view { background: white; border-radius: 12px; padding: 40px 20px; }
        .timeline-track { position: relative; height: 60px; background: #f1f5f9; border-radius: 30px; margin: 20px 0; }
        .timeline-term { position: absolute; height: 60px; border-radius: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: 600; overflow: hidden; }
        .timeline-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 8px; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 700px; }
        .modal-details { max-width: 600px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
        .modal-body { padding: 24px; }
        
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .checkbox-group { flex-direction: row; align-items: center; }
        
        .calculating-indicator { display: flex; align-items: center; gap: 8px; margin: 16px 0; padding: 8px; background: #f0fdf4; border-radius: 8px; }
        .loader-small { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.6s linear infinite; }
        
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
        .detail-item label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .detail-item p { margin: 0; font-size: 14px; color: #1f2937; }
        .detail-item.full-width { grid-column: span 2; }
        
        .term-actions h4 { margin: 0 0 12px; font-size: 16px; }
        .action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .action-card { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; }
        .action-card:hover { border-color: #1d8a8a; background: #f0fdf4; }
        
        .bulk-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
        .bulk-action-btn { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; display: flex; align-items: center; gap: 8px; justify-content: center; }
        .bulk-action-btn.danger:hover { background: #fef2f2; border-color: #ef4444; color: #ef4444; }
        
        .btn { padding: 8px 16px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #1d8a8a; color: white; border-color: #1d8a8a; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border-color: #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .loading-state { text-align: center; padding: 60px; color: #6b7280; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .calendar-grid { grid-template-columns: repeat(2, 1fr); }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full-width { grid-column: span 1; }
          .action-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}