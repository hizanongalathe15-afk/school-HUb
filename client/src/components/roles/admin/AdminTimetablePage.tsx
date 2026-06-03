// client/src/components/roles/admin/AdminTimetablePage.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  CalendarDays, Plus, RefreshCcw, Search, Trash2, Edit2, 
  Eye, Copy, Save, X, AlertCircle, CheckCircle, Clock,
  Users, BookOpen, MapPin, Bell, Send, FileText, Download,
  Upload, Filter, Grid, List, Printer, Share2, Repeat,
  AlertTriangle, ChevronLeft, ChevronRight, Calendar,
  UserCheck, UserX, Settings, Zap, Shield, Mail, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { academicManagementService, notificationService } from '../../../services/adminService';
import type { Timetable, TimetableEntry, Class, Subject, Teacher } from '../../../types/admin';

const PAGE_LIMIT = 20;

export default function AdminTimetablePage() {
  // State Management
  const [items, setItems] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'calendar'>('list');
  
  // Form state
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TimetableEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  
  // Draft entry
  const [draft, setDraft] = useState<Partial<TimetableEntry>>({
    classId: '',
    className: '',
    day: 'monday',
    startTime: '08:00',
    endTime: '08:45',
    subjectId: '',
    subjectName: '',
    teacherId: '',
    teacherName: '',
    location: '',
    room: '',
    notes: '',
    isRecurring: false,
    recurringPattern: 'weekly',
    color: '#667eea'
  });

  // Reference data
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notifying, setNotifying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const days = [
    { value: 'monday', label: 'Monday', short: 'Mon' },
    { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { value: 'thursday', label: 'Thursday', short: 'Thu' },
    { value: 'friday', label: 'Friday', short: 'Fri' },
    { value: 'saturday', label: 'Saturday', short: 'Sat' },
  ];

  // Load data
  useEffect(() => {
    fetchData();
    fetchReferenceData();
  }, [search, classFilter, dayFilter, teacherFilter, subjectFilter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await academicManagementService.getTimetableEntries({
        search: search || undefined,
        classId: classFilter === 'all' ? undefined : classFilter,
        day: dayFilter === 'all' ? undefined : dayFilter,
        teacherId: teacherFilter === 'all' ? undefined : teacherFilter,
        subjectId: subjectFilter === 'all' ? undefined : subjectFilter,
        page,
        limit: PAGE_LIMIT,
      });
      setItems(res.items ?? res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (error) {
      toast.error('Failed to load timetable');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [classesData, subjectsData, teachersData] = await Promise.all([
        academicManagementService.getClasses(),
        academicManagementService.getSubjects(),
        academicManagementService.getTeachers()
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  };

  // Check for conflicts
  const checkConflicts = async (entry: Partial<TimetableEntry>): Promise<any[]> => {
    try {
      const conflicts = await academicManagementService.checkTimetableConflicts(entry);
      return conflicts;
    } catch (error) {
      console.error('Conflict check failed:', error);
      return [];
    }
  };

  // Create entry with conflict detection
  const handleCreate = async () => {
    const requiredFields = ['classId', 'day', 'startTime', 'endTime', 'subjectId', 'teacherId'];
    const missing = requiredFields.filter(field => !isNotEmpty(draft[field as keyof TimetableEntry]));
    
    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(', ')}`);
      return;
    }

    // Check for conflicts
    const conflictsList = await checkConflicts(draft);
    if (conflictsList.length > 0) {
      setConflicts(conflictsList);
      setShowConflictModal(true);
      return;
    }

    try {
      setCreating(true);
      const newEntry = await academicManagementService.createTimetableEntry(draft);
      toast.success('Timetable entry created');
      
      // Send notifications to affected users
      await sendNotifications(newEntry, 'create');
      
      resetForm();
      fetchData();
      setShowModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create timetable entry');
    } finally {
      setCreating(false);
    }
  };

  // Update entry
  const handleUpdate = async () => {
    if (!editing) return;
    
    const conflictsList = await checkConflicts(draft);
    if (conflictsList.length > 0 && !confirm('Conflicts detected. Save anyway?')) {
      setConflicts(conflictsList);
      setShowConflictModal(true);
      return;
    }

    try {
      setCreating(true);
      const updated = await academicManagementService.updateTimetableEntry(editing.id, draft);
      toast.success('Timetable entry updated');
      
      // Send notifications about changes
      await sendNotifications(updated, 'update');
      
      resetForm();
      fetchData();
      setShowModal(false);
      setEditing(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update timetable entry');
    } finally {
      setCreating(false);
    }
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this timetable entry? This will notify affected users.')) return;
    
    try {
      const entry = items.find(i => i.id === id);
      await academicManagementService.deleteTimetableEntry(id);
      toast.success('Timetable entry deleted');
      
      // Notify about deletion
      if (entry) {
        await sendNotifications(entry, 'delete');
      }
      
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedEntries.length} entries?`)) return;
    
    try {
      await academicManagementService.bulkDeleteTimetableEntries(selectedEntries);
      toast.success(`${selectedEntries.length} entries deleted`);
      setSelectedEntries([]);
      fetchData();
      setShowBulkModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Bulk delete failed');
    }
  };

  // Copy entry (for creating similar)
  const handleCopy = async (entry: TimetableEntry) => {
    const copyEntry = { ...entry, id: undefined, className: `${entry.className} (Copy)` };
    setDraft(copyEntry);
    setEditing(null);
    setShowModal(true);
  };

  // Send notifications to teachers, students, parents
  const sendNotifications = async (entry: TimetableEntry, action: 'create' | 'update' | 'delete') => {
    setNotifying(true);
    try {
      const recipients = {
        teacher: entry.teacherId,
        students: await academicManagementService.getClassStudents(entry.classId),
        parents: await academicManagementService.getClassParents(entry.classId)
      };
      
      const message = getNotificationMessage(entry, action);
      
      await notificationService.sendBulkNotifications({
        recipients: recipients.students.map(s => s.userId),
        message,
        channels: ['email', 'sms', 'push'],
        priority: 'high',
        metadata: { type: 'timetable', action, entryId: entry.id }
      });
      
      toast.success(`Notifications sent to ${recipients.students.length} students and parents`);
    } catch (error) {
      console.error('Notification failed:', error);
    } finally {
      setNotifying(false);
    }
  };

  const getNotificationMessage = (entry: TimetableEntry, action: string): string => {
    const dayName = days.find(d => d.value === entry.day)?.label || entry.day;
    const messages = {
      create: `📅 New class scheduled: ${entry.subjectName} on ${dayName} at ${entry.startTime} - ${entry.endTime} in ${entry.location || entry.room || 'room TBA'}`,
      update: `📅 Schedule changed: ${entry.subjectName} on ${dayName} at ${entry.startTime} - ${entry.endTime}`,
      delete: `📅 Class cancelled: ${entry.subjectName} on ${dayName} at ${entry.startTime}`
    };
    return messages[action];
  };

  // Export timetable
  const exportTimetable = async () => {
    setExporting(true);
    try {
      const blob = await academicManagementService.exportTimetable({
        classId: classFilter !== 'all' ? classFilter : undefined,
        day: dayFilter !== 'all' ? dayFilter : undefined,
        format: 'pdf'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${new Date().toISOString()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Timetable exported');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const resetForm = () => {
    setDraft({
      classId: '',
      className: '',
      day: 'monday',
      startTime: '08:00',
      endTime: '08:45',
      subjectId: '',
      subjectName: '',
      teacherId: '',
      teacherName: '',
      location: '',
      room: '',
      notes: '',
      isRecurring: false,
      recurringPattern: 'weekly',
      color: '#667eea'
    });
  };

  const isNotEmpty = (v: unknown) => {
    return v !== null && v !== undefined && String(v).trim() !== '';
  };

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  // Get subject name by ID
  const getSubjectName = (subjectId: string) => {
    const subj = subjects.find(s => s.id === subjectId);
    return subj?.name || subjectId;
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || teacherId;
  };

  // Render calendar view
  const renderCalendarView = () => {
    const timetableByDay: Record<string, TimetableEntry[]> = {};
    days.forEach(day => { timetableByDay[day.value] = []; });
    
    items.forEach(entry => {
      if (timetableByDay[entry.day]) {
        timetableByDay[entry.day].push(entry);
      }
    });
    
    // Sort by time
    Object.keys(timetableByDay).forEach(day => {
      timetableByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          {days.map(day => (
            <div key={day.value} className="calendar-day-header">
              {day.label}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          {Array.from({ length: 12 }, (_, i) => i + 7).map(hour => (
            <div key={hour} className="calendar-row">
              <div className="calendar-time">{hour}:00</div>
              {days.map(day => (
                <div key={day.value} className="calendar-cell">
                  {items
                    .filter(e => e.day === day.value)
                    .filter(e => {
                      const startHour = parseInt(e.startTime.split(':')[0]);
                      return startHour === hour;
                    })
                    .map(entry => (
                      <div key={entry.id} className="calendar-event" style={{ backgroundColor: entry.color || '#667eea' }}>
                        <div className="event-subject">{entry.subjectName}</div>
                        <div className="event-time">{entry.startTime} - {entry.endTime}</div>
                        <div className="event-location">{entry.location || entry.room}</div>
                        <div className="event-actions">
                          <button onClick={() => { setEditing(entry); setDraft(entry); setShowModal(true); }}>
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => handleDelete(entry.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render grid view (by class)
  const renderGridView = () => {
    const classesList = classFilter === 'all' 
      ? Array.from(new Set(items.map(i => i.classId)))
      : [classFilter];
    
    return (
      <div className="grid-view">
        {classesList.map(classId => {
          const classEntries = items.filter(i => i.classId === classId);
          if (classEntries.length === 0) return null;
          
          return (
            <div key={classId} className="class-timetable-card">
              <h4>{getClassName(classId)}</h4>
              <div className="class-schedule">
                {days.map(day => {
                  const dayEntries = classEntries.filter(e => e.day === day.value);
                  return (
                    <div key={day.value} className="day-schedule">
                      <div className="day-label">{day.short}</div>
                      {dayEntries.length > 0 ? (
                        dayEntries.map(entry => (
                          <div key={entry.id} className="schedule-item">
                            <span className="schedule-time">{entry.startTime}</span>
                            <span className="schedule-subject">{entry.subjectName}</span>
                            <span className="schedule-teacher">{entry.teacherName}</span>
                          </div>
                        ))
                      ) : (
                        <div className="schedule-empty">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Get unique filter options
  const uniqueClasses = useMemo(() => {
    const classSet = new Set<string>();
    items.forEach(i => { if (i.classId) classSet.add(i.classId); });
    return Array.from(classSet);
  }, [items]);

  const uniqueTeachers = useMemo(() => {
    const teacherSet = new Set<string>();
    items.forEach(i => { if (i.teacherId) teacherSet.add(i.teacherId); });
    return Array.from(teacherSet);
  }, [items]);

  const uniqueSubjects = useMemo(() => {
    const subjectSet = new Set<string>();
    items.forEach(i => { if (i.subjectId) subjectSet.add(i.subjectId); });
    return Array.from(subjectSet);
  }, [items]);

  return (
    <div className="timetable-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2><CalendarDays size={24} /> Timetable Management</h2>
          <p>Manage class schedules, detect conflicts, and notify users automatically</p>
        </div>
        <div className="page-actions">
          <div className="view-toggle">
            <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
              <List size={16} /> List
            </button>
            <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
              <Grid size={16} /> Grid
            </button>
            <button className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
              <Calendar size={16} /> Calendar
            </button>
          </div>
          <button className="btn btn-secondary" onClick={exportTimetable} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Exporting...' : 'Export'}
          </button>
          <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCcw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}>
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search by subject, teacher, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="all">All Classes ({classes.length})</option>
          {uniqueClasses.map(c => <option key={c} value={c}>{getClassName(c)}</option>)}
        </select>
        <select className="filter-select" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
          <option value="all">All Teachers</option>
          {uniqueTeachers.map(t => <option key={t} value={t}>{getTeacherName(t)}</option>)}
        </select>
        <select className="filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="all">All Subjects</option>
          {uniqueSubjects.map(s => <option key={s} value={s}>{getSubjectName(s)}</option>)}
        </select>
        <select className="filter-select" value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
          <option value="all">All Days</option>
          {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        {selectedEntries.length > 0 && (
          <button className="btn btn-danger" onClick={() => setShowBulkModal(true)}>
            <Trash2 size={16} /> Delete ({selectedEntries.length})
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="loader" />
          <p>Loading timetable...</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input 
                    type="checkbox"
                    checked={selectedEntries.length === items.length && items.length > 0}
                    onChange={(e) => setSelectedEntries(e.target.checked ? items.map(i => i.id) : [])}
                  />
                </th>
                <th>Day</th>
                <th>Class</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <CalendarDays size={48} />
                    <p>No timetable entries found</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                      <Plus size={16} /> Create First Entry
                    </button>
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="checkbox-col">
                      <input 
                        type="checkbox"
                        checked={selectedEntries.includes(entry.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEntries([...selectedEntries, entry.id]);
                          } else {
                            setSelectedEntries(selectedEntries.filter(id => id !== entry.id));
                          }
                        }}
                      />
                    </td>
                    <td><span className="day-badge">{days.find(d => d.value === entry.day)?.label || entry.day}</span></td>
                    <td><strong>{entry.className || getClassName(entry.classId)}</strong></td>
                    <td><span className="time-badge">{entry.startTime} - {entry.endTime}</span></td>
                    <td>{entry.subjectName || getSubjectName(entry.subjectId)}</td>
                    <td>{entry.teacherName || getTeacherName(entry.teacherId)}</td>
                    <td>{entry.location || entry.room || '-'}</td>
                    <td>
                      <span className={`status-badge ${entry.isActive !== false ? 'active' : 'inactive'}`}>
                        {entry.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" title="Edit" onClick={() => { setEditing(entry); setDraft(entry); setShowModal(true); }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn" title="Copy" onClick={() => handleCopy(entry)}>
                          <Copy size={14} />
                        </button>
                        <button className="action-btn" title="Notify" onClick={() => sendNotifications(entry, 'update')}>
                          <Bell size={14} />
                        </button>
                        <button className="action-btn action-danger" title="Delete" onClick={() => handleDelete(entry.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'grid' ? renderGridView() : renderCalendarView()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Timetable Entry' : 'Create Timetable Entry'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={e => { e.preventDefault(); editing ? handleUpdate() : handleCreate(); }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Class *</label>
                    <select 
                      value={draft.classId} 
                      onChange={(e) => setDraft({...draft, classId: e.target.value, className: e.target.options[e.target.selectedIndex]?.text})}
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Day *</label>
                    <select value={draft.day} onChange={(e) => setDraft({...draft, day: e.target.value as any})} required>
                      {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input type="time" value={draft.startTime} onChange={(e) => setDraft({...draft, startTime: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input type="time" value={draft.endTime} onChange={(e) => setDraft({...draft, endTime: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select 
                      value={draft.subjectId} 
                      onChange={(e) => setDraft({...draft, subjectId: e.target.value, subjectName: e.target.options[e.target.selectedIndex]?.text})}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Teacher *</label>
                    <select 
                      value={draft.teacherId} 
                      onChange={(e) => setDraft({...draft, teacherId: e.target.value, teacherName: e.target.options[e.target.selectedIndex]?.text})}
                      required
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Room/Location</label>
                    <input type="text" value={draft.location || ''} onChange={(e) => setDraft({...draft, location: e.target.value})} placeholder="e.g., Room 201, Lab B" />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input type="color" value={draft.color} onChange={(e) => setDraft({...draft, color: e.target.value})} />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea rows={2} value={draft.notes || ''} onChange={(e) => setDraft({...draft, notes: e.target.value})} placeholder="Additional instructions..." />
                  </div>
                  <div className="form-group checkbox-group">
                    <label>
                      <input type="checkbox" checked={draft.isRecurring} onChange={(e) => setDraft({...draft, isRecurring: e.target.checked})} />
                      Recurring Entry (weekly)
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Saving...' : (editing ? 'Update Entry' : 'Create Entry')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Conflicts Modal */}
      {showConflictModal && (
        <div className="modal-overlay" onClick={() => setShowConflictModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><AlertTriangle size={20} /> Schedule Conflicts Detected</h3>
              <button className="modal-close" onClick={() => setShowConflictModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>The following conflicts were found:</p>
              <div className="conflicts-list">
                {conflicts.map((conflict, i) => (
                  <div key={i} className="conflict-item">
                    <AlertCircle size={16} />
                    <div>
                      <strong>{conflict.type}</strong>
                      <p>{conflict.description}</p>
                      <small>{conflict.details}</small>
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowConflictModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { setShowConflictModal(false); editing ? handleUpdate() : handleCreate(); }}>
                  Save Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Delete</h3>
              <button className="modal-close" onClick={() => setShowBulkModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedEntries.length}</strong> timetable entries?</p>
              <p className="warning-text">This action cannot be undone and will notify affected users.</p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBulkDelete}>Delete All</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .timetable-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }
        
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h2 { margin: 0; font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
        .page-header p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
        
        .page-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        
        .view-toggle { display: flex; gap: 4px; background: white; padding: 4px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; }
        .view-btn.active { background: #1d8a8a; color: white; }
        
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; align-items: center; }
        .search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; width: 100%; }
        .filter-select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; min-width: 140px; }
        
        .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table thead th { background: #f8fafc; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; }
        .data-table tbody td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .data-table tbody tr:hover { background: #fafbff; }
        
        .checkbox-col { width: 40px; text-align: center; }
        .day-badge { background: #e0e7ff; color: #4f46e5; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .time-badge { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .status-badge.active { background: #d1fae5; color: #10b981; }
        .status-badge.inactive { background: #fee2e2; color: #ef4444; }
        
        .action-buttons { display: flex; gap: 6px; }
        .action-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; display: inline-flex; align-items: center; transition: all 0.2s; }
        .action-btn:hover { background: #f1f5f9; color: #1d8a8a; }
        .action-danger:hover { background: #fef2f2; color: #dc2626; }
        
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 20px; padding: 16px; }
        .page-btn { padding: 8px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { color: #6b7280; font-size: 14px; }
        
        /* Grid View */
        .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .class-timetable-card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .class-timetable-card h4 { margin: 0 0 12px; font-size: 16px; color: #1f2937; }
        .class-schedule { display: flex; flex-direction: column; gap: 8px; }
        .day-schedule { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .day-label { width: 50px; font-weight: 600; font-size: 12px; }
        .schedule-item { flex: 1; display: flex; gap: 8px; font-size: 12px; }
        .schedule-time { color: #64748b; min-width: 45px; }
        .schedule-subject { font-weight: 500; flex: 1; }
        .schedule-teacher { color: #6b7280; }
        .schedule-empty { color: #cbd5e1; font-size: 12px; }
        
        /* Calendar View */
        .calendar-view { background: white; border-radius: 12px; overflow-x: auto; }
        .calendar-header { display: grid; grid-template-columns: 60px repeat(6, 1fr); background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
        .calendar-day-header { padding: 12px; font-weight: 600; text-align: center; border-left: 1px solid #e5e7eb; }
        .calendar-body { }
        .calendar-row { display: grid; grid-template-columns: 60px repeat(6, 1fr); border-bottom: 1px solid #f1f5f9; min-height: 80px; }
        .calendar-time { padding: 8px; font-size: 11px; color: #64748b; border-right: 1px solid #e5e7eb; }
        .calendar-cell { padding: 4px; border-left: 1px solid #f1f5f9; min-height: 80px; }
        .calendar-event { background: #667eea; color: white; padding: 4px 6px; border-radius: 4px; margin-bottom: 4px; font-size: 10px; cursor: pointer; position: relative; }
        .calendar-event:hover { opacity: 0.9; }
        .calendar-event .event-actions { display: none; position: absolute; top: 0; right: 0; gap: 2px; }
        .calendar-event:hover .event-actions { display: flex; }
        .event-subject { font-weight: 600; }
        .event-time, .event-location { font-size: 9px; opacity: 0.9; }
        .event-actions button { background: rgba(0,0,0,0.3); border: none; color: white; padding: 2px; border-radius: 2px; cursor: pointer; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: white; border-radius: 16px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-large { max-width: 800px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; }
        .modal-close { background: none; border: none; cursor: pointer; color: #64748b; }
        .modal-body { padding: 24px; }
        
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: span 2; }
        .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
        .form-group input, .form-group textarea, .form-group select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
        .checkbox-group { flex-direction: row; align-items: center; }
        
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        
        .conflicts-list { margin: 16px 0; max-height: 300px; overflow-y: auto; }
        .conflict-item { display: flex; gap: 12px; padding: 12px; background: #fef2f2; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #ef4444; }
        .warning-text { color: #ef4444; font-size: 13px; margin-top: 8px; }
        
        .empty-state { text-align: center; padding: 60px; color: #6b7280; }
        .loading-state { text-align: center; padding: 60px; }
        
        .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #1d8a8a; color: white; }
        .btn-primary:hover { background: #166b6b; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; color: #374151; }
        .btn-secondary:hover { background: #f8fafc; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        
        .loader { width: 42px; height: 42px; border: 3px solid #e5e7eb; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full-width { grid-column: span 1; }
          .grid-view { grid-template-columns: 1fr; }
          .calendar-header, .calendar-row { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}