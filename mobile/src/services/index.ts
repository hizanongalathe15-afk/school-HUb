import type {
  AttendanceDay,
  AttendanceSummary,
  FeeSummary,
  FeeTransaction,
  LoginPayload,
  LoginResponse,
  MobileStudent,
  ParentMessage,
  SchoolEvent,
  StartPaymentPayload,
  StudentResult
} from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4001/api';

const demoUser = {
  id: 'parent-001',
  name: 'Mary Otieno',
  email: 'parent@schoolhub.ac.ke',
  phone: '+254712345678',
  role: 'PARENT' as const,
  preferredLanguage: 'en' as const,
  twoFactorEnabled: true
};

const students: MobileStudent[] = [
  {
    id: 'stu-001',
    admissionNumber: 'SH-2024-018',
    name: 'Amina Otieno',
    className: 'Form 3',
    stream: 'East',
    house: 'Jasiri',
    boardingStatus: 'Boarding',
    attendanceRate: 96,
    meanGrade: 'B+',
    feeBalance: 15000,
    nextExam: '2026-06-03',
    disciplineScore: 94
  },
  {
    id: 'stu-002',
    admissionNumber: 'SH-2025-044',
    name: 'Brian Otieno',
    className: 'Form 1',
    stream: 'North',
    house: 'Umoja',
    boardingStatus: 'Day',
    attendanceRate: 93,
    meanGrade: 'A-',
    feeBalance: 8000,
    nextExam: '2026-06-05',
    disciplineScore: 97
  }
];

const results: Record<string, StudentResult[]> = {
  'stu-001': [
    { subject: 'Mathematics', score: 78, grade: 'A-', rank: 4, comment: 'Strong algebra work; improve speed in geometry.' },
    { subject: 'English', score: 72, grade: 'B+', rank: 8, comment: 'Excellent oral work and steady composition growth.' },
    { subject: 'Biology', score: 69, grade: 'B', rank: 11, comment: 'Practical diagrams need cleaner labeling.' }
  ],
  'stu-002': [
    { subject: 'Mathematics', score: 84, grade: 'A', rank: 2, comment: 'Excellent consistency across topics.' },
    { subject: 'Kiswahili', score: 76, grade: 'A-', rank: 5, comment: 'Good grammar control and reading comprehension.' },
    { subject: 'Integrated Science', score: 81, grade: 'A', rank: 3, comment: 'Practical confidence is improving.' }
  ]
};

const feeSummaries: FeeSummary[] = students.map((student) => ({
  studentId: student.id,
  totalBilled: 50000,
  totalPaid: 50000 - student.feeBalance,
  balance: student.feeBalance,
  dueDate: '2026-06-14',
  paymentPlan: student.feeBalance > 10000 ? 'Two installments approved' : undefined
}));

const transactions: FeeTransaction[] = [
  { id: 'txn-001', studentId: 'stu-001', date: '2026-05-11', channel: 'M-PESA', reference: 'QF41H92A', amount: 20000, receiptNumber: 'REC-2026-1841', status: 'Matched' },
  { id: 'txn-002', studentId: 'stu-001', date: '2026-04-22', channel: 'Bank', reference: 'BNK-7721', amount: 15000, receiptNumber: 'REC-2026-1620', status: 'Matched' },
  { id: 'txn-003', studentId: 'stu-002', date: '2026-05-08', channel: 'M-PESA', reference: 'QF11X45D', amount: 42000, receiptNumber: 'REC-2026-1809', status: 'Matched' }
];

const attendance: AttendanceDay[] = [
  { id: 'att-001', studentId: 'stu-001', date: '2026-05-20', status: 'Present', checkIn: '06:58' },
  { id: 'att-002', studentId: 'stu-001', date: '2026-05-19', status: 'Late', checkIn: '07:22', note: 'Transport delay' },
  { id: 'att-003', studentId: 'stu-002', date: '2026-05-20', status: 'Present', checkIn: '07:04' },
  { id: 'att-004', studentId: 'stu-002', date: '2026-05-19', status: 'Present', checkIn: '06:55' }
];

const messages: ParentMessage[] = [
  { id: 'msg-001', from: 'Class Teacher', subject: 'Academic clinic slot', body: 'A Friday 10:30 meeting slot is available for progress review.', channel: 'Portal', unread: true, createdAt: '2026-05-20T08:30:00.000Z' },
  { id: 'msg-002', from: 'Bursar', subject: 'Fee statement ready', body: 'Your Term 2 fee statement and QR receipt bundle are ready.', channel: 'Email', unread: true, createdAt: '2026-05-19T12:10:00.000Z' },
  { id: 'msg-003', from: 'Transport Desk', subject: 'Route update', body: 'Morning pickup route B will leave ten minutes earlier during exams.', channel: 'WhatsApp', unread: false, createdAt: '2026-05-18T15:45:00.000Z' }
];

const events: SchoolEvent[] = [
  { id: 'evt-001', title: 'Academic clinic', date: '2026-05-29', location: 'Main hall', consentRequired: false, status: 'Open' },
  { id: 'evt-002', title: 'County sports fixture', date: '2026-06-07', location: 'County stadium', consentRequired: true, status: 'Open' },
  { id: 'evt-003', title: 'Term exam starts', date: '2026-06-03', location: 'Exam rooms', consentRequired: false, status: 'Confirmed' }
];

async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`);
    if (!response.ok) {
      return fallback;
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export const mobileApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    return {
      token: `demo-token-${Date.now()}`,
      refreshToken: `demo-refresh-${Date.now()}`,
      user: { ...demoUser, email: payload.email || demoUser.email }
    };
  },

  async getProfile() {
    return request('/parents/me', demoUser);
  },

  async getStudents() {
    return request('/students', students);
  },

  async getResults(studentId: string) {
    return request(`/results?studentId=${studentId}`, results[studentId] || []);
  },

  async getFeeSummaries() {
    return request('/fees/summary', feeSummaries);
  },

  async getTransactions() {
    return request('/fees/transactions', transactions);
  },

  async startPayment(payload: StartPaymentPayload) {
    return {
      id: `pay-${Date.now()}`,
      status: 'Pending',
      message: `STK push prepared for ${payload.phone}`,
      payload
    };
  },

  async getAttendance() {
    return request('/attendance', attendance);
  },

  async getAttendanceSummary(studentId: string): Promise<AttendanceSummary> {
    const rows = attendance.filter((day) => day.studentId === studentId);
    const present = rows.filter((day) => day.status === 'Present').length;
    const late = rows.filter((day) => day.status === 'Late').length;
    const absent = rows.filter((day) => day.status === 'Absent').length;
    const excused = rows.filter((day) => day.status === 'Excused' || day.status === 'Sick').length;
    return { studentId, present, late, absent, excused, rate: students.find((student) => student.id === studentId)?.attendanceRate || 0 };
  },

  async getMessages() {
    return request('/communication/messages', messages);
  },

  async getEvents() {
    return request('/events', events);
  }
};
