import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Result, ExamType } from '../types/result';

export interface ResultFilters {
  studentId?: string;
  subjectId?: string;
  classId?: string;
  examType?: ExamType;
  term?: number;
  year?: number;
  teacherId?: string;
}

export interface ResultQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: ResultFilters;
}

export interface ResultWithDetails extends Result {
  studentName?: string;
  admissionNumber?: string;
  subjectName?: string;
  teacherName?: string;
  className?: string;
}

export interface ClassPerformance {
  subjectId: string;
  subjectName: string;
  meanScore: number;
  passRate: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
  topScore: number;
  lowestScore: number;
  standardDeviation: number;
  totalStudents: number;
}

export interface StudentRanking {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  totalMarks: number;
  averageScore: number;
  grade: string;
  points: number;
  position: number;
  totalStudents: number;
}

export interface SubjectAnalysis {
  subjectId: string;
  subjectName: string;
  meanScore: number;
  passRate: number;
  topScorer: {
    studentId: string;
    studentName: string;
    score: number;
  };
  weakestAreas: string[];
  recommendations: string[];
}

export interface KCSEPrediction {
  studentId: string;
  studentName: string;
  predictedGrade: string;
  predictedPoints: number;
  subjectPredictions: {
    subjectId: string;
    subjectName: string;
    predictedScore: number;
    predictedGrade: string;
    confidence: number;
  }[];
  universityPlacement: string[];
}

export interface UseResultsReturn {
  results: ResultWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchResults: (params?: ResultQueryParams) => Promise<void>;
  getResultsByStudent: (studentId: string, term?: number, year?: number) => Promise<ResultWithDetails[]>;
  getResultsByClass: (classId: string, examType?: ExamType, term?: number, year?: number) => Promise<ResultWithDetails[]>;
  getResultsBySubject: (subjectId: string, classId?: string, term?: number, year?: number) => Promise<ResultWithDetails[]>;
  enterResult: (data: Partial<Result>) => Promise<Result>;
  bulkEnterResults: (data: { examType: ExamType; term: number; year: number; results: { studentId: string; subjectId: string; score: number }[] }) => Promise<number>;
  updateResult: (id: string, data: Partial<Result>) => Promise<Result>;
  deleteResult: (id: string) => Promise<void>;
  calculateGrade: (score: number, subjectId?: string) => Promise<{ grade: string; points: number; remarks: string }>;
  getClassPerformance: (classId: string, term?: number, year?: number) => Promise<ClassPerformance[]>;
  getStudentRanking: (classId: string, term?: number, year?: number) => Promise<StudentRanking[]>;
  getSubjectAnalysis: (subjectId: string, term?: number, year?: number) => Promise<SubjectAnalysis | null>;
  predictKCSEGrades: (classId: string) => Promise<KCSEPrediction[]>;
  getResultTrends: (studentId: string, terms?: number) => Promise<{ term: string; averageScore: number; grade: string; position: number }[]>;
  compareClassPerformance: (classIds: string[], term?: number, year?: number) => Promise<{ classId: string; className: string; meanScore: number; passRate: number }[]>;
  exportResults: (classId?: string, subjectId?: string, term?: number, year?: number, format?: 'csv' | 'excel' | 'pdf') => Promise<Blob>;
  generateReportCard: (studentId: string, term?: number, year?: number) => Promise<Blob>;
}

export function useResults(): UseResultsReturn {
  const [results, setResults] = useState<ResultWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async (params: ResultQueryParams = {}) => {
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
      if (filters.subjectId) queryParams.append('subjectId', filters.subjectId);
      if (filters.classId) queryParams.append('classId', filters.classId);
      if (filters.examType) queryParams.append('examType', filters.examType);
      if (filters.term) queryParams.append('term', filters.term.toString());
      if (filters.year) queryParams.append('year', filters.year.toString());
      if (filters.teacherId) queryParams.append('teacherId', filters.teacherId);

      const response = await api.get(`/results?${queryParams.toString()}`);
      
      setResults(response.data.results || response.data);
      setTotal(response.data.total || response.data.length);
      setTotalPages(response.data.totalPages || 1);
      setPage(page);
      setLimit(limit);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch results');
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getResultsByStudent = useCallback(async (studentId: string, term?: number, year?: number): Promise<ResultWithDetails[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/student/${studentId}?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching student results:', err);
      return [];
    }
  }, []);

  const getResultsByClass = useCallback(async (classId: string, examType?: ExamType, term?: number, year?: number): Promise<ResultWithDetails[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (examType) queryParams.append('examType', examType);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/class/${classId}?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching class results:', err);
      return [];
    }
  }, []);

  const getResultsBySubject = useCallback(async (subjectId: string, classId?: string, term?: number, year?: number): Promise<ResultWithDetails[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/subject/${subjectId}?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching subject results:', err);
      return [];
    }
  }, []);

  const enterResult = useCallback(async (data: Partial<Result>): Promise<Result> => {
    try {
      const response = await api.post('/results', data);
      setResults(prev => [response.data as ResultWithDetails, ...prev]);
      setTotal(prev => prev + 1);
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to enter result');
    }
  }, []);

  const bulkEnterResults = useCallback(async (data: { examType: ExamType; term: number; year: number; results: { studentId: string; subjectId: string; score: number }[] }): Promise<number> => {
    try {
      const response = await api.post('/results/bulk', data);
      await fetchResults({ page: 1, limit });
      return response.data.count;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to enter bulk results');
    }
  }, [fetchResults, limit]);

  const updateResult = useCallback(async (id: string, data: Partial<Result>): Promise<Result> => {
    try {
      const response = await api.put(`/results/${id}`, data);
      setResults(prev => prev.map(result => result.id === id ? response.data : result));
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update result');
    }
  }, []);

  const deleteResult = useCallback(async (id: string): Promise<void> => {
    try {
      await api.delete(`/results/${id}`);
      setResults(prev => prev.filter(result => result.id !== id));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete result');
    }
  }, []);

  const calculateGrade = useCallback(async (score: number, subjectId?: string): Promise<{ grade: string; points: number; remarks: string }> => {
    try {
      const queryParams = subjectId ? `?subjectId=${subjectId}` : '';
      const response = await api.get(`/results/calculate-grade?score=${score}${queryParams}`);
      return response.data;
    } catch (err: any) {
      console.error('Error calculating grade:', err);
      return { grade: 'E', points: 0, remarks: 'Fail' };
    }
  }, []);

  const getClassPerformance = useCallback(async (classId: string, term?: number, year?: number): Promise<ClassPerformance[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/class/${classId}/performance?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching class performance:', err);
      return [];
    }
  }, []);

  const getStudentRanking = useCallback(async (classId: string, term?: number, year?: number): Promise<StudentRanking[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/class/${classId}/ranking?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching student ranking:', err);
      return [];
    }
  }, []);

  const getSubjectAnalysis = useCallback(async (subjectId: string, term?: number, year?: number): Promise<SubjectAnalysis | null> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/subject/${subjectId}/analysis?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching subject analysis:', err);
      return null;
    }
  }, []);

  const predictKCSEGrades = useCallback(async (classId: string): Promise<KCSEPrediction[]> => {
    try {
      const response = await api.get(`/results/class/${classId}/kcse-predictions`);
      return response.data;
    } catch (err: any) {
      console.error('Error predicting KCSE grades:', err);
      return [];
    }
  }, []);

  const getResultTrends = useCallback(async (studentId: string, terms: number = 6): Promise<{ term: string; averageScore: number; grade: string; position: number }[]> => {
    try {
      const response = await api.get(`/results/student/${studentId}/trends?terms=${terms}`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching result trends:', err);
      return [];
    }
  }, []);

  const compareClassPerformance = useCallback(async (classIds: string[], term?: number, year?: number): Promise<{ classId: string; className: string; meanScore: number; passRate: number }[]> => {
    try {
      const queryParams = new URLSearchParams({ classIds: classIds.join(',') });
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/compare?${queryParams.toString()}`);
      return response.data;
    } catch (err: any) {
      console.error('Error comparing class performance:', err);
      return [];
    }
  }, []);

  const exportResults = useCallback(async (classId?: string, subjectId?: string, term?: number, year?: number, format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    try {
      const queryParams = new URLSearchParams();
      if (classId) queryParams.append('classId', classId);
      if (subjectId) queryParams.append('subjectId', subjectId);
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/export?format=${format}&${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to export results');
    }
  }, []);

  const generateReportCard = useCallback(async (studentId: string, term?: number, year?: number): Promise<Blob> => {
    try {
      const queryParams = new URLSearchParams();
      if (term) queryParams.append('term', term.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/results/student/${studentId}/report-card?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to generate report card');
    }
  }, []);

  return {
    results,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchResults,
    getResultsByStudent,
    getResultsByClass,
    getResultsBySubject,
    enterResult,
    bulkEnterResults,
    updateResult,
    deleteResult,
    calculateGrade,
    getClassPerformance,
    getStudentRanking,
    getSubjectAnalysis,
    predictKCSEGrades,
    getResultTrends,
    compareClassPerformance,
    exportResults,
    generateReportCard
  };
}

export default useResults;