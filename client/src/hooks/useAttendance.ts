import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { AttendanceRecord, AttendanceStatus } from '../types/attendance';

export interface AttendanceFilters {
  studentId?: string;
  classId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  teacherId?: string;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: AttendanceFilters;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  streak: number;
  isChronicAbsent: boolean;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercentage: number;
}

export interface DailyAttendance {
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface UseAttendanceReturn {
  attendance: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchAttendance: (params?: AttendanceQueryParams) => Promise<void>;
  getAttendanceByStudent: (studentId: string, startDate?: string, endDate?: string) => Promise<AttendanceRecord[]>;
  getAttendanceByClass: (classId: string, date?: string) => Promise<AttendanceRecord[]>;
  markAttendance: (data: { studentId: string; classId: string; status: AttendanceStatus; notes?: string }) => Promise<AttendanceRecord>;
  bulkMarkAttendance: (data: { classId: string; date: string; records: { studentId: string; status: AttendanceStatus; notes?: string }[] }) => Promise<number>;
  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => Promise<AttendanceRecord>;
  deleteAttendance: (id: string) => Promise<void>;
  getAttendanceSummary: (studentId: string, term?: number, year?: number) => Promise<AttendanceSummary | null>;
  getClassAttendanceSummary: (classId: string, date?: string) => Promise<ClassAttendanceSummary | null>;
  getDailyAttendance: (startDate: string, endDate: string, classId?: string) => Promise<DailyAttendance[]>;
  getChronicAbsentees: (threshold?: number) => Promise<AttendanceSummary[]>;
  getAttendanceStreaks: (studentId: string) => Promise<{ currentStreak: number; longestStreak: number }>;
  exportAttendanceReport: (classId?: string, startDate?: string, endDate?: string, format?: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
}

export function useAttendance(): UseAttendanceReturn {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (params: AttendanceQueryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'date',
        sortOrder = 'desc',
        filters = {}
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.teacherId) queryParams.append('teacherId', filters.teacherId);

      const response = await api.get(`/attendance?${queryParams.toString()}`);
      
      setAttendance(response.data.attendance || response.data);
      setTotal(response.data.total || response.data.length);
      setTotalPages(response.data.totalPages || 1);
      setPage(page);
      setLimit(limit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch attendance');
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAttendanceByStudent = useCallback(async (studentId: string, startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await api.get(`/attendance/student/${studentId}?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching student attendance:', err);
      return [];
    }
  }, []);

  const getAttendanceByClass = useCallback(async (classId: string, date?: string): Promise<AttendanceRecord[]> => {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await api.get(`/attendance/class/${classId}${queryParams}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching class attendance:', err);
      return [];
    }
  }, []);

  const markAttendance = useCallback(async (data: { studentId: string; classId: string; status: AttendanceStatus; notes?: string }): Promise<AttendanceRecord> => {
    try {
      const response = await api.post('/attendance', data);
      setAttendance(prev => [response.data, ...prev]);
      setTotal(prev => prev + 1);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to mark attendance');
    }
  }, []);

  const bulkMarkAttendance = useCallback(async (data: { classId: string; date: string; records: { studentId: string; status: AttendanceStatus; notes?: string }[] }): Promise<number> => {
    try {
      const response = await api.post('/attendance/bulk', data);
      await fetchAttendance({ page: 1, limit });
      return response.data.count;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to mark bulk attendance');
    }
  }, [fetchAttendance, limit]);

  const updateAttendance = useCallback(async (id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    try {
      const response = await api.put(`/attendance/${id}`, data);
      setAttendance(prev => prev.map(record => record.id === id ? response.data : record));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update attendance');
    }
  }, []);

  const deleteAttendance = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/attendance/${id}`);
      setAttendance(prev => prev.filter(record => record.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete attendance');
    }
  }, []);

  const getAttendanceSummary = useCallback(async (studentId: string, term?: number, year?: number): Promise<AttendanceSummary | null> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/attendance/student/${studentId}/summary?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching attendance summary:', err);
      return null;
    }
  }, []);

  const getClassAttendanceSummary = useCallback(async (classId: string, date?: string): Promise<ClassAttendanceSummary | null> => {
    try {
      const queryParams = date ? `?date=${date}` : '';
      const response = await api.get(`/attendance/class/${classId}/summary${queryParams}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching class attendance summary:', err);
      return null;
    }
  }, []);

  const getDailyAttendance = useCallback(async (startDate: string, endDate: string, classId?: string): Promise<DailyAttendance[]> => {
    try {
      const queryParams = new URLSearchParams({ startDate, endDate });
      if (classId) queryParams.append('classId', classId);

      const response = await api.get(`/attendance/daily?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching daily attendance:', err);
      return [];
    }
  }, []);

  const getChronicAbsentees = useCallback(async (threshold: number = 10): Promise<AttendanceSummary[]> => {
    try {
      const response = await api.get(`/attendance/chronic-absentees?threshold=${threshold}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching chronic absentees:', err);
      return [];
    }
  }, []);

  const getAttendanceStreaks = useCallback(async (studentId: string): Promise<{ currentStreak: number; longestStreak: number }> => {
    try {
      const response = await api.get(`/attendance/student/${studentId}/streaks`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching attendance streaks:', err);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }, []);

  const exportAttendanceReport = useCallback(async (classId?: string, startDate?: string, endDate?: string, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await api.get(`/attendance/export?format=${format}&${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to export attendance report');
    }
  }, []);

  return {
    attendance,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    markAttendance,
    bulkMarkAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceSummary,
    getClassAttendanceSummary,
    getDailyAttendance,
    getChronicAbsentees,
    getAttendanceStreaks,
    exportAttendanceReport
  };
}

export default useAttendance;