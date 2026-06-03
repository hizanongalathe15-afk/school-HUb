import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import parentService from '../../../services/parentService';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';
import type { AttendanceRecord as BaseAttendanceRecord, ParentChild } from '../../../types/parent';

type AttendanceRecord = BaseAttendanceRecord & {
  status: BaseAttendanceRecord['status'] | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  lateMinutes?: number;
  reason?: string;
  markedBy?: string;
  remarks?: string;
};

type Child = Pick<ParentChild, 'id' | 'firstName' | 'lastName' | 'admissionNumber' | 'className' | 'streamName'>;

interface Statistics {
  overall: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

const ParentAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId) ?? null,
    [children, selectedChildId]
  );

  const statistics = useMemo((): Statistics => {
    if (attendance.length === 0) {
      return {
        overall: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        totalDays: 0,
        trend: 'stable',
        trendPercentage: 0
      };
    }

    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const totalDays = attendance.length;
    const overall = totalDays > 0 ? ((present + late) / totalDays) * 100 : 0;

    // Calculate trend from previous month (mock for now)
    const trend = overall >= 90 ? 'up' : overall >= 70 ? 'stable' : 'down';
    const trendPercentage = trend === 'up' ? 5 : trend === 'down' ? -3 : 0;

    return {
      overall: Math.round(overall),
      present,
      absent,
      late,
      excused,
      totalDays,
      trend,
      trendPercentage
    };
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (filterStatus === 'all') return attendance;
    return attendance.filter(a => a.status === filterStatus);
  }, [attendance, filterStatus]);

  const loadChildren = useCallback(async () => {
    try {
      const res = await parentService.children.getMyChildren();
      if (res?.success && res.data) {
        setChildren(res.data);
        if (res.data[0]) setSelectedChildId(res.data[0].id);
      } else {
        setError('Failed to load children data');
      }
    } catch (err) {
      setError('An error occurred while loading children');
      console.error(err);
    }
  }, []);

  const loadAttendance = useCallback(async (childId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await parentService.attendance.getAttendance(childId, {
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear()
      });
      
      if (res?.success && res.data) {
        setAttendance(res.data);
      } else {
        setAttendance([]);
      }
    } catch (err) {
      setError('Failed to load attendance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadAttendance(selectedChildId);
    }
  }, [selectedChildId, loadAttendance, currentMonth]);

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const variants = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      late: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      holiday: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    };
    
    const labels = {
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      excused: 'Excused',
      holiday: 'Holiday'
    };

    return (
      <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', variants[status])}>
        {labels[status]}
      </span>
    );
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const exportAttendance = () => {
    const csv = [
      ['Date', 'Status', 'Check In', 'Check Out', 'Late Minutes', 'Reason', 'Remarks'],
      ...filteredAttendance.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.status,
        record.checkInTime || '-',
        record.checkOutTime || '-',
        record.lateMinutes || '-',
        record.reason || '-',
        record.remarks || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedChild?.firstName}_${currentMonth.toLocaleString('default', { month: 'YYYY' })}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const record = attendance.find(a => new Date(a.date).toDateString() === date.toDateString());
      days.push({ day: i, date, record });
    }
    return days;
  };

  if (loading && children.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" showLabel label="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Attendance Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your child's daily attendance and punctuality
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            Calendar View
          </Button>
          <Button variant="outline" size="sm" onClick={exportAttendance}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Child Selector */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Child
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.admissionNumber}) - {c.className}
                </option>
              ))}
            </select>
          </div>
          {selectedChild && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>Class: {selectedChild.className}</span>
              {selectedChild.streamName && <span>• {selectedChild.streamName}</span>}
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Attendance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {statistics.overall}%
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {statistics.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : statistics.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                ) : null}
                <span className={statistics.trend === 'up' ? 'text-green-600' : statistics.trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                  {statistics.trendPercentage > 0 ? `+${statistics.trendPercentage}%` : statistics.trendPercentage < 0 ? `${statistics.trendPercentage}%` : 'Stable'}
                </span>
              </div>
            </div>
            <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{statistics.present}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Absent Days</p>
              <p className="text-2xl font-bold text-red-600">{statistics.absent}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.late}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      {/* Attendance Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Card>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button className="mt-4" onClick={() => loadAttendance(selectedChildId)}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : viewMode === 'calendar' ? (
        <Card>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
            {getCalendarDays().map((day, idx) => (
              <div
                key={idx}
                className={clsx(
                  'min-h-[80px] p-2 border rounded-lg',
                  day?.record?.status === 'present' && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                  day?.record?.status === 'absent' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                  day?.record?.status === 'late' && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
                  !day && 'bg-gray-50 dark:bg-gray-800'
                )}
              >
                {day && (
                  <>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.day}
                    </div>
                    {day.record && (
                      <div className="mt-1">
                        {getStatusIcon(day.record.status)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No attendance records found for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Check In</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Check Out</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {record.checkInTime || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {record.checkOutTime || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-sm">
                        {record.remarks || record.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredAttendance.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAttendance.length} of {attendance.length} records
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ParentAttendance;