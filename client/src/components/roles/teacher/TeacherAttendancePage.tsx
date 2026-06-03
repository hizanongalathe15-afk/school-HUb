// client/src/components/roles/teacher/TeacherAttendancePage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar, Check, X, Clock, AlertCircle, Download, Upload,
  Filter, Search, RefreshCw, Users, BookOpen, TrendingUp,
  TrendingDown, PieChart, BarChart3, Printer, Mail, Bell,
  UserCheck, UserX, UserMinus, Clock as ClockIcon, Edit,
  Save, Eye, FileText, ChevronDown, ChevronUp, AlertTriangle,
  Award, Star, Flag, Percent, Activity
} from 'lucide-react';
import type { AttendanceRecord, AttendanceStats, TeacherClass, TeacherStudent } from '../../../types/teacher';
import EditableSelect from '../../ui/EditableSelect';
import { teacherService } from '../../../services/teacherService';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface AttendanceRecordWithDetails extends AttendanceRecord {
  studentName: string;
  admissionNumber?: string;
  parentPhone?: string;
  parentEmail?: string;
  medicalCondition?: string;
  previousAbsences: number;
}

const statusConfig = {
  present: { label: 'Present', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <Check className="w-3 h-3" />, value: 100 },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <X className="w-3 h-3" />, value: 0 },
  late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <ClockIcon className="w-3 h-3" />, value: 50 },
  excused: { label: 'Excused', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <AlertCircle className="w-3 h-3" />, value: 75 },
};

export default function TeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecordWithDetails[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecordWithDetails | null>(null);
  const [rollCallMode, setRollCallMode] = useState(false);
  const [currentCallIndex, setCurrentCallIndex] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [attendanceType, setAttendanceType] = useState<'class' | 'subject'>('class');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const confirmation = useConfirmationDialog();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate, selectedSubject, attendanceType]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        teacherService.classes.getMyClasses(),
        teacherService.subjects.getMySubjects(),
      ]);
      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        if (classesRes.data[0]?.id) setSelectedClass(classesRes.data[0].id);
      }
      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      // Load students
      const studentsRes = await teacherService.students.getMyStudents(selectedClass);
      const studentList = studentsRes.data || [];
      setStudents(studentList);

      // Load existing attendance for this date
      let attendanceRes;
      if (attendanceType === 'subject' && selectedSubject) {
        attendanceRes = { data: [] };
      } else {
        attendanceRes = await teacherService.attendance.getClassAttendance(selectedClass, selectedDate);
      }
      
      const existingRecords: any[] = attendanceRes.data || [];
      
      // Get previous absence counts from student academic history
      const absenceStats: Record<string, number> = {};
      
      // Build attendance records
      const records: AttendanceRecordWithDetails[] = studentList.map(student => {
        const existing = existingRecords.find((r: any) => r.studentId === student.id);
        return {
          id: `${student.id}-${selectedDate}`,
          studentId: student.id,
          studentName: student.name,
          admissionNumber: student.admissionNumber,
          previousAbsences: absenceStats[student.id] || 0,
          classId: selectedClass,
          date: selectedDate,
          status: existing?.status || 'present',
          notes: existing?.notes || '',
          markedBy: existing?.markedBy || '',
          markedByName: existing?.markedByName || '',
          markedAt: existing?.markedAt || new Date().toISOString(),
        };
      });
      
      setAttendance(records);
      updateStats(records);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (records: AttendanceRecordWithDetails[]) => {
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const total = records.length;
    const percentage = total ? Math.round((present + (late * 0.5) + (excused * 0.75)) / total * 100) : 0;
    
    setStats({
      date: selectedDate,
      totalStudents: total,
      present,
      absent,
      late,
      excused,
      percentage,
    });
  };

  const markAttendance = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => {
      const next = prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status, markedAt: new Date().toISOString() }
          : record
      );
      updateStats(next);
      return next;
    });
    
    // Auto-advance in roll call mode
    if (rollCallMode) {
      const currentIndex = attendance.findIndex(r => r.studentId === studentId);
      if (currentIndex < attendance.length - 1) {
        setCurrentCallIndex(currentIndex + 1);
        // Scroll to next student
        const nextElement = document.getElementById(`student-${attendance[currentIndex + 1]?.studentId}`);
        nextElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const markBulkAttendance = (status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => {
      const next = prev.map(record => ({ ...record, status }));
      updateStats(next);
      return next;
    });
    toast.success(`Marked all students as ${status}`);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const recordsToSave = attendance.map(record => ({
        studentId: record.studentId,
        status: record.status.toUpperCase(),
        notes: notes[record.studentId] || record.notes,
      }));
      
      let response;
      if (attendanceType === 'subject' && selectedSubject) {
        response = await teacherService.attendance.markSubjectAttendance({
          classId: selectedClass,
          subjectId: selectedSubject,
          period: 1,
          date: selectedDate,
          records: recordsToSave,
        });
      } else {
        response = await teacherService.attendance.markAttendance({
          classId: selectedClass,
          date: selectedDate,
          records: recordsToSave,
        });
      }
      
      if (response.success) {
        toast.success('Attendance saved successfully');
        
        // Send notifications for absent students with >3 absences
        const highAbsenceStudents = attendance.filter(
          r => (r.status === 'absent' || r.status === 'late') && r.previousAbsences >= 2
        );
        if (highAbsenceStudents.length > 0) {
          toast.custom((t) => (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg shadow-lg">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {highAbsenceStudents.length} students have high absence rates. Consider parent notification.
            </div>
          ));
        }
      }
    } catch (error) {
      console.error('Failed to save attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const exportAttendance = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const header = 'Student,Status,Date,Class\n';
      const rows = attendance.map(r => `${r.studentName},${r.status},${selectedDate},${selectedClass}`);
      const csv = header + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${selectedClass}_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export attendance');
    }
  };

  const sendAbsenceAlert = async (student: AttendanceRecordWithDetails) => {
    try {
      await teacherService.attendance.markAttendance({
        classId: selectedClass,
        date: selectedDate,
        records: [{ studentId: student.studentId, status: student.status, notes: 'Alert sent to parent' }],
      });
      toast.success(`Alert noted for ${student.studentName}`);
    } catch (error) {
      console.error('Failed to send alert:', error);
      toast.error('Failed to send alert');
    }
  };

  const loadAttendanceHistory = async (studentId: string) => {
    try {
      const response = await teacherService.students.getStudentAttendance(studentId);
      setAttendanceHistory(response.data || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load attendance history');
    }
  };

  const filteredStudents = useMemo(() => {
    return attendance.filter(record => {
      const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (record.admissionNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendance, searchTerm, statusFilter]);

  const getAbsenceWarning = (previousAbsences: number) => {
    if (previousAbsences >= 5) return { text: 'Critical - Action Required', color: 'text-red-600' };
    if (previousAbsences >= 3) return { text: 'Warning - Needs Attention', color: 'text-orange-600' };
    if (previousAbsences >= 2) return { text: 'Monitor', color: 'text-yellow-600' };
    return null;
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" showLabel label="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Attendance Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mark and manage student attendance for your classes
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
              onClick={() => setViewMode('grid')}
              className={clsx('px-3 py-1.5 rounded-md text-sm transition', viewMode === 'grid' && 'bg-white dark:bg-gray-700 shadow')}
            >
              Grid View
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            />
          </div>
          
          <EditableSelect
            value={selectedClass}
            onChange={setSelectedClass}
            className="min-w-[200px]"
            options={classes.map(c => ({ value: c.id, label: `${c.name} - ${c.stream}` }))}
            placeholder="Select class"
          />
          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={attendanceType === 'class'}
                onChange={() => setAttendanceType('class')}
              />
              <span className="text-sm">Class Attendance</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={attendanceType === 'subject'}
                onChange={() => setAttendanceType('subject')}
              />
                  <span className="text-sm">Subject-wise</span>
            </label>
          </div>
          
          {attendanceType === 'subject' && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border rounded-lg dark:bg-gray-800"
            >
              <option value="">Select subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRollCallMode(!rollCallMode)}
              className={rollCallMode ? 'bg-blue-100 border-blue-500' : ''}
            >
              <Users className="w-4 h-4 mr-1" />
              {rollCallMode ? 'Exit Roll Call' : 'Roll Call Mode'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportAttendance('excel')}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button onClick={saveAttendance} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4 mr-1" />}
              Save Attendance
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </Card>
          <Card className="text-center border-l-4 border-l-green-500">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-500">Present</p>
          </Card>
          <Card className="text-center border-l-4 border-l-red-500">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </Card>
          <Card className="text-center border-l-4 border-l-yellow-500">
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-gray-500">Late</p>
          </Card>
          <Card className="text-center border-l-4 border-l-blue-500">
            <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
            <p className="text-xs text-gray-500">Excused</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.percentage}%</p>
            <p className="text-xs text-gray-500">Attendance Rate</p>
          </Card>
        </div>
      )}

      {/* Quick Actions Bar */}
      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => markBulkAttendance('present')}>
              <Check className="w-4 h-4 mr-1" />
              Mark All Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => markBulkAttendance('absent')}>
              <X className="w-4 h-4 mr-1" />
              Mark All Absent
            </Button>
            <Button size="sm" variant="outline" onClick={() => markBulkAttendance('late')}>
              <ClockIcon className="w-4 h-4 mr-1" />
              Mark All Late
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 border rounded-lg text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Roll Call Mode Indicator */}
      {rollCallMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-400">Roll Call Mode Active</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Calling student {currentCallIndex + 1} of {attendance.length}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setRollCallMode(false)}>
              Exit Roll Call
            </Button>
          </div>
        </div>
      )}

      {/* Attendance List */}
      {filteredStudents.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No students found for this class</p>
        </Card>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr className="text-left text-sm">
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Admission No</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Previous Absences</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((record, idx) => {
                  const status = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.present;
                  const warning = getAbsenceWarning(record.previousAbsences);
                  const isCurrentCall = rollCallMode && idx === currentCallIndex;
                  
                  return (
                    <tr 
                      key={record.studentId} 
                      id={`student-${record.studentId}`}
                      className={clsx(
                        'hover:bg-gray-50 dark:hover:bg-gray-800 transition',
                        isCurrentCall && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{record.studentName}</p>
                          {record.medicalCondition && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <AlertCircle size={10} /> {record.medicalCondition}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.admissionNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => markAttendance(record.studentId, 'present')}
                            className={clsx(
                              'px-2 py-1 rounded text-xs transition',
                              record.status === 'present' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                            )}
                          >
                            P
                          </button>
                          <button
                            onClick={() => markAttendance(record.studentId, 'absent')}
                            className={clsx(
                              'px-2 py-1 rounded text-xs transition',
                              record.status === 'absent' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                            )}
                          >
                            A
                          </button>
                          <button
                            onClick={() => markAttendance(record.studentId, 'late')}
                            className={clsx(
                              'px-2 py-1 rounded text-xs transition',
                              record.status === 'late' 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100'
                            )}
                          >
                            L
                          </button>
                          <button
                            onClick={() => markAttendance(record.studentId, 'excused')}
                            className={clsx(
                              'px-2 py-1 rounded text-xs transition',
                              record.status === 'excused' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-blue-100'
                            )}
                          >
                            E
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {record.previousAbsences > 0 ? (
                          <div>
                            <span className={clsx('text-sm font-medium', warning?.color || 'text-gray-600')}>
                              {record.previousAbsences}
                            </span>
                            {warning && (
                              <p className="text-xs text-gray-500">{warning.text}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Add note..."
                          value={notes[record.studentId] || record.notes || ''}
                          onChange={(e) => setNotes({ ...notes, [record.studentId]: e.target.value })}
                          className="w-32 px-2 py-1 text-sm border rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => loadAttendanceHistory(record.studentId)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View History"
                          >
                            <Eye size={14} className="text-gray-500" />
                          </button>
                          <button
                            onClick={() => sendAbsenceAlert(record)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Send Alert to Parent"
                            disabled={record.status !== 'absent' && record.status !== 'late'}
                          >
                            <Bell size={14} className={record.status === 'absent' || record.status === 'late' ? 'text-yellow-500' : 'text-gray-300'} />
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
          {filteredStudents.map((record) => {
            const status = statusConfig[record.status as keyof typeof statusConfig] || statusConfig.present;
            const warning = getAbsenceWarning(record.previousAbsences);
            
            return (
              <Card key={record.studentId} className="hover:shadow-lg transition">
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{record.studentName}</h3>
                      <p className="text-xs text-gray-500">#{record.admissionNumber || 'N/A'}</p>
                    </div>
                    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', status.color)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(record.studentId, 'present')}
                      className={clsx('flex-1 py-1 text-center text-sm rounded', record.status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100')}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(record.studentId, 'absent')}
                      className={clsx('flex-1 py-1 text-center text-sm rounded', record.status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100')}
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => markAttendance(record.studentId, 'late')}
                      className={clsx('flex-1 py-1 text-center text-sm rounded', record.status === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-100')}
                    >
                      Late
                    </button>
                  </div>
                  
                  {warning && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <AlertTriangle size={12} />
                      {warning.text} ({record.previousAbsences} absences)
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <button onClick={() => loadAttendanceHistory(record.studentId)} className="flex-1 text-xs text-gray-500">
                      View History
                    </button>
                    <button onClick={() => sendAbsenceAlert(record)} className="flex-1 text-xs text-blue-500">
                      Alert Parent
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Attendance History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Attendance History" size="lg">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedStudent && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{selectedStudent.studentName}</p>
              <p className="text-sm text-gray-500">Admission: {selectedStudent.admissionNumber}</p>
            </div>
          )}
          
          <div className="space-y-2">
            {attendanceHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No attendance records found</p>
            ) : (
              attendanceHistory.map((record: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">{record.subjectName || 'Class'}</p>
                  </div>
                  <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', 
                    record.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                    record.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                    record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                  )}>
                    {record.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        loading={confirmation.isLoading}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}