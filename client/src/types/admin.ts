// Admin Types - Complete System Management

// ============================================
// ROLE DEFINITIONS
// ============================================
export type AdminRole = 'ADMIN' | 'PRINCIPAL' | 'DEVELOPER';

export const GOD_MODE_ROLES: AdminRole[] = ['ADMIN', 'PRINCIPAL', 'DEVELOPER'];

export const hasFullAccess = (role: string): boolean => {
  return GOD_MODE_ROLES.includes(role as AdminRole);
};

// ============================================
// PERMISSIONS
// ============================================
export interface Permission {
  id: string;
  name: string;
  category: PermissionCategory;
  description: string;
  enabled: boolean;
}

export type PermissionCategory = 
  | 'school'
  | 'location'
  | 'infrastructure'
  | 'media'
  | 'students'
  | 'parents'
  | 'teachers'
  | 'staff'
  | 'academic'
  | 'attendance'
  | 'finance'
  | 'inventory'
  | 'library'
  | 'discipline'
  | 'cocurricular'
  | 'health'
  | 'communication'
  | 'users'
  | 'reports'
  | 'settings'
  | 'developer';

export interface PermissionMatrix {
  category: PermissionCategory;
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
}

// ============================================
// SCHOOL MANAGEMENT
// ============================================
export interface SchoolProfile {
  id: string;
  name: string;
  motto: string;
  vision: string;
  mission: string;
  foundingYear: number;
  history: string;
  logo?: string;
  favicon?: string;
  coverImage?: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  website: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  primaryColor: string;
  secondaryColor: string;
  academicCalendar: AcademicCalendar;
  schoolHours: SchoolHours;
  branches: SchoolBranch[];
  createdAt: string;
  updatedAt: string;
  // Additional UI properties
  totalStudents?: number;
  totalTeachers?: number;
  totalStaff?: number;
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  // Extended properties
  accreditation?: string;
  schoolType?: string;
  alternatePhone?: string;
  admissionsEmail?: string;
  poBox?: string;
  accentColor?: string;
}

export interface AcademicCalendar {
  term1Start: string;
  term1End: string;
  term2Start: string;
  term2End: string;
  term3Start: string;
  term3End: string;
  holidays: Holiday[];
}

export interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface SchoolHours {
  mondayToFriday?: {
    start: string;
    end: string;
  };
  saturday?: {
    start: string;
    end: string;
  };
  sunday?: {
    start: string;
    end: string;
  };
}

export interface SchoolBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  isActive: boolean;
}

// ============================================
// LOCATION & ENVIRONMENT
// ============================================
export interface LocationData {
  id: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  soilInformation: {
    type: string;
    description: string;
    images?: string[];
  };
  roadAccess: {
    description: string;
    conditions: string;
    images?: string[];
  };
  surroundings: {
    description: string;
    images?: string[];
  };
  droneShots: MediaItem[];
  climateData: {
    averageTemperature: number;
    rainfall: string;
    seasons: string;
  };
  neighborhoodMaps: MediaItem[];
  nearbyLandmarks: Landmark[];
}

export interface Landmark {
  name: string;
  distance: string;
  direction: string;
  description?: string;
}

// ============================================
// INFRASTRUCTURE
// ============================================
export interface Infrastructure {
  id: string;
  classrooms: Classroom[];
  laboratories: Laboratory[];
  library: LibraryFacility;
  sportsFacilities: SportsFacility[];
  dormitories: Dormitory[];
  diningHall: DiningFacility;
  chapel: ChapelFacility;
  adminBlock: AdminFacility;
  maintenanceLogs: MaintenanceLog[];
  assets: Asset[];
  // compatibility: some UI expects a flat facilities list
  facilities?: any[];
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  assignedClass?: string;
  status: 'active' | 'maintenance' | 'unused';
}

export interface Laboratory {
  id: string;
  name: string;
  type: 'science' | 'computer' | 'physics' | 'chemistry' | 'biology';
  capacity: number;
  equipment: string[];
  supervisor?: string;
  status: 'active' | 'maintenance' | 'unused';
}

export interface LibraryFacility {
  id: string;
  name: string;
  capacity: number;
  totalBooks: number;
  digitalResources: number;
  librarian?: string;
  openingHours: string;
}

export interface SportsFacility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  equipment: string[];
}

export interface Dormitory {
  id: string;
  name: string;
  type: 'boys' | 'girls' | 'mixed';
  capacity: number;
  currentOccupancy: number;
  warden?: string;
  rooms: DormRoom[];
}

export interface DormRoom {
  number: string;
  capacity: number;
  currentOccupancy: number;
  occupants?: string[];
}

export interface DiningFacility {
  id: string;
  name: string;
  capacity: number;
  mealTimes: MealTime[];
  menuPlan?: string;
}

export interface MealTime {
  meal: 'breakfast' | 'lunch' | 'dinner';
  startTime: string;
  endTime: string;
}

export interface ChapelFacility {
  id: string;
  name: string;
  capacity: number;
  serviceTimes: string[];
  chaplain?: string;
}

export interface AdminFacility {
  id: string;
  name: string;
  offices: Office[];
  departments: string[];
}

export interface Office {
  number: string;
  purpose: string;
  occupant?: string;
}

export interface MaintenanceLog {
  id: string;
  facilityId: string;
  facilityType: string;
  issue: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  reportedBy: string;
  assignedTo?: string;
  reportedAt: string;
  completedAt?: string;
  cost?: number;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber: string;
  location: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  maintenanceSchedule?: string;
  assignedTo?: string;
}

// ============================================
// MEDIA & GALLERY
// ============================================
export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document' | 'pdf' | 'other';
  url: string;
  path?: string; // For backwards compatibility
  thumbnailUrl?: string;
  title: string;
  caption?: string;
  description?: string;
  albumId?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
  isFeatured: boolean;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

export interface MediaAlbum {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
  mediaItems: MediaItem[];
}

// ============================================
// ADMIN DASHBOARD
// ============================================
export interface AdminDashboardMetrics {
  rolesReady?: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalStaff: number;
  attendanceToday: number;
  attendanceRate: number;
  feeCollectionRate: number;
  pendingFees: number;
  libraryBooks: number;
  inventoryItems: number;
  activeDisciplineCases: number;
  systemHealth: SystemHealth;
  recentActivities: ActivityLog[];
  alerts: SystemAlert[];
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: ServiceStatus;
  storage: ServiceStatus;
  email: ServiceStatus;
  sms: ServiceStatus;
  mpesa: ServiceStatus;
  uptime: number;
  lastBackup: string;
}

export interface ServiceStatus {
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  lastCheck: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  createdAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// ============================================
// USER MANAGEMENT (ADMIN VIEW)
// ============================================
export interface AdminUser extends User {
  permissions?: Permission[];
  lastLoginIP?: string;
  loginCount: number;
  failedLoginAttempts: number;
  accountLocked: boolean;
  lockedUntil?: string;
  twoFactorEnabled: boolean;
  sessions: UserSession[];
}

export interface UserSession {
  id: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActive: string;
  isActive: boolean;
}

export interface BulkUserOperation {
  operation: 'import' | 'export' | 'delete' | 'update';
  data: any[];
  options?: {
    skipExisting?: boolean;
    sendNotification?: boolean;
    validateOnly?: boolean;
  };
}

export interface BulkOperationResult {
  success: boolean;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: BulkError[];
}

export interface BulkError {
  index: number;
  data: any;
  error: string;
}

// ============================================
// ACADEMIC MANAGEMENT
// ============================================
export interface AcademicStructure {
  classes: AcademicClass[];
  streams: Stream[];
  subjects: Subject[];
  terms: AcademicTerm[];
  gradingSystem: GradingSystem;
  kcseSettings: KCSESettings;
}

export interface AcademicClass {
  id: string;
  name: string;
  level: number; // Form 1-4
  streamIds: string[];
  classTeacherId?: string;
  capacity: number;
  currentEnrollment: number;
  // Additional UI properties
  description?: string;
  coverImage?: string;
  room?: string;
  color?: string;
  academicYear?: string; // Added for UI compatibility
}

export interface Stream {
  id: string;
  name: string;
  classId: string;
  capacity: number;
  currentEnrollment: number;
  // Additional UI properties
  code?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: 'compulsory' | 'optional' | 'technical';
  kcseGroup?: string;
  description?: string;
}

export interface AcademicTerm {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
  // Additional UI properties
  termNumber?: number;
  examPeriodStart?: string;
  examPeriodEnd?: string;
  academicYear?: string;
  description?: string;
  isArchived?: boolean;
}

export interface TermStatistics {
  totalTerms: number;
  activeTerms: number;
  upcomingTerms: number;
  completedTerms: number;
  archivedTerms: number;
  conflictingTerms: number;
}

export interface TermAction {
  action: 'activate' | 'deactivate' | 'archive' | 'delete';
  termIds: string[];
}

export interface GradingSystem {
  id: string;
  name: string;
  grades: Grade[];
  isDefault: boolean;
  // Backwards-compatible fields used by UI
  description?: string;
  passMark?: number;
  levels?: any[];
  governmentBoard?: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
  equivalencyMap?: Record<string, string>;
}

export interface Grade {
  letter: string;
  minScore: number;
  maxScore: number;
  points: number;
  description?: string;
}

export interface GovernmentExamResult {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  appliedProgram?: string;
  examYear: number;
  examType: string;
  meanGrade: string;
  totalPoints: number;
  subjectGrades: Array<{
    subject: string;
    grade: string;
    score?: number;
    points?: number;
  }>;
}

export interface ApplicantFilter {
  minMeanGrade: string;
  minPoints: number;
  allowedGrades: string[];
  autoRejectBelow?: string;
  requireMathPass: boolean;
  requireEnglishPass: boolean;
  requireSciencePass: boolean;
  customSubjects: string[];
}

export interface KCSESettings {
  gradingScale: Grade[];
  subjectGroups: {
    group1: string[]; // Languages
    group2: string[]; // Sciences
    group3: string[]; // Humanities
    group4: string[]; // Technical
  };
  minimumSubjects: number;
  maximumSubjects: number;
}

export interface Timetable {
  id: string;
  classId: string;
  streamId?: string;
  termId: string;
  entries: TimetableEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  period: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  roomId?: string;
  // Additional UI properties
  id?: string;
  classId?: string;
  subjectName?: string;
  teacherName?: string;
  location?: string;
  room?: string;
}

// ============================================
// FINANCE MANAGEMENT
// ============================================
export interface FinanceDashboard {
  totalCollected: number;
  totalPending: number;
  totalExpenses: number;
  totalBudget: number;
  collectionRate: number;
  expenseRate: number;
  recentTransactions: FinanceTransaction[];
  pendingPayments: PendingPayment[];
  salaryObligations: SalaryObligation[];
  // Optional fields used by some admin UI components
  totalOutstanding?: number;
  studentsWithBalance?: number;
  // Additional fields for enhanced dashboard
  collectionGrowth?: number;
  outstandingChange?: number;
  rateChange?: number;
  mpesaTotal?: number;
  mpesaGrowth?: number;
  cashTotal?: number;
  cashGrowth?: number;
  expensesGrowth?: number;
  revenueData?: Array<{ name: string; value: number; month?: string; amount?: number }>;
  expensesData?: Array<{ category: string; value: number; amount?: number }>;
  collectionMethods?: Array<{ method: string; amount: number; percentage: number; mpesa?: number; cash?: number; bank?: number }>;
  topContributors?: Array<{ name: string; amount: number; studentName?: string; className?: string; totalPaid?: number }>;
  alerts?: Array<{ id: string; message: string; type: string }>;
  overdueAccounts?: Array<{ name: string; amount: number; days: number }>;
}

export interface FeeStructure {
  id: string;
  classId: string;
  termId: string;
  items: FeeItem[];
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // UI-friendly fields
  className?: string;
  termName?: string;
  amount?: number;
  dueDate?: string;
}

export interface FeeItem {
  name: string;
  amount: number;
  category: 'tuition' | 'boarding' | 'activity' | 'exam' | 'transport' | 'other';
  isOptional: boolean;
  description?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  method: 'cash' | 'mpesa' | 'bank' | 'cheque';
  reference?: string;
  studentId?: string;
  studentName?: string;
  receiptNumber?: string;
  date?: string;
  status?: 'pending' | 'completed' | 'verified' | 'disputed';
  description: string;
  createdBy: string;
  createdAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface PendingPayment {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  totalOwed: number;
  dueDate?: string;
  installments?: InstallmentPlan[];
}

export interface InstallmentPlan {
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidAt?: string;
}

export interface SalaryObligation {
  staffId: string;
  staffName: string;
  role: string;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  netSalary: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Allowance {
  name: string;
  amount: number;
}

export interface Deduction {
  name: string;
  amount: number;
  type: 'statutory' | 'loan' | 'other';
}

export interface Bursary {
  id: string;
  name: string;
  sponsor: string;
  totalAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  criteria: string;
  isActive: boolean;
  allocations: BursaryAllocation[];
}

export interface BursaryAllocation {
  studentId: string;
  amount: number;
  academicYear: string;
  term: string;
  awardedAt: string;
}

export interface Scholarship {
  id: string;
  name: string;
  type: 'academic' | 'sports' | 'arts' | 'need-based';
  criteria: string;
  benefits: string[];
  isActive: boolean;
  recipients: ScholarshipRecipient[];
}

export interface ScholarshipRecipient {
  studentId: string;
  awardedAt: string;
  duration: string;
  status: 'active' | 'completed' | 'revoked';
}

// ============================================
// REPORTS
// ============================================
export interface ReportConfig {
  id: string;
  name: string;
  type: 'academic' | 'financial' | 'attendance' | 'discipline' | 'inventory' | 'library';
  format: 'pdf' | 'excel' | 'csv';
  schedule?: ReportSchedule;
  filters: ReportFilter[];
  columns: ReportColumn[];
  createdAt: string;
  createdBy: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'termly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  isActive: boolean;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
}

export interface ReportColumn {
  field: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  visible: boolean;
}

// ============================================
// SYSTEM SETTINGS
// ============================================
export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  email: EmailSettings;
  sms: SMSSettings;
  mpesa: MPESASEttings;
  backup: BackupSettings;
  notifications: NotificationSettings;
}

export interface GeneralSettings {
  systemName: string;
  systemVersion: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
}

export interface SecuritySettings {
  minPasswordLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  require2FA: boolean;
  allowedIPs?: string[];
}

export interface EmailSettings {
  provider: 'smtp' | 'sendgrid' | 'ses';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  apiKey?: string;
}

export interface SMSSettings {
  provider: 'twilio' | 'africas-talking' | 'local';
  apiKey?: string;
  apiSecret?: string;
  senderId: string;
}

export interface MPESASEttings {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly';
  backupTime: string;
  retentionDays: number;
  storageLocation: 'local' | 'cloud';
  lastBackup?: string;
  nextBackup?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnStudentEnrollment: boolean;
  notifyOnFeePayment: boolean;
  notifyOnDisciplineIssue: boolean;
  notifyOnLowInventory: boolean;
  notifyOnSystemError: boolean;
}

// Import User type from user.ts
import type { User } from './user';

// Re-export Student and Teacher types for components that need them
export type { Student } from './student';
export type { Teacher } from './teacher';

// Add missing Class type alias
export type Class = AcademicClass;
