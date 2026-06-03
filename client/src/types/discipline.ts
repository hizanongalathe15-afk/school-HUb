export interface Discipline {
  id: string;
  studentId: string;
  type: 'MERIT' | 'DEMERIT' | 'PUNISHMENT';
  category: string;
  points: number;
  description: string;
  date: string;
  recordedBy: string;
  action?: string;
}

export interface Streak {
  id: string;
  studentId: string;
  type: 'CLEANLINESS' | 'ACADEMIC' | 'ATTENDANCE';
  count: number;
  maxStreak: number;
  lastUpdated: string;
}

export interface Rules {
  id: string;
  category: string;
  title: string;
  description: string;
  points: number;
}