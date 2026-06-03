export interface FeeSummary {
  studentId: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  dueDate: string;
  paymentPlan?: string;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  date: string;
  channel: 'M-PESA' | 'Bank' | 'Cash' | 'Bursary';
  reference: string;
  amount: number;
  receiptNumber: string;
  status: 'Matched' | 'Pending' | 'Reversed';
}

export interface StartPaymentPayload {
  studentId: string;
  phone: string;
  amount: number;
}
