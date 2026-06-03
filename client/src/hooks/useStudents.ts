import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Student } from '../types/student';

export interface StudentFilters {
  classId?: string;
  stream?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  boardingStatus?: 'BOARDING' | 'DAY';
  search?: string;
  isActive?: boolean;
}

export interface StudentQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: StudentFilters;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  description?: string;
}

export interface Stream {
  id: string;
  name: string;
  classId: string;
  className?: string;
}

export interface UseStudentsReturn {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchStudents: (params?: StudentQueryParams) => Promise<void>;
  getStudentById: (id: string) => Promise<Student | null>;
  createStudent: (data: Partial<Student>) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  bulkImportStudents: (file: File) => Promise<{ imported: number; failed: number; errors: any[] }>;
  exportStudents: (format?: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
  searchStudents: (query: string) => Promise<Student[]>;
}

export function useStudents(): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async (params: StudentQueryParams = {}) => {
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

      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.stream) queryParams.append('stream', filters.stream);
      if (filters.gender) queryParams.append('gender', filters.gender);
      if (filters.boardingStatus) queryParams.append('boardingStatus', filters.boardingStatus);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());

      const response = await api.get(`/students?${queryParams.toString()}`);
      
      setStudents(response.data.students || response.data);
      setTotal(response.data.total || response.data.length);
      setTotalPages(response.data.totalPages || 1);
      setPage(page);
      setLimit(limit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStudentById = useCallback(async (id: string): Promise<Student | null> => {
    try {
      const response = await api.get(`/students/${id}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching student:', err);
      return null;
    }
  }, []);

  const createStudent = useCallback(async (data: Partial<Student>): Promise<Student> => {
    try {
      const response = await api.post('/students', data);
      setStudents(prev => [response.data, ...prev]);
      setTotal(prev => prev + 1);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create student');
    }
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>): Promise<Student> => {
    try {
      const response = await api.put(`/students/${id}`, data);
      setStudents(prev => prev.map(student => 
        student.id === id ? response.data : student
      ));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update student');
    }
  }, []);

  const deleteStudent = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/students/${id}`);
      setStudents(prev => prev.filter(student => student.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete student');
    }
  }, []);

  const bulkImportStudents = useCallback(async (file: File): Promise<{ imported: number; failed: number; errors: any[] }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/students/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchStudents({ page: 1, limit });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to import students');
    }
  }, [fetchStudents, limit]);

  const exportStudents = useCallback(async (format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    try {
      const response = await api.get(`/students/export?format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to export students');
    }
  }, []);

  const searchStudents = useCallback(async (query: string): Promise<Student[]> => {
    try {
      const response = await api.get(`/students/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (err: any) {
      console.error('Error searching students:', err);
      return [];
    }
  }, []);

  return {
    students,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    bulkImportStudents,
    exportStudents,
    searchStudents
  };
}

// Hook for managing classes and streams
export function useClasses(): { classes: SchoolClass[]; streams: Stream[]; loading: boolean } {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassesAndStreams = async () => {
      try {
        const [classesRes, streamsRes] = await Promise.all([
          api.get('/classes'),
          api.get('/streams')
        ]);
        setClasses(classesRes.data || []);
        setStreams(streamsRes.data || []);
      } catch (err) {
        console.error('Error fetching classes and streams:', err);
        // Fallback data if API fails
        setClasses([
          { id: 'form-1', name: 'Form 1', grade: 1 },
          { id: 'form-2', name: 'Form 2', grade: 2 },
          { id: 'form-3', name: 'Form 3', grade: 3 },
          { id: 'form-4', name: 'Form 4', grade: 4 }
        ]);
        setStreams([
          { id: 'form-1-east', name: 'East', classId: 'form-1' },
          { id: 'form-1-west', name: 'West', classId: 'form-1' },
          { id: 'form-2-east', name: 'East', classId: 'form-2' },
          { id: 'form-2-west', name: 'West', classId: 'form-2' },
          { id: 'form-3-east', name: 'East', classId: 'form-3' },
          { id: 'form-3-west', name: 'West', classId: 'form-3' },
          { id: 'form-4-east', name: 'East', classId: 'form-4' },
          { id: 'form-4-west', name: 'West', classId: 'form-4' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassesAndStreams();
  }, []);

  return { classes, streams, loading };
}

export default useStudents;