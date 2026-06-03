export type ExamType = 'CAT1' | 'CAT2' | 'CAT3' | 'END_TERM' | 'MOCK' | 'KCSE';

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  examType: ExamType;
  score: number;
  grade?: string;
  points?: number;
  remarks?: string;
  term?: number;
  year?: number;
  date: string;
  teacherId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId?: string;
  classes: string[];
}

export interface Exam {
  id: string;
  name: string;
  type: 'CAT' | 'MIDTERM' | 'END_TERM';
  startDate: string;
  endDate: string;
  resultsPublished: boolean;
}

export interface StudentRanking {
  rank: number;
  studentId: string;
  totalScore: number;
  gradePoints: number;
}