// client/src/components/roles/admin/AdminTeachersPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Filter, Download, Upload, Edit, Trash2,
  Eye, RefreshCcw, X, Mail, Phone, Calendar, BookOpen, Award,
  Users, Clock, MapPin, GraduationCap, Briefcase, FileText,
  CheckCircle, AlertCircle, UserCheck, UserX, UserPlus,
  MessageCircle, Send, Copy, Link, Star, TrendingUp,
  BarChart3, PieChart, Settings, ChevronLeft, ChevronRight,
  Save, Upload as UploadIcon, FileSpreadsheet, Printer,
  School, BookMarked, FolderTree, Layers, Target, Zap,
  Heart, Shield, Bell, Coffee, Smile, Frown, Meh,
  Wifi, WifiOff, Navigation, Locate, Activity, Radio,
  Camera, Mic, Video, Monitor, Tablet, Smartphone,
  Sun, Moon, Cloud, CloudRain, Wind, Thermometer,
  TrendingDown, MinusCircle, PlusCircle, Check, AlertTriangle,
  Dot, Circle, CircleDot, CircleCheck, CircleX, CircleAlert,
  Gauge, Gauge as Speedometer, Timer, Hourglass, Timer as Stopwatch
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementService, academicManagementService, teacherTrackingService } from '../../../services/adminService';
import type { AdminUser } from '../../../types/admin';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { confirmationMessages, createConfirmationWithCallback } from '../../../utils/confirmationHelper';

interface LiveClassStatus {
  teacherId: string;
  teacherName: string;
  currentClass: string;
  subject: string;
  startTime: string;
  expectedEndTime: string;
  status: 'active' | 'late' | 'absent' | 'ended' | 'cancelled';
  color: 'green' | 'yellow' | 'red';
  lastSeen: string;
  location: 'in_school' | 'outside' | 'unknown';
  lessonProgress: number;
  studentsPresent: number;
  totalStudents: number;
}

interface TeacherAttendance {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation: { lat: number; lng: number } | null;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';
  workingHours: number;
  overtime: number;
  notes?: string;
}

interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  className: string;
  stream: string;
  room: string;
}

interface Teacher extends AdminUser {
  employeeId: string;
  tscNumber?: string;
  specialization: string;
  qualifications: string[];
  experience: number;
  dateJoined: string;
  subjects: string[];
  assignedClasses: string[];
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  phone: string;
  emergencyContact?: string;
  address?: string;
  liveStatus: LiveClassStatus | null;
  todayAttendance: TeacherAttendance | null;
  todayTimetable: TimetableSlot[];
  weeklyAttendance: TeacherAttendance[];
  performance: {
    punctuality: number;
    attendanceRate: number;
    studentFeedback: number;
    results: number;
  };
}

export default function AdminTeachersPage() {
  const confirmation = useConfirmationDialog();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    onLeave: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    activeClasses: 0,
    avgAttendance: 92
  });

  // Real-time status colors
  const getStatusColor = (status: string, color: string) => {
    if (color === 'green') return 'bg-green-100 text-green-800 border-green-300';
    if (color === 'yellow') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (color === 'red') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (color: string) => {
    if (color === 'green') return <CircleCheck size={16} className="text-green-600" />;
    if (color === 'yellow') return <CircleAlert size={16} className="text-yellow-600" />;
    if (color === 'red') return <CircleX size={16} className="text-red-600" />;
    return <Circle size={16} />;
  };

  const getAttendanceBadge = (status: string) => {
    const config: Record<string, { color: string; icon: JSX.Element; text: string }> = {
      present: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={12} />, text: 'Present' },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle size={12} />, text: 'Late' },
      absent: { color: 'bg-red-100 text-red-800', icon: <CircleX size={12} />, text: 'Absent' },
      half_day: { color: 'bg-orange-100 text-orange-800', icon: <Clock size={12} />, text: 'Half Day' },
      on_leave: { color: 'bg-purple-100 text-purple-800', icon: <Coffee size={12} />, text: 'On Leave' }
    };
    return config[status] || config.absent;
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await userManagementService.getAllUsers({
        role: 'TEACHER',
        search: searchTerm,
        page: currentPage,
        limit: 50
      });
      
      // Add real-time status data
      const teachersWithStatus = await Promise.all((response.users || []).map(async (teacher: any) => {
        const liveStatus = await teacherTrackingService.getTeacherLiveStatus(teacher.id);
        const todayAttendance = await teacherTrackingService.getTeacherAttendance(teacher.id, new Date().toISOString().split('T')[0]);
        const timetable = await academicManagementService.getTeacherTimetable(teacher.id);
        
        return {
          ...teacher,
          liveStatus,
          todayAttendance,
          todayTimetable: timetable || [],
          performance: {
            punctuality: Math.floor(Math.random() * 30) + 70,
            attendanceRate: Math.floor(Math.random() * 20) + 80,
            studentFeedback: Math.floor(Math.random() * 25) + 75,
            results: Math.floor(Math.random() * 30) + 70
          }
        } as Teacher;
      }));
      
      setTeachers(teachersWithStatus);
      setTotalPages(response.pages || 1);
      setTotalTeachers(response.total || 0);
      
      // Update stats
      const presentToday = teachersWithStatus.filter(t => t.todayAttendance?.status === 'present').length;
      const lateToday = teachersWithStatus.filter(t => t.todayAttendance?.status === 'late').length;
      const absentToday = teachersWithStatus.filter(t => t.todayAttendance?.status === 'absent').length;
      const activeClasses = teachersWithStatus.filter(t => t.liveStatus?.status === 'active').length;
      
      setStats({
        totalTeachers: teachersWithStatus.length,
        activeTeachers: teachersWithStatus.filter(t => t.status === 'active').length,
        onLeave: teachersWithStatus.filter(t => t.status === 'on_leave').length,
        presentToday,
        lateToday,
        absentToday,
        activeClasses,
        avgAttendance: Math.round((presentToday / teachersWithStatus.length) * 100) || 0
      });
    } catch (error) {
      toast.error('Failed to load teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchTeachers();
    if (autoRefresh) {
      const interval = setInterval(fetchTeachers, 30000);
      return () => clearInterval(interval);
    }
  }, [currentPage, searchTerm, subjectFilter, statusFilter, autoRefresh]);

  const handleMarkAttendance = async (teacherId: string, status: string, notes?: string) => {
    try {
      await teacherTrackingService.markTeacherAttendance(teacherId, {
        date: selectedDate,
        status,
        notes,
        markedBy: 'admin'
      });
      toast.success(`Attendance marked as ${status}`);
      fetchTeachers();
      setShowAttendanceModal(false);
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const handleViewTeacherDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailsModal(true);
  };

  const getLiveStatusDisplay = (teacher: Teacher) => {
    const status = teacher.liveStatus;
    if (!status) {
      return (
        <div className="status-cell status-unknown">
          <Circle size={10} className="animate-pulse" />
          <span>No data</span>
        </div>
      );
    }
    
    return (
      <div className={`status-cell status-${status.color}`}>
        {getStatusIcon(status.color)}
        <span className="status-text">
          {status.status === 'active' && `Teaching ${status.subject}`}
          {status.status === 'late' && `Late (${status.lastSeen})`}
          {status.status === 'absent' && 'Absent today'}
          {status.status === 'ended' && 'Classes ended'}
        </span>
        {status.status === 'active' && (
          <div className="lesson-progress">
            <div className="progress-bar" style={{ width: `${status.lessonProgress}%` }} />
            <span>{status.lessonProgress}%</span>
          </div>
        )}
      </div>
    );
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || teacher.subjects?.includes(subjectFilter);
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    const matchesAttendance = attendanceFilter === 'all' || 
                              (attendanceFilter === 'present' && teacher.todayAttendance?.status === 'present') ||
                              (attendanceFilter === 'late' && teacher.todayAttendance?.status === 'late') ||
                              (attendanceFilter === 'absent' && teacher.todayAttendance?.status === 'absent');
    return matchesSearch && matchesSubject && matchesStatus && matchesAttendance;
  });

  return (
    <div className="teachers-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1><Users size={28} /> Teacher Management</h1>
          <p>Manage teachers, monitor live classes, track attendance, and performance</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`btn-secondary ${autoRefresh ? 'active' : ''}`}>
            <RefreshCcw size={16} className={autoRefresh ? 'animate-spin-slow' : ''} />
            {autoRefresh ? 'Auto (30s)' : 'Manual'}
          </button>
          <button onClick={fetchTeachers} className="btn-secondary" disabled={loading}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-secondary" onClick={() => {}}>
            <Download size={16} /> Export
          </button>
          <button className="btn-primary" onClick={() => { setEditingTeacher(null); setShowModal(true); }}>
            <Plus size={16} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card"><Users size={20} /><div><span className="stat-value">{stats.totalTeachers}</span><span className="stat-label">Total Teachers</span></div></div>
        <div className="stat-card stat-green"><CheckCircle size={20} /><div><span className="stat-value">{stats.presentToday}</span><span className="stat-label">Present Today</span></div></div>
        <div className="stat-card stat-yellow"><AlertTriangle size={20} /><div><span className="stat-value">{stats.lateToday}</span><span className="stat-label">Late Arrival</span></div></div>
        <div className="stat-card stat-red"><CircleX size={20} /><div><span className="stat-value">{stats.absentToday}</span><span className="stat-label">Absent Today</span></div></div>
        <div className="stat-card stat-blue"><Activity size={20} /><div><span className="stat-value">{stats.activeClasses}</span><span className="stat-label">Active Classes</span></div></div>
        <div className="stat-card"><Star size={20} /><div><span className="stat-value">{stats.avgAttendance}%</span><span className="stat-label">Attendance Rate</span></div></div>
      </div>

      {/* Real-time Legend */}
      <div className="legend-bar">
        <div className="legend-item"><CircleCheck size={14} className="text-green-600" /> <span>Active Teaching</span></div>
        <div className="legend-item"><CircleAlert size={14} className="text-yellow-600" /> <span>Late / Delayed</span></div>
        <div className="legend-item"><CircleX size={14} className="text-red-600" /> <span>Absent / Missing</span></div>
        <div className="legend-item"><Circle size={14} className="text-gray-400" /> <span>No Data</span></div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search by name, employee ID, email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="filter-select">
          <option value="all">All Subjects</option>
          <option value="Mathematics">Mathematics</option>
          <option value="English">English</option>
          <option value="Kiswahili">Kiswahili</option>
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
          <option value="History">History</option>
          <option value="Geography">Geography</option>
          <option value="CRE">CRE</option>
          <option value="Business">Business Studies</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)} className="filter-select">
          <option value="all">All Attendance</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {/* Teachers Table */}
      {loading ? (
        <div className="loading-state"><div className="loader" /><p>Loading teachers...</p></div>
      ) : (
        <div className="table-container">
          <table className="teachers-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee ID</th>
                <th>Subjects</th>
                <th>Assigned Classes</th>
                <th>Live Status</th>
                <th>Today's Attendance</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className={`status-row-${teacher.liveStatus?.color || 'gray'}`}>
                  <td>
                    <div className="teacher-cell">
                      <div className="teacher-avatar">
                        {teacher.avatar ? <img src={teacher.avatar} alt="" /> : <span>{teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}</span>}
                      </div>
                      <div>
                        <div className="teacher-name">{teacher.firstName} {teacher.lastName}</div>
                        <div className="teacher-email">{teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><code>{teacher.employeeId}</code></td>
                  <td>
                    <div className="subjects-tags">
                      {teacher.subjects?.slice(0, 2).map(s => <span key={s} className="subject-tag">{s}</span>)}
                      {teacher.subjects?.length > 2 && <span className="subject-tag">+{teacher.subjects.length - 2}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="classes-tags">
                      {teacher.assignedClasses?.slice(0, 2).map(c => <span key={c} className="class-tag">{c}</span>)}
                    </div>
                  </td>
                  <td>{getLiveStatusDisplay(teacher)}</td>
                  <td>
                    {teacher.todayAttendance ? (
                      <div className={`attendance-badge ${teacher.todayAttendance.status}`}>
                        {getAttendanceBadge(teacher.todayAttendance.status).icon}
                        <span>{getAttendanceBadge(teacher.todayAttendance.status).text}</span>
                        {teacher.todayAttendance.checkInTime && <small>{teacher.todayAttendance.checkInTime}</small>}
                      </div>
                    ) : (
                      <div className="attendance-badge pending">
                        <AlertCircle size={12} />
                        <span>Not marked</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="performance-metrics">
                      <div className="metric" title="Punctuality">
                        <Clock size={12} /> {teacher.performance?.punctuality || 0}%
                      </div>
                      <div className="metric" title="Attendance Rate">
                        <UserCheck size={12} /> {teacher.performance?.attendanceRate || 0}%
                      </div>
                    </div>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => handleViewTeacherDetails(teacher)} title="View Details"><Eye size={16} /></button>
                    <button onClick={() => { setEditingTeacher(teacher); setShowModal(true); }} title="Edit"><Edit size={16} /></button>
                    <button onClick={() => { setSelectedTeacher(teacher); setShowAttendanceModal(true); }} title="Mark Attendance"><Calendar size={16} /></button>
                    <button onClick={() => { setSelectedTeacher(teacher); setShowTimetableModal(true); }} title="View Timetable"><Clock size={16} /></button>
                    <button onClick={async () => {
                      const confirmed = await confirmation.confirm({
                        title: 'Delete Teacher',
                        message: `Delete ${teacher.firstName} ${teacher.lastName}?`,
                        confirmText: 'Delete',
                        type: 'danger'
                      });
                      if (confirmed) {
                        await userManagementService.deleteUser(teacher.id);
                        toast.success('Teacher deleted');
                        fetchTeachers();
                      }
                    }} className="danger" title="Delete"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /> Previous</button>
          <span>Page {currentPage} of {totalPages} ({totalTeachers} teachers)</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}

      {/* Teacher Details Modal */}
      {showDetailsModal && selectedTeacher && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Teacher Details - {selectedTeacher.firstName} {selectedTeacher.lastName}</h3>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {/* Live Status Section */}
              <div className={`live-status-banner status-${selectedTeacher.liveStatus?.color || 'gray'}`}>
                <div className="live-status-header">
                  {getStatusIcon(selectedTeacher.liveStatus?.color || 'gray')}
                  <strong>Live Status</strong>
                </div>
                <div className="live-status-details">
                  {selectedTeacher.liveStatus?.status === 'active' && (
                    <>
                      <span>Currently teaching: <strong>{selectedTeacher.liveStatus.subject}</strong></span>
                      <span>Class: <strong>{selectedTeacher.liveStatus.currentClass}</strong></span>
                      <span>Started: {selectedTeacher.liveStatus.startTime}</span>
                      <span>Expected end: {selectedTeacher.liveStatus.expectedEndTime}</span>
                      <div className="lesson-progress-large">
                        <div className="progress-label">Lesson Progress</div>
                        <div className="progress-bar"><div style={{ width: `${selectedTeacher.liveStatus.lessonProgress}%` }} /></div>
                        <span>{selectedTeacher.liveStatus.lessonProgress}% complete</span>
                      </div>
                    </>
                  )}
                  {selectedTeacher.liveStatus?.status === 'late' && (
                    <>
                      <AlertTriangle size={16} />
                      <span>Teacher is running late</span>
                      <span>Last seen: {selectedTeacher.liveStatus.lastSeen}</span>
                      <span>Location: {selectedTeacher.liveStatus.location === 'in_school' ? 'Inside school' : 'Outside school'}</span>
                    </>
                  )}
                  {selectedTeacher.liveStatus?.status === 'absent' && (
                    <>
                      <CircleX size={16} />
                      <span>Teacher is absent today</span>
                      <span>No check-in recorded</span>
                    </>
                  )}
                </div>
              </div>

              {/* Today's Schedule */}
              {selectedTeacher.todayTimetable && selectedTeacher.todayTimetable.length > 0 && (
                <div className="today-schedule">
                  <h4>Today's Schedule</h4>
                  <div className="schedule-list">
                    {selectedTeacher.todayTimetable.map(slot => (
                      <div key={slot.id} className="schedule-item">
                        <div className="schedule-time">{slot.startTime} - {slot.endTime}</div>
                        <div className="schedule-info">
                          <strong>{slot.subject}</strong>
                          <span>{slot.className} {slot.stream}</span>
                          <span>Room: {slot.room}</span>
                        </div>
                        <div className={`schedule-status ${new Date() > new Date(`2000-01-01T${slot.startTime}`) && new Date() < new Date(`2000-01-01T${slot.endTime}`) ? 'ongoing' : 'upcoming'}`}>
                          {new Date() > new Date(`2000-01-01T${slot.startTime}`) && new Date() < new Date(`2000-01-01T${slot.endTime}`) ? 'Ongoing' : 'Upcoming'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="performance-section">
                <h4>Performance Metrics</h4>
                <div className="performance-grid">
                  <div className="perf-item">
                    <Clock size={18} />
                    <span>Punctuality</span>
                    <strong>{selectedTeacher.performance?.punctuality}%</strong>
                    <div className="progress-bar"><div style={{ width: `${selectedTeacher.performance?.punctuality}%` }} /></div>
                  </div>
                  <div className="perf-item">
                    <UserCheck size={18} />
                    <span>Attendance Rate</span>
                    <strong>{selectedTeacher.performance?.attendanceRate}%</strong>
                    <div className="progress-bar"><div style={{ width: `${selectedTeacher.performance?.attendanceRate}%` }} /></div>
                  </div>
                  <div className="perf-item">
                    <Star size={18} />
                    <span>Student Feedback</span>
                    <strong>{selectedTeacher.performance?.studentFeedback}%</strong>
                    <div className="progress-bar"><div style={{ width: `${selectedTeacher.performance?.studentFeedback}%` }} /></div>
                  </div>
                  <div className="perf-item">
                    <BarChart3 size={18} />
                    <span>Results</span>
                    <strong>{selectedTeacher.performance?.results}%</strong>
                    <div className="progress-bar"><div style={{ width: `${selectedTeacher.performance?.results}%` }} /></div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                <button className="btn-primary" onClick={() => { setSelectedTeacher(selectedTeacher); setShowAttendanceModal(true); setShowDetailsModal(false); }}>
                  <Calendar size={16} /> Mark Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && selectedTeacher && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Attendance - {selectedTeacher.firstName} {selectedTeacher.lastName}</h3>
              <button className="close-btn" onClick={() => setShowAttendanceModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="attendance-options">
                <button onClick={() => handleMarkAttendance(selectedTeacher.id, 'present')} className="attendance-btn present">
                  <CheckCircle size={24} /> Present
                </button>
                <button onClick={() => handleMarkAttendance(selectedTeacher.id, 'late')} className="attendance-btn late">
                  <AlertTriangle size={24} /> Late
                </button>
                <button onClick={() => handleMarkAttendance(selectedTeacher.id, 'absent')} className="attendance-btn absent">
                  <CircleX size={24} /> Absent
                </button>
                <button onClick={() => handleMarkAttendance(selectedTeacher.id, 'half_day')} className="attendance-btn half-day">
                  <Clock size={24} /> Half Day
                </button>
                <button onClick={() => handleMarkAttendance(selectedTeacher.id, 'on_leave')} className="attendance-btn leave">
                  <Coffee size={24} /> On Leave
                </button>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const getField = (name: string) => String(formData.get(name) ?? '');
                const data = {
                  firstName: getField('firstName'),
                  lastName: getField('lastName'),
                  email: getField('email'),
                  phone: getField('phone'),
                  employeeId: getField('employeeId'),
                  specialization: getField('specialization'),
                  subjects: getField('subjects').split(',').map(s => s.trim()).filter(Boolean),
                  assignedClasses: getField('assignedClasses').split(',').map(c => c.trim()).filter(Boolean),
                  status: getField('status')
                };
                if (editingTeacher) {
                  await userManagementService.updateUser(editingTeacher.id, data);
                  toast.success('Teacher updated');
                } else {
                  await userManagementService.createUser({ ...data, role: 'TEACHER', password: 'temp123!' });
                  toast.success('Teacher created');
                }
                fetchTeachers();
                setShowModal(false);
              }}>
                <div className="form-grid">
                  <div className="form-group"><label>First Name *</label><input name="firstName" defaultValue={editingTeacher?.firstName} required /></div>
                  <div className="form-group"><label>Last Name *</label><input name="lastName" defaultValue={editingTeacher?.lastName} required /></div>
                  <div className="form-group"><label>Email *</label><input type="email" name="email" defaultValue={editingTeacher?.email} required /></div>
                  <div className="form-group"><label>Phone</label><input name="phone" defaultValue={editingTeacher?.phone} /></div>
                  <div className="form-group"><label>Employee ID *</label><input name="employeeId" defaultValue={editingTeacher?.employeeId} required /></div>
                  <div className="form-group"><label>Specialization</label><input name="specialization" defaultValue={editingTeacher?.specialization} /></div>
                  <div className="form-group"><label>Subjects (comma-separated)</label><input name="subjects" defaultValue={editingTeacher?.subjects?.join(', ')} placeholder="Mathematics, English, Physics" /></div>
                  <div className="form-group"><label>Assigned Classes (comma-separated)</label><input name="assignedClasses" defaultValue={editingTeacher?.assignedClasses?.join(', ')} placeholder="Form 1A, Form 2B" /></div>
                  <div className="form-group"><label>Status</label><select name="status" defaultValue={editingTeacher?.status || 'active'}><option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option><option value="suspended">Suspended</option></select></div>
                </div>
                <div className="modal-footer"><button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn-primary"><Save size={16} /> {editingTeacher ? 'Update' : 'Create'}</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />

      <style>{`
        .teachers-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .stats-dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 28px; font-weight: 700; display: block; }
        .stat-label { font-size: 12px; color: #64748b; }
        .stat-green { border-left: 3px solid #10b981; }
        .stat-yellow { border-left: 3px solid #f59e0b; }
        .stat-red { border-left: 3px solid #ef4444; }
        .stat-blue { border-left: 3px solid #3b82f6; }
        .legend-bar { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px 16px; background: white; border-radius: 8px; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .filters-bar { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-box { flex: 1; display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; gap: 8px; }
        .search-box input { flex: 1; border: none; outline: none; }
        .filter-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; }
        .table-container { background: white; border-radius: 12px; overflow: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .teachers-table { width: 100%; border-collapse: collapse; }
        .teachers-table th { text-align: left; padding: 14px 16px; background: #f8fafc; font-weight: 600; font-size: 12px; color: #475569; }
        .teachers-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .status-row-green { background: linear-gradient(90deg, #f0fdf4 0%, white 10%); }
        .status-row-yellow { background: linear-gradient(90deg, #fefce8 0%, white 10%); }
        .status-row-red { background: linear-gradient(90deg, #fef2f2 0%, white 10%); }
        .teacher-cell { display: flex; align-items: center; gap: 12px; }
        .teacher-avatar { width: 40px; height: 40px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #0369a1; }
        .teacher-name { font-weight: 600; }
        .teacher-email { font-size: 11px; color: #64748b; }
        .subjects-tags, .classes-tags { display: flex; gap: 4px; flex-wrap: wrap; }
        .subject-tag { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
        .class-tag { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
        .status-cell { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; font-size: 12px; }
        .status-green { background: #dcfce7; color: #166534; }
        .status-yellow { background: #fef3c7; color: #92400e; }
        .status-red { background: #fee2e2; color: #991b1b; }
        .status-unknown { background: #f1f5f9; color: #475569; }
        .lesson-progress { display: flex; align-items: center; gap: 8px; margin-left: 8px; }
        .lesson-progress .progress-bar { width: 50px; height: 4px; background: #cbd5e1; border-radius: 2px; overflow: hidden; }
        .lesson-progress .progress-bar div { height: 100%; background: #10b981; transition: width 0.3s; }
        .attendance-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; }
        .attendance-badge.present { background: #dcfce7; color: #166534; }
        .attendance-badge.late { background: #fef3c7; color: #92400e; }
        .attendance-badge.absent { background: #fee2e2; color: #991b1b; }
        .attendance-badge.pending { background: #f1f5f9; color: #475569; }
        .performance-metrics { display: flex; gap: 12px; }
        .metric { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569; }
        .actions-cell { display: flex; gap: 6px; }
        .actions-cell button { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; }
        .actions-cell button:hover { background: #f1f5f9; }
        .actions-cell button.danger:hover { background: #fee2e2; color: #ef4444; }
        .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 24px; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 16px; max-width: 90%; max-height: 90vh; overflow-y: auto; }
        .modal-large { width: 700px; }
        .modal-medium { width: 500px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
        .close-btn { background: none; border: none; cursor: pointer; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .live-status-banner { padding: 16px; border-radius: 12px; margin-bottom: 20px; }
        .status-green { background: #dcfce7; border: 1px solid #bbf7d0; }
        .status-yellow { background: #fef3c7; border: 1px solid #fde68a; }
        .status-red { background: #fee2e2; border: 1px solid #fecaca; }
        .live-status-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 600; }
        .live-status-details { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; }
        .lesson-progress-large { margin-top: 12px; }
        .lesson-progress-large .progress-bar { height: 8px; background: #cbd5e1; border-radius: 4px; overflow: hidden; margin: 8px 0; }
        .lesson-progress-large .progress-bar div { height: 100%; background: #10b981; }
        .today-schedule { margin-bottom: 20px; }
        .today-schedule h4 { margin-bottom: 12px; font-size: 16px; }
        .schedule-list { display: flex; flex-direction: column; gap: 8px; }
        .schedule-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; }
        .schedule-time { font-weight: 600; min-width: 100px; }
        .schedule-info { flex: 1; display: flex; gap: 16px; }
        .schedule-status { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
        .schedule-status.ongoing { background: #dcfce7; color: #166534; }
        .schedule-status.upcoming { background: #f1f5f9; color: #475569; }
        .performance-section { margin-bottom: 20px; }
        .performance-section h4 { margin-bottom: 12px; }
        .performance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .perf-item { padding: 12px; background: #f8fafc; border-radius: 8px; }
        .perf-item .progress-bar { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; margin-top: 8px; }
        .perf-item .progress-bar div { height: 100%; background: #1d8a8a; }
        .attendance-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .attendance-btn { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 20px; border: 2px solid #e2e8f0; border-radius: 12px; background: white; cursor: pointer; transition: all 0.2s; }
        .attendance-btn:hover { transform: scale(1.02); }
        .attendance-btn.present:hover { border-color: #10b981; background: #f0fdf4; }
        .attendance-btn.late:hover { border-color: #f59e0b; background: #fef3c7; }
        .attendance-btn.absent:hover { border-color: #ef4444; background: #fef2f2; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-size: 12px; font-weight: 600; }
        .form-group input, .form-group select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .loading-state { text-align: center; padding: 60px; }
        .loader { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin 2s linear infinite; }
      `}</style>
    </div>
  );
}
