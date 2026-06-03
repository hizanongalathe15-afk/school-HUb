export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  notes?: string;
  classId: string;
}

export type AttendanceStatus = Attendance['status'];

export interface AttendanceRecord extends Attendance {
  teacherId?: string;
  term?: number;
  year?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}
