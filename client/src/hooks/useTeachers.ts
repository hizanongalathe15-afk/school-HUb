import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { teacherService } from '../services/teacherService';
import type { Teacher } from '../types/teacher';

export interface TeacherFilters {
  subjectId?: string;
  department?: string;
  classId?: string;
  search?: string;
  isActive?: boolean;
}

export interface TeacherQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: TeacherFilters;
}

export interface TeacherRanking {
  teacherId: string;
  teacherName: string;
  subject: string;
  rank: number;
  averageScore: number;
  performanceScore: number;
  studentCount: number;
  passedCount: number;
  passRate: number;
  term: number;
  year: number;
}

export interface UseTeachersReturn {
  teachers: Teacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchTeachers: (params?: TeacherQueryParams) => Promise<void>;
  getTeacherById: (id: string) => Promise<Teacher | null>;
  createTeacher: (data: Partial<Teacher>) => Promise<Teacher>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<Teacher>;
  deleteTeacher: (id: string) => Promise<void>;
  assignSubjects: (teacherId: string, subjectIds: string[]) => Promise<void>;
  removeSubject: (teacherId: string, subjectId: string) => Promise<void>;
  assignClass: (teacherId: string, classId: string, role?: 'class_teacher' | 'deputy') => Promise<void>;
  removeClass: (teacherId: string, classId: string) => Promise<void>;
  requestLeave: (teacherId: string, leaveData: { type: string; startDate: string; endDate: string; reason: string }) => Promise<void>;
  approveLeave: (leaveId: string, status: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void>;
  getTeacherRankings: (subjectId?: string, term?: number, year?: number) => Promise<TeacherRanking[]>;
  getTeacherWorkload: (teacherId: string) => Promise<{ lessonsPerWeek: number; classes: any[]; subjects: any[] }>;
  searchTeachers: (query: string) => Promise<Teacher[]>;
}

export function useTeachers(): UseTeachersReturn {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async (params: TeacherQueryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'firstName',
        sortOrder = 'asc',
        filters = {}
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const response = await api.get(`/teachers?${queryParams.toString()}`);
      
      setTeachers(response.data.teachers || response.data);
      setTotal(response.data.total || response.data.length);
      setTotalPages(response.data.totalPages || 1);
      setPage(page);
      setLimit(limit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch teachers');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeacherById = useCallback(async (id: string): Promise<Teacher | null> => {
    try {
      const response = await teacherService.get(id);
      return response;
    } catch (err: any) {
      console.error('Error fetching teacher:', err);
      return null;
    }
  }, []);

  const createTeacher = useCallback(async (data: Partial<Teacher>): Promise<Teacher> => {
    try {
      const response = await api.post('/teachers', data);
      setTeachers(prev => [response.data, ...prev]);
      setTotal(prev => prev + 1);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create teacher');
    }
  }, []);

  const updateTeacher = useCallback(async (id: string, data: Partial<Teacher>): Promise<Teacher> => {
    try {
      const response = await api.put(`/teachers/${id}`, data);
      setTeachers(prev => prev.map(teacher => 
        teacher.id === id ? response.data : teacher
      ));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update teacher');
    }
  }, []);

  const deleteTeacher = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/teachers/${id}`);
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete teacher');
    }
  }, []);

  const assignSubjects = useCallback(async (teacherId: string, subjectIds: string[]): Promise<void> => {
    try {
      await api.post(`/teachers/${teacherId}/subjects`, { subjectIds });
      // Refresh teacher data
      const response = await api.get(`/teachers/${teacherId}`);
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId ? response.data : teacher
      ));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to assign subjects');
    }
  }, []);

  const removeSubject = useCallback(async (teacherId: string, subjectId: string): Promise<void> => {
    try {
      await api.delete(`/teachers/${teacherId}/subjects/${subjectId}`);
      const response = await api.get(`/teachers/${teacherId}`);
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId ? response.data : teacher
      ));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to remove subject');
    }
  }, []);

  const assignClass = useCallback(async (teacherId: string, classId: string, role: 'class_teacher' | 'deputy' = 'class_teacher'): Promise<void> => {
    try {
      await api.post(`/teachers/${teacherId}/classes`, { classId, role });
      const response = await api.get(`/teachers/${teacherId}`);
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId ? response.data : teacher
      ));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to assign class');
    }
  }, []);

  const removeClass = useCallback(async (teacherId: string, classId: string): Promise<void> => {
    try {
      await api.delete(`/teachers/${teacherId}/classes/${classId}`);
      const response = await api.get(`/teachers/${teacherId}`);
      setTeachers(prev => prev.map(teacher => 
        teacher.id === teacherId ? response.data : teacher
      ));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to remove class');
    }
  }, []);

  const requestLeave = useCallback(async (teacherId: string, leaveData: { type: string; startDate: string; endDate: string; reason: string }): Promise<void> => {
    try {
      await api.post(`/teachers/${teacherId}/leave`, leaveData);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to request leave');
    }
  }, []);

  const approveLeave = useCallback(async (leaveId: string, status: 'APPROVED' | 'REJECTED', comment?: string): Promise<void> => {
    try {
      await api.post(`/leave-requests/${leaveId}/status`, { status, comment });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to approve leave');
    }
  }, []);

  const getTeacherRankings = useCallback(async (subjectId?: string, term?: number, year?: number): Promise<TeacherRanking[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (subjectId) queryParams.append('subjectId', subjectId);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/teachers/rankings?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching teacher rankings:', err);
      return [];
    }
  }, []);

  const getTeacherWorkload = useCallback(async (teacherId: string): Promise<{ lessonsPerWeek: number; classes: any[]; subjects: any[] }> => {
    try {
      const response = await api.get(`/teachers/${teacherId}/workload`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching teacher workload:', err);
      return { lessonsPerWeek: 0, classes: [], subjects: [] };
    }
  }, []);

  const searchTeachers = useCallback(async (query: string): Promise<Teacher[]> => {
    try {
      const response = await api.get(`/teachers/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (err: any) {
      console.error('Error searching teachers:', err);
      return [];
    }
  }, []);

  return {
    teachers,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    assignSubjects,
    removeSubject,
    assignClass,
    removeClass,
    requestLeave,
    approveLeave,
    getTeacherRankings,
    getTeacherWorkload,
    searchTeachers
  };
}

export default useTeachers;