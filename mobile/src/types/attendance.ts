export interface AttendanceDay {
  id: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused' | 'Sick';
  checkIn?: string;
  note?: string;
}

export interface AttendanceSummary {
  studentId: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}
