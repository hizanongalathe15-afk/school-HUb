export interface MobileStudent {
  id: string;
  admissionNumber: string;
  name: string;
  className: string;
  stream: string;
  house: string;
  boardingStatus: 'Day' | 'Boarding';
  attendanceRate: number;
  meanGrade: string;
  feeBalance: number;
  nextExam: string;
  disciplineScore: number;
}

export interface StudentResult {
  subject: string;
  score: number;
  grade: string;
  rank: number;
  comment: string;
}

export interface HomeworkTask {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Returned';
}
