export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const USER_ROLES = {
  DEVELOPER: 'DEVELOPER',
  PRINCIPAL: 'PRINCIPAL',
  ADMIN: 'ADMIN',
  BURSAR: 'BURSAR',
  STORE_KEEPER: 'STORE_KEEPER',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED',
} as const;

export const FEE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  WAIVED: 'WAIVED',
} as const;

export const DISCIPLINE_TYPES = {
  MERIT: 'MERIT',
  DEMERIT: 'DEMERIT',
  PUNISHMENT: 'PUNISHMENT',
} as const;

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
};

export const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

export const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export const CLASSES = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

export const STREAMS = ['A', 'B', 'C', 'D'];