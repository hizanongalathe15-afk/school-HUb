// Teacher Role Types - Complete Academic Management System

// ============================================
// ROLE DEFINITIONS
// ============================================
export interface Teacher {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  avatar?: string;
  department?: string;
  specialization?: string;
  qualifications?: string[];
  dateJoined: string;
  isActive: boolean;
  role: TeacherRole;
  classes?: TeacherClass[];
  subjects?: TeacherSubject[];
  workload?: number;
  createdAt: string;
  updatedAt: string;
}

export enum TeacherRole {
  TEACHER = 'TEACHER',
  HOD = 'HEAD_OF_DEPARTMENT',
}

// ============================================
// CLASS & STUDENT TYPES
// ============================================
export interface TeacherClass {
  id: string;
  name: string;
  stream: string;
  academicLevel: 'form1' | 'form2' | 'form3' | 'form4';
  classTeacher?: string;
  studentCount: number;
  students?: TeacherStudent[];
  subjects: TeacherSubject[];
  timetable: ClassTimetableSlot[];
  room?: string;
}

export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  isClassTeacher: boolean;
}

export interface ClassTimetableSlot {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  room?: string;
}

export interface TeacherStudent {
  id: string;
  admissionNumber: string;
  name: string;
  classId: string;
  className: string;
  stream: string;
  photoUrl?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContact?: string;
  medicalAlerts?: string[];
  specialNeeds?: string;
  academicHistory: AcademicRecord[];
  attendanceSummary: AttendanceSummary;
  disciplineSummary: DisciplineSummary;
}

export interface AcademicRecord {
  term: string;
  year: string;
  subject: string;
  catScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  comment?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
}

export interface DisciplineSummary {
  merits: number;
  demerits: number;
  streaks: number;
  warnings: number;
}

// ============================================
// ATTENDANCE TYPES
// ============================================
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'early_dismissal';
  subjectId?: string;
  period?: number;
  reason?: string;
  markedBy: string;
  markedByName: string;
  markedAt: string;
  notes?: string;
}

export interface AttendanceStats {
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

// ============================================
// RESULT & GRADE TYPES
// ============================================
export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  term: 'term1' | 'term2' | 'term3';
  academicYear: string;
  cat1Score?: number;
  cat2Score?: number;
  cat3Score?: number;
  examScore?: number;
  totalScore: number;
  grade: string;
  points?: number;
  comment?: string;
  enteredBy: string;
  enteredByName: string;
  enteredAt: string;
  updatedAt?: string;
}

export interface GradeSummary {
  subject: string;
  class: string;
  term: string;
  year: string;
  totalStudents: number;
  meanScore: number;
  gradeDistribution: {
    A: number;
    Aminus: number;
    Bplus: number;
    B: number;
    Bminus: number;
    Cplus: number;
    C: number;
    Cminus: number;
    Dplus: number;
    D: number;
    Dminus: number;
    E: number;
  };
  topScorer?: {
    studentId: string;
    studentName: string;
    score: number;
  };
}

// ============================================
// HOMEWORK TYPES
// ============================================
export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  classStream?: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  dueTime?: string;
  attachments?: string[];
  markingScheme?: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'completed' | 'graded' | 'archived';
  submissions: HomeworkSubmission[];
  publishedAt?: string;
  notificationSent?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeworkSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submissionDate: string;
  attachment?: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

// ============================================
// DISCIPLINE TYPES
// ============================================
export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: 'merit' | 'demerit' | 'warning';
  category: string;
  description: string;
  points: number;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
  status: 'active' | 'resolved' | 'escalated';
  escalatedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export interface StudentStreak {
  id: string;
  studentId: string;
  studentName: string;
  type: 'academic' | 'attendance' | 'behavior' | 'cleanliness';
  currentStreak: number;
  bestStreak: number;
  lastUpdated: string;
  description: string;
}

// ============================================
// LESSON PLAN TYPES
// ============================================
export interface LessonPlan {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  date: string;
  duration: number;
  objectives: string[];
  materials: string[];
  activities: LessonActivity[];
  assessment: string;
  resources: string[];
  reflections?: string;
  sharedWithHOD: boolean;
  sharedWithStudents: boolean;
  status: 'draft' | 'published' | 'completed';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonActivity {
  id: string;
  name: string;
  description: string;
  duration: number;
  order: number;
}

// ============================================
// COMMUNICATION TYPES
// ============================================
export interface TeacherMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent' | 'admin';
  recipientId: string;
  recipientName: string;
  recipientRole: 'teacher' | 'parent' | 'admin';
  subject: string;
  message: string;
  messageHtml?: string;
  attachments?: string[];
  isRead: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  parentMessageId?: string;
  readAt?: string;
  repliedTo?: string;
  createdAt: string;
}

export interface ClassAnnouncement {
  id: string;
  title: string;
  content: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: string[];
  isPinned: boolean;
  expiresAt?: string;
  targetAudience?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ParentTeacherMeeting {
  id: string;
  teacherId: string;
  teacherName: string;
  parentId: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  studentId: string;
  studentName: string;
  studentAdmissionNumber?: string;
  studentClassName?: string;
  scheduledDate: string;
  duration: number;
  mode: 'in_person' | 'video' | 'phone';
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  agenda?: string;
  notes?: string | null;
  meetingLink?: string | null;
  meetingLocation?: string | null;
  recordingUrl?: string | null;
  feedbackProvided?: boolean;
  feedback?: string | null;
  meetingNotes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
  rescheduledFromId?: string | null;
}

// ============================================
// EXAM & TIMETABLE TYPES
// ============================================
export interface ExamTimetable {
  id: string;
  name: string;
  type: 'cat' | 'mid_term' | 'end_term';
  term: 'term1' | 'term2' | 'term3';
  academicYear: string;
  startDate: string;
  endDate: string;
  exams: ExamSchedule[];
  instructions?: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room?: string;
  invigilators: string[];
}

export interface TeacherTimetable {
  id?: string;
  teacherId: string;
  teacherName: string;
  week: number;
  year: number;
  weekStartDate?: string;
  weekEndDate?: string;
  substitutions?: any[];
  swaps?: any[];
  slots: TimetableSlot[];
}

export interface TimetableSlot {
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
  room?: string;
}

// ============================================
// REPORT TYPES
// ============================================
export interface TeacherReport {
  id: string;
  name: string;
  type: 'class_performance' | 'attendance' | 'discipline' | 'homework' | 'subject_analysis';
  filters: ReportFilters;
  data: any[];
  summary: ReportSummary;
  generatedBy: string;
  generatedAt: string;
}

export interface ReportFilters {
  classId?: string;
  subjectId?: string;
  startDate?: string;
  endDate?: string;
  term?: string;
  year?: string;
}

export interface ReportSummary {
  totalStudents: number;
  meanScore?: number;
  attendanceRate?: number;
  // Additional summary fields based on report type
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface TeacherDashboard {
  quickStats: TeacherQuickStats;
  todayClasses: TodayClass[];
  pendingTasks: PendingTask[];
  recentMessages: TeacherMessage[];
  upcomingExams: ExamSchedule[];
  announcements: ClassAnnouncement[];
  alerts: TeacherAlert[];
}

export interface TeacherQuickStats {
  totalClasses: number;
  totalStudents: number;
  pendingHomework: number;
  unmarkedTests: number;
  todayAttendance: number;
  upcomingMeetings: number;
}

export interface TodayClass {
  subject: string;
  className: string;
  stream: string;
  time: string;
  room?: string;
  studentCount: number;
}

export interface PendingTask {
  id: string;
  type: 'homework' | 'grading' | 'attendance' | 'report' | 'meeting';
  title: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high';
  count?: number;
}

export interface TeacherAlert {
  id: string;
  type: 'attendance' | 'discipline' | 'academic' | 'message';
  title: string;
  message: string;
  studentName?: string;
  className?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface TeacherNotification {
  id: string;
  type: 'announcement' | 'message' | 'meeting' | 'exam' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  isArchived?: boolean;
  isStarred?: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface TeacherApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}