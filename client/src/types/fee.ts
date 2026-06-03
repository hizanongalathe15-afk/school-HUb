export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  type: 'TUITION' | 'TRANSPORT' | 'BOARDING' | 'EXAM' | 'OTHER';
  term: string;
  year: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'WAIVED';
  dueDate: string;
  paidDate?: string;
  balance: number;
  reference?: string;
}

export interface FeeStructure {
  id: string;
  class: string;
  tuition: number;
  transport?: number;
  boarding?: number;
  exam: number;
  other: number;
  total: number;
  description?: string; // Added for UI compatibility
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  method: 'MPESA' | 'BANK' | 'CASH' | 'CARD';
  reference: string;
  date: string;
  receivedBy: string;
}