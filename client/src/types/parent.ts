// Parent Role Types - Complete Permission System
// Parents have LIMITED access - only their own children's data

// ============================================
// ROLE DEFINITIONS
// ============================================
export enum ParentRole {
  PARENT = 'PARENT',
  GUARDIAN = 'GUARDIAN',
}

// ============================================
// PERMISSIONS
// ============================================
export interface ParentPermission {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
}

export const PARENT_PERMISSIONS: ParentPermission[] = [
  // Dashboard
  { id: 'p_dashboard', name: 'View Dashboard', category: 'dashboard', description: 'View personalized dashboard', enabled: true },
  { id: 'p_children_overview', name: 'View Children Overview', category: 'dashboard', description: 'See quick stats for all children', enabled: true },
  
  // Children
  { id: 'p_view_children', name: 'View Own Children', category: 'children', description: 'View list of own children', enabled: true },
  { id: 'p_view_child_profile', name: 'View Child Profile', category: 'children', description: 'View each child\'s profile', enabled: true },
  { id: 'p_view_medical_info', name: 'View Medical Info', category: 'children', description: 'View child\'s medical information', enabled: true },
  
  // Academic
  { id: 'p_view_results', name: 'View Results', category: 'academic', description: 'View child\'s exam results', enabled: true },
  { id: 'p_view_performance', name: 'View Performance', category: 'academic', description: 'View performance trends', enabled: true },
  { id: 'p_download_reports', name: 'Download Reports', category: 'academic', description: 'Download report cards', enabled: true },
  
  // Attendance
  { id: 'p_view_attendance', name: 'View Attendance', category: 'attendance', description: 'View daily attendance', enabled: true },
  { id: 'p_view_attendance_summary', name: 'View Attendance Summary', category: 'attendance', description: 'View monthly attendance summary', enabled: true },
  
  // Fees
  { id: 'p_view_fees', name: 'View Fee Balance', category: 'fees', description: 'View fee balance', enabled: true },
  { id: 'p_view_fee_history', name: 'View Payment History', category: 'fees', description: 'View payment history', enabled: true },
  { id: 'p_make_payment', name: 'Make Payment', category: 'fees', description: 'Make online payments', enabled: true },
  { id: 'p_download_receipts', name: 'Download Receipts', category: 'fees', description: 'Download fee receipts', enabled: true },
  
  // Homework
  { id: 'p_view_homework', name: 'View Homework', category: 'homework', description: 'View homework assignments', enabled: true },
  
  // Timetable
  { id: 'p_view_timetable', name: 'View Timetable', category: 'timetable', description: 'View child\'s timetable', enabled: true },
  
  // Discipline
  { id: 'p_view_discipline', name: 'View Discipline', category: 'discipline', description: 'View merits and demerits', enabled: true },
  
  // Communication
  { id: 'p_send_messages', name: 'Send Messages', category: 'communication', description: 'Send messages to teachers', enabled: true },
  { id: 'p_receive_messages', name: 'Receive Messages', category: 'communication', description: 'Receive messages', enabled: true },
  { id: 'p_view_announcements', name: 'View Announcements', category: 'communication', description: 'View school announcements', enabled: true },
  
  // Meetings
  { id: 'p_book_meetings', name: 'Book Meetings', category: 'meetings', description: 'Book parent-teacher meetings', enabled: true },
  { id: 'p_view_meeting_schedule', name: 'View Meeting Schedule', category: 'meetings', description: 'View meeting schedule', enabled: true },
  
  // Events
  { id: 'p_view_events', name: 'View Events', category: 'events', description: 'View school events', enabled: true },
  { id: 'p_rsvp_events', name: 'RSVP to Events', category: 'events', description: 'RSVP to events', enabled: true },
  
  // Profile
  { id: 'p_edit_profile', name: 'Edit Profile', category: 'profile', description: 'Edit own profile', enabled: true },
  { id: 'p_change_password', name: 'Change Password', category: 'profile', description: 'Change password', enabled: true },
  { id: 'p_view_login_history', name: 'View Login History', category: 'profile', description: 'View login history', enabled: true },
  
  // Notifications
  { id: 'p_receive_notifications', name: 'Receive Notifications', category: 'notifications', description: 'Receive push notifications', enabled: true },
  { id: 'p_configure_notifications', name: 'Configure Notifications', category: 'notifications', description: 'Configure notification preferences', enabled: true },
  
  // Complaints
  { id: 'p_submit_complaint', name: 'Submit Complaint', category: 'complaints', description: 'Submit complaints', enabled: true },
  { id: 'p_track_complaint', name: 'Track Complaint', category: 'complaints', description: 'Track complaint status', enabled: true },
];

// ============================================
// CHILD DATA TYPES
// ============================================
export interface ParentChild {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  photo?: string;
  classId: string;
  className: string;
  streamId?: string;
  streamName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  medicalInfo?: ChildMedicalInfo;
  currentTermStats: ChildTermStats;
  emergencyContact?: string;
}

export interface ChildMedicalInfo {
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  bloodGroup?: string;
  emergencyContact?: string;
  insuranceNumber?: string;
}

export interface ChildTermStats {
  attendancePercentage: number;
  averageGrade?: string;
  averageScore?: number;
  classPosition?: number;
  totalStudents?: number;
  meritsCount: number;
  demeritsCount: number;
}

// ============================================
// ACADEMIC PERFORMANCE TYPES
// ============================================
export interface StudentResult {
  id: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  cat1Score?: number;
  cat2Score?: number;
  cat3Score?: number;
  examScore?: number;
  totalScore: number;
  grade: string;
  points: number;
  classAverage?: number;
  teacherComment?: string;
  termId: string;
  termName: string;
  year: number;
}

export interface PerformanceTrend {
  term: string;
  year: number;
  averageScore: number;
  grade: string;
  classPosition: number;
  totalStudents: number;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  streamName?: string;
  termId: string;
  termName: string;
  year: number;
  results: StudentResult[];
  totalPoints: number;
  averagePoints: number;
  overallGrade: string;
  classPosition: number;
  streamPosition?: number;
  totalStudents: number;
  teacherComments: string;
  principalComment?: string;
  issuedDate: string;
}

// ============================================
// ATTENDANCE TYPES
// ============================================
export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'suspended';
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedBy?: string;
}

export interface AttendanceSummary {
  studentId: string;
  month: string;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  records: AttendanceRecord[];
}

// ============================================
// FEE TYPES
// ============================================
export interface FeeBalance {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  year: number;
  totalFee: number;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  isOverdue: boolean;
  paymentPlan?: PaymentPlan;
}

export interface FeeStructure {
  id: string;
  classId: string;
  className: string;
  termId: string;
  termName: string;
  year: number;
  tuition: number;
  boarding?: number;
  transport?: number;
  activities?: number;
  miscellaneous?: number;
  total: number;
  amount?: number;
  description?: string;
  paid?: number;
  dueDate?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'mpesa' | 'bank' | 'cash' | 'cheque' | 'card';
  reference: string;
  receiptNumber: string;
  paidBy: string;
  description?: string;
  status: 'completed' | 'pending' | 'reversed';
}

export interface PaymentPlan {
  id: string;
  studentId: string;
  totalAmount: number;
  installments: Installment[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted';
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

// ============================================
// HOMEWORK TYPES
// ============================================
export interface HomeworkAssignment {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  attachments?: string[];
  dueDate: string;
  assignedDate: string;
  teacherId: string;
  teacherName: string;
  status: 'active' | 'completed' | 'overdue';
  submissionStatus?: 'submitted' | 'pending' | 'graded';
  grade?: string;
  feedback?: string;
}

// ============================================
// TIMETABLE TYPES
// ============================================
export interface TimetableEntry {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  period: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classroom?: string;
}

export interface WeeklyTimetable {
  classId: string;
  className: string;
  streamName?: string;
  termId: string;
  entries: TimetableEntry[];
  updatedAt: string;
}

// ============================================
// DISCIPLINE TYPES
// ============================================
export interface DisciplineRecord {
  id: string;
  studentId: string;
  type: 'merit' | 'demerit' | 'positive' | 'negative';
  category: string;
  description: string;
  points: number;
  issuedBy: string;
  issuedByName: string;
  issuedDate: string;
  status: 'active' | 'resolved' | 'appealed';
  notes?: string;
}

export interface Streak {
  type: 'attendance' | 'academic' | 'cleanliness' | 'behavior';
  currentStreak: number;
  bestStreak: number;
  lastUpdated: string;
}

// ============================================
// COMMUNICATION TYPES
// ============================================
export interface MessageAttachment {
  url: string;
  name: string;
  type?: 'image' | 'audio' | 'video' | 'document' | string;
  size?: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  subject: string;
  body: string;
  content: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  replies?: Message[];
  conversationId?: string;
  replyTo?: Pick<Message, 'id' | 'content' | 'body'>;
  isEdited?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'deleted' | 'pending';
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  participantPhoto?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface TypingStatus {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
}

export interface AnnouncementAttachment {
  url: string;
  name: string;
  type?: string;
  size?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'event' | 'academic' | 'fee';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | 'parents' | 'teachers' | 'students';
  classId?: string;
  attachments?: AnnouncementAttachment[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
}

// ============================================
// MEETING TYPES
// ============================================
export interface MeetingSlot {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'in-person' | 'video' | 'phone';
  isBooked: boolean;
  bookedBy?: string;
  notes?: string;
}

export interface ParentMeeting {
  id: string;
  slotId: string;
  parentId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'in-person' | 'video' | 'phone';
  location: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  meetingNotes?: string;
  meetingLink?: string;
  childName?: string;
  feedback?: string;
  actionItems?: string[];
  rating?: number;
}

// ============================================
// EVENT TYPES
// ============================================
export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'academic' | 'sports' | 'cultural' | 'meeting' | 'holiday';
  targetAudience: 'all' | 'parents' | 'students' | 'teachers';
  classId?: string;
  image?: string;
  attachments?: string[];
  rsvpRequired: boolean;
  rsvpDeadline?: string;
  isRsvped?: boolean;
  rsvpStatus?: 'attending' | 'not_attending' | 'maybe';
  guestCount?: number;
  createdAt: string;
  createdBy: string;
}

// ============================================
// PROFILE TYPES
// ============================================
export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  photo?: string;
  avatar?: string;
  language?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  occupation?: string;
  employer?: string;
  relationship: 'father' | 'mother' | 'guardian';
  idNumber?: string;
  children: ParentChild[];
  notificationPreferences: NotificationPreferences;
  communicationPreferences: CommunicationPreferences;
  security?: {
    twoFactorEnabled: boolean;
    lastPasswordChange?: string;
    loginAttempts?: number;
    loginAlerts?: boolean;
    deviceManagement?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  feeReminders: boolean;
  attendanceAlerts: boolean;
  gradeNotifications: boolean;
  disciplineAlerts: boolean;
  eventReminders: boolean;
  announcementAlerts: boolean;
  homeworkReminders: boolean;
  muted?: boolean;
}

export interface CommunicationPreferences {
  preferredLanguage: 'en' | 'sw';
  preferredContactMethod: 'email' | 'sms' | 'phone' | 'whatsapp';
  contactTimePreference: 'morning' | 'afternoon' | 'evening';
  emergencyContact: boolean;
}

// ============================================
// COMPLAINT TYPES
// ============================================
export interface Complaint {
  id: string;
  parentId: string;
  studentId?: string;
  childName?: string;
  category: 'academic' | 'discipline' | 'facility' | 'transport' | 'food' | 'other';
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: string[];
  attachmentUrl?: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'closed' | 'pending' | 'in_progress';
  assignedTo?: string;
  assignedToName?: string;
  response?: string;
  respondedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string;
  userId: string;
  type: 'fee' | 'attendance' | 'grade' | 'discipline' | 'event' | 'announcement' | 'message' | 'system';
  category?: string;
  title: string;
  message: string;
  body?: string;
  content?: string;
  data?: any;
  isRead: boolean;
  read?: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

// ============================================
// ADDITIONAL ACADEMIC TYPES
// ============================================
export interface SubjectPerformance {
  id: string;
  subjectId: string;
  subjectName: string;
  name: string;
  currentScore: number;
  score: number;
  classAverage: number;
  trend: 'improving' | 'declining' | 'stable';
  strengths: string[];
  weaknesses: string[];
  teacherRecommendations: string[];
  masteryLevel: number;
  grade: string;
  gradePoint: number;
  position?: number;
  totalStudents?: number;
  teacherComments?: string;
  improvementAreas?: string[];
}

export interface AcademicReport {
  id: string;
  studentId: string;
  termId: string;
  termName: string;
  year: number;
  overallGrade: string;
  averageScore: number;
  classPosition: number;
  streamPosition?: number;
  totalStudents: number;
  subjects: StudentResult[];
  teacherComments: string;
  principalComments?: string;
  issuedDate: string;
  title: string;
  date: string;
  status: 'ready' | 'updated' | 'pending' | 'in_progress';
}

export interface TermSummary {
  id: string;
  termId: string;
  term: string;
  termName: string;
  academicYear: string;
  year: number;
  attendancePercentage: number;
  attendance: number;
  presentDays: number;
  totalDays: number;
  averageScore: number;
  scoreChange: number;
  grade: string;
  gradePoint: number;
  classPosition: number;
  totalStudents: number;
  meritsCount: number;
  demeritsCount: number;
  homeworkCompleted: number;
  homeworkPending: number;
}

// ============================================
// DASHBOARD TYPES
// ============================================
export interface ParentDashboard {
  children: ParentChild[];
  pendingFees: FeeBalance[];
  upcomingEvents: SchoolEvent[];
  recentAnnouncements: Announcement[];
  recentMessages: Message[];
  attendanceAlerts: AttendanceAlert[];
  pendingHomework: HomeworkAssignment[];
  upcomingMeetings: ParentMeeting[];
  recentNotifications: Notification[];
  quickStats: ParentQuickStats;
}

export interface ParentQuickStats {
  totalChildren: number;
  totalFeesPending: number;
  unreadMessages: number;
  upcomingEventsCount: number;
  attendanceAlertsCount: number;
  pendingHomeworkCount: number;
}

export interface AttendanceAlert {
  studentId: string;
  studentName: string;
  date: string;
  status: 'absent' | 'late';
  message: string;
}

// ============================================
// EXTRA CURRICULAR TYPES
// ============================================
export interface ExtraCurricularActivity {
  id: string;
  studentId: string;
  activityId: string;
  activityName: string;
  description: string;
  instructor: string;
  schedule: string;
  location: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'completed';
  performanceRating?: number;
  achievements?: string[];
}

// ============================================
// MEDICAL TYPES
// ============================================
export interface MedicalRecord {
  id: string;
  studentId: string;
  recordType: string;
  description: string;
  date: string;
  doctor?: string;
  clinic?: string;
  prescription?: string;
  attachments?: string[];
  followUpDate?: string;
  isConfidential: boolean;
}

// ============================================
// BOARDING TYPES
// ============================================
export interface BoardingInfo {
  id: string;
  studentId: string;
  boardingStatus: 'day' | 'boarding';
  dormitory?: string;
  roomNumber?: string;
  bedNumber?: string;
  boardingFees?: number;
  enrolmentDate: string;
  exitDate?: string;
  parentalLeaveApprovals?: string[];
}

// ============================================
// TRANSPORT TYPES
// ============================================
export interface TransportRoute {
  id: string;
  routeName: string;
  startPoint: string;
  endPoint: string;
  stops: TransportStop[];
  driver: string;
  driverPhone: string;
  vehicle: string;
  vehicleRegistration: string;
  schedule: string;
  fees: number;
}

export interface TransportStop {
  id: string;
  name: string;
  location: string;
  pickupTime: string;
  dropoffTime: string;
}

// ============================================
// SUPPORT TICKET TYPES
// ============================================
export interface SupportTicket {
  id: string;
  parentId: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments?: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ParentApiResponse<T> {
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