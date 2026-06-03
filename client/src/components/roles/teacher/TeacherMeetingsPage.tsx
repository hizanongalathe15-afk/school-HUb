import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Calendar, Clock, Video, Phone, MapPin, Check, X, Edit, 
  Trash2, RefreshCw, Search, Filter, Download, Printer, Mail,
  MessageSquare, Users, BookOpen, AlertCircle, CheckCircle,
  XCircle, Clock as ClockIcon, Video as VideoIcon, PhoneCall,
  Map, ExternalLink, Copy, Repeat, Calendar as CalendarIcon,
  Send, Bell, Star, Award, TrendingUp, BarChart3
} from 'lucide-react';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface ParentTeacherMeeting {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber: string;
  studentClassName: string;
  teacherId: string;
  teacherName: string;
  scheduledDate: string;
  duration: number;
  mode: 'in_person' | 'video' | 'phone';
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  agenda: string;
  notes: string | null;
  meetingLink: string | null;
  meetingLocation: string | null;
  recordingUrl: string | null;
  feedbackProvided: boolean;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  rescheduledFromId: string | null;
}

interface TeacherStudent {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  classId: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
}

interface MeetingStats {
  total: number;
  requested: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  completionRate: number;
  averageDuration: number;
  mostUsedMode: string;
}

const TeacherMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<ParentTeacherMeeting[]>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<ParentTeacherMeeting | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'requested' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [notesText, setNotesText] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    parentId: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    date: '',
    duration: 30,
    mode: 'in_person' as 'in_person' | 'video' | 'phone',
    agenda: '',
    meetingLink: '',
    meetingLocation: '',
  });

  const confirmation = useConfirmationDialog();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load meetings when filters change
  useEffect(() => {
    loadMeetings();
  }, [filterStatus, selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes] = await Promise.all([
        teacherService.students.getMyStudents(),
      ]);
      
      if (studentsRes.success && studentsRes.data) {
        setStudents(studentsRes.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const response = await teacherService.meetings.getMeetings({
        status: filterStatus === 'all' ? undefined : filterStatus,
        studentId: selectedStudent || undefined,
      });
      if (response.success && response.data) {
        setMeetings(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (meetingsData: ParentTeacherMeeting[]) => {
    const total = meetingsData.length;
    const requested = meetingsData.filter(m => m.status === 'requested').length;
    const confirmed = meetingsData.filter(m => m.status === 'confirmed').length;
    const completed = meetingsData.filter(m => m.status === 'completed').length;
    const cancelled = meetingsData.filter(m => m.status === 'cancelled').length;
    
    const modeCount = meetingsData.reduce((acc, m) => {
      acc[m.mode] = (acc[m.mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'in_person';
    
    setStats({
      total,
      requested,
      confirmed,
      completed,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      averageDuration: meetingsData.reduce((sum, m) => sum + m.duration, 0) / (total || 1),
      mostUsedMode,
    });
  };

  const handleSchedule = async () => {
    setSaving(true);
    try {
      const selectedStudentObj = students.find(s => s.id === formData.studentId);
      
      const response = await teacherService.meetings.scheduleMeeting({
        parentId: formData.parentId || selectedStudentObj?.parentId,
        studentId: formData.studentId,
        date: formData.date,
        duration: formData.duration,
        mode: formData.mode,
        agenda: formData.agenda,
        meetingLink: formData.mode === 'video' ? formData.meetingLink : undefined,
        meetingLocation: formData.mode === 'in_person' ? formData.meetingLocation : undefined,
      });
      
      if (response.success) {
        toast.success('Meeting scheduled successfully');
        setShowForm(false);
        resetForm();
        loadMeetings();
        
        // Ask if user wants to send notification
        const sendNotification = await confirmation.confirm({
          title: 'Send Notification?',
          message: 'Would you like to notify the parent about this meeting?',
          confirmText: 'Yes, Notify',
          cancelText: 'Later',
        });
        
        if (sendNotification) {
          await teacherService.meetings.sendMeetingNotification(response.data.id);
          toast.success('Notification sent to parent');
        }
      }
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Failed to schedule meeting');
    } finally {
      setSaving(false);
    }
  };

  const handleRespond = async (id: string, status: 'confirmed' | 'cancelled') => {
    const confirmed = await confirmation.confirm({
      title: status === 'confirmed' ? 'Confirm Meeting?' : 'Cancel Meeting?',
      message: status === 'confirmed' 
        ? 'Are you sure you want to confirm this meeting?'
        : 'Are you sure you want to cancel this meeting?',
      confirmText: status === 'confirmed' ? 'Confirm' : 'Cancel',
      type: status === 'cancelled' ? 'danger' : 'warning',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.meetings.respondToMeetingRequest(id, { status });
      toast.success(`Meeting ${status}`);
      loadMeetings();
    } catch (error) {
      console.error('Failed to respond:', error);
      toast.error('Failed to update meeting');
    }
  };

  const completeMeeting = async (id: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Complete Meeting?',
      message: 'Mark this meeting as completed. You can add notes and feedback.',
      confirmText: 'Complete',
    });
    
    if (!confirmed) return;
    
    try {
      await teacherService.meetings.completeMeeting(id);
      toast.success('Meeting marked as completed');
      loadMeetings();
    } catch (error) {
      console.error('Failed to complete:', error);
      toast.error('Failed to complete meeting');
    }
  };

  const saveNotes = async () => {
    if (!selectedMeeting) return;
    
    try {
      await teacherService.meetings.addMeetingNotes(selectedMeeting.id, notesText);
      toast.success('Meeting notes saved');
      setShowNotesModal(false);
      setNotesText('');
      loadMeetings();
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const saveFeedback = async () => {
    if (!selectedMeeting) return;
    
    try {
      await teacherService.meetings.addMeetingFeedback(selectedMeeting.id, feedbackText);
      toast.success('Feedback saved');
      setShowFeedbackModal(false);
      setFeedbackText('');
      loadMeetings();
    } catch (error) {
      console.error('Failed to save feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  const rescheduleMeeting = async (meetingId: string) => {
    const confirmed = await confirmation.confirm({
      title: 'Reschedule Meeting',
      message: 'This will create a new meeting request. The original meeting will be marked as rescheduled.',
      confirmText: 'Reschedule',
    });
    
    if (!confirmed) return;
    
    setShowForm(true);
    const originalMeeting = meetings.find(m => m.id === meetingId);
    if (originalMeeting) {
      setFormData({
        studentId: originalMeeting.studentId,
        parentId: originalMeeting.parentId,
        parentName: originalMeeting.parentName,
        parentEmail: originalMeeting.parentEmail,
        parentPhone: originalMeeting.parentPhone,
        date: '',
        duration: originalMeeting.duration,
        mode: originalMeeting.mode,
        agenda: originalMeeting.agenda,
        meetingLink: originalMeeting.meetingLink || '',
        meetingLocation: originalMeeting.meetingLocation || '',
      });
    }
  };

  const joinVideoCall = (meetingLink: string) => {
    window.open(meetingLink, '_blank');
  };

  const exportMeetings = async (format: 'excel' | 'pdf') => {
    try {
      const response = await teacherService.meetings.exportMeetings({
        status: filterStatus === 'all' ? undefined : filterStatus,
        format,
      });
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meetings_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export meetings');
    }
  };

  const sendReminder = async (meetingId: string) => {
    try {
      await teacherService.meetings.sendMeetingReminder(meetingId);
      toast.success('Reminder sent to parent');
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      parentId: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      date: '',
      duration: 30,
      mode: 'in_person',
      agenda: '',
      meetingLink: '',
      meetingLocation: '',
    });
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setFormData({
        ...formData,
        studentId: student.id,
        parentId: student.parentId,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
      });
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'video': return <VideoIcon size={16} />;
      case 'phone': return <PhoneCall size={16} />;
      default: return <Map size={16} />;
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'video': return 'Video Call';
      case 'phone': return 'Phone Call';
      default: return 'In Person';
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      rescheduled: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter(meeting => 
      meeting.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.agenda.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [meetings, searchTerm]);

  if (loading && !meetings.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading meetings..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Parent-Teacher Meetings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Schedule and manage parent-teacher meetings and consultations
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'list' && 'bg-white dark:bg-gray-700 shadow')}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'calendar' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Calendar View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={loadMeetings}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportMeetings('excel')}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Schedule Meeting
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Meetings</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.requested}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
            <p className="text-xs text-gray-500">Confirmed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Completion Rate</p>
          </Card>
          <Card className="text-center">
            <div className="flex items-center justify-center gap-1">
              {getModeIcon(stats.mostUsedMode)}
              <p className="text-xs text-gray-500">{getModeLabel(stats.mostUsedMode)}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Most Used</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-gray-800"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">All Students</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="all">All Status</option>
              <option value="requested">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No meetings found</p>
          <Button variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Schedule Your First Meeting
          </Button>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition">
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {meeting.studentName}
                      </h3>
                      <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getStatusBadge(meeting.status))}>
                        {getStatusLabel(meeting.status)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {getModeIcon(meeting.mode)}
                        {getModeLabel(meeting.mode)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Parent: {meeting.parentName} • {meeting.parentEmail}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar size={14} />
                        {formatDate(meeting.scheduledDate)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock size={14} />
                        {meeting.duration} minutes
                      </span>
                    </div>

                    {meeting.agenda && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="font-medium">Agenda:</span> {meeting.agenda}
                      </p>
                    )}

                    {meeting.notes && (
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-2">
                        <span className="font-medium">Notes:</span> {meeting.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {meeting.status === 'requested' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleRespond(meeting.id, 'confirmed')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRespond(meeting.id, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                    
                    {meeting.status === 'confirmed' && (
                      <>
                        {meeting.mode === 'video' && meeting.meetingLink && (
                          <Button
                            size="sm"
                            onClick={() => joinVideoCall(meeting.meetingLink!)}
                          >
                            <Video className="w-4 h-4 mr-1" />
                            Join Call
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMeeting(meeting.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowViewModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReminder(meeting.id)}
                      title="Send Reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                    
                    {meeting.status !== 'completed' && meeting.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rescheduleMeeting(meeting.id)}
                        title="Reschedule"
                      >
                        <Repeat className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 text-center font-semibold text-sm mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2">{day}</div>
              ))}
            </div>
            {/* Calendar view implementation would go here */}
            <div className="text-center py-12 text-gray-500">
              Calendar view coming soon. Use list view for now.
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Meeting Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Schedule Meeting" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSchedule(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student *</label>
            <select
              required
              value={formData.studentId}
              onChange={(e) => handleStudentSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.className}</option>
              ))}
            </select>
          </div>

          {formData.parentName && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-medium">Parent Information</p>
              <p className="text-sm">{formData.parentName}</p>
              <p className="text-sm text-gray-600">{formData.parentEmail}</p>
              <p className="text-sm text-gray-600">{formData.parentPhone}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mode *</label>
              <select
                required
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                <option value="in_person">In Person</option>
                <option value="video">Video Call</option>
                <option value="phone">Phone Call</option>
              </select>
            </div>
          </div>

          {formData.mode === 'video' && (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Link</label>
              <input
                type="url"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          {formData.mode === 'in_person' && (
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Location</label>
              <input
                type="text"
                value={formData.meetingLocation}
                onChange={(e) => setFormData({ ...formData, meetingLocation: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="Room 201, Staff Room, etc."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Agenda *</label>
            <textarea
              required
              rows={3}
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              placeholder="What would you like to discuss?"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Calendar className="w-4 h-4 mr-1" />}
              Schedule Meeting
            </Button>
          </div>
        </form>
      </Modal>

      {/* Meeting Details Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Meeting Details" size="lg">
        {selectedMeeting && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Student</p>
                <p className="font-medium">{selectedMeeting.studentName}</p>
                <p className="text-sm text-gray-600">{selectedMeeting.studentClassName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Parent</p>
                <p className="font-medium">{selectedMeeting.parentName}</p>
                <p className="text-sm text-gray-600">{selectedMeeting.parentEmail}</p>
                <p className="text-sm text-gray-600">{selectedMeeting.parentPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Date & Time</p>
                <p className="text-sm">{formatDate(selectedMeeting.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm">{selectedMeeting.duration} minutes</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mode</p>
                <p className="text-sm flex items-center gap-1">
                  {getModeIcon(selectedMeeting.mode)}
                  {getModeLabel(selectedMeeting.mode)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <span className={clsx('px-2 py-1 rounded-full text-xs font-semibold', getStatusBadge(selectedMeeting.status))}>
                  {getStatusLabel(selectedMeeting.status)}
                </span>
              </div>
            </div>

            {selectedMeeting.meetingLink && (
              <div>
                <p className="text-xs text-gray-500">Meeting Link</p>
                <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  {selectedMeeting.meetingLink}
                </a>
              </div>
            )}

            {selectedMeeting.meetingLocation && (
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm">{selectedMeeting.meetingLocation}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500">Agenda</p>
              <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">{selectedMeeting.agenda}</p>
            </div>

            {selectedMeeting.notes && (
              <div>
                <p className="text-xs text-gray-500">Teacher's Notes</p>
                <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded">{selectedMeeting.notes}</p>
              </div>
            )}

            {selectedMeeting.feedback && (
              <div>
                <p className="text-xs text-gray-500">Parent Feedback</p>
                <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded">{selectedMeeting.feedback}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {selectedMeeting.status === 'confirmed' && (
                <Button onClick={() => completeMeeting(selectedMeeting.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark Complete
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                setSelectedMeeting(selectedMeeting);
                setNotesText(selectedMeeting.notes || '');
                setShowNotesModal(true);
              }}>
                <Edit className="w-4 h-4 mr-1" />
                Add Notes
              </Button>
              <Button variant="outline" onClick={() => sendReminder(selectedMeeting.id)}>
                <Bell className="w-4 h-4 mr-1" />
                Send Reminder
              </Button>
              <Button variant="outline" onClick={() => rescheduleMeeting(selectedMeeting.id)}>
                <Repeat className="w-4 h-4 mr-1" />
                Reschedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Notes Modal */}
      <Modal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} title="Meeting Notes" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add private notes about this meeting for your reference.
          </p>
          <textarea
            rows={6}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            placeholder="Key discussion points, action items, concerns, etc..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowNotesModal(false)}>Cancel</Button>
          <Button onClick={saveNotes}>Save Notes</Button>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Parent Feedback" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Record feedback received from the parent about this meeting.
          </p>
          <textarea
            rows={6}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
            placeholder="Parent's feedback, concerns, suggestions, etc..."
          />
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
          <Button onClick={saveFeedback}>Save Feedback</Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.confirm}
        title={confirmation.config.title}
        message={confirmation.config.message}
        confirmText={confirmation.config.confirmText}
        cancelText={confirmation.config.cancelText}
        type={confirmation.config.type}
      />
    </div>
  );
};

export default TeacherMeetingsPage;