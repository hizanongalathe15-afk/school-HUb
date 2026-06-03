// Bursar Role Types - Complete Financial Management System

// ============================================
// ROLE DEFINITIONS
// ============================================
export enum BursarRole {
  BURSAR = 'BURSAR',
}

// ============================================
// FEE STRUCTURE TYPES
// ============================================
export interface FeeStructure {
  id: string;
  name: string;
  academicYear: string;
  term: 'term1' | 'term2' | 'term3';
  classId: string;
  className: string;
  termName?: string;
  streamId?: string;
  streamName?: string;
  boardingType: 'boarding' | 'day';
  components: FeeComponent[];
  totalAmount: number;
  // convenience
  amount?: number;
  dueDate: string;
  isActive: boolean;
  notes?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeComponent {
  id: string;
  name: string;
  description?: string;
  amount: number;
  isOptional: boolean;
  category: 'tuition' | 'boarding' | 'activities' | 'transport' | 'uniform' | 'books' | 'exam' | 'other';
}

export interface SchoolSettings {
  schoolName: string;
  motto?: string;
  phone?: string;
  email?: string;
  address?: string;
  bankAccount?: string;
  mpesaPaybill?: string;
  logoUrl?: string;
}

// ============================================
// FEE PAYMENT TYPES
// ============================================
export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank' | 'cheque' | 'card';
  transactionReference?: string;
  bankName?: string;
  chequeNumber?: string;
  paymentDate: string;
  allocatedTo: FeeAllocation[];
  term: 'term1' | 'term2' | 'term3';
  academicYear: string;
  recordedBy: string;
  recordedByName: string;
  status: 'recorded' | 'reconciled' | 'disputed';
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeeAllocation {
  feeComponentId: string;
  feeComponentName: string;
  amount: number;
  academicYear: string;
  term: 'term1' | 'term2' | 'term3';
}

// ============================================
// STUDENT FEE STATE TYPES
// ============================================
export interface StudentFeeState {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  arrears: number;
  status: 'paid' | 'partial' | 'arrears' | 'overpaid';
  paymentHistory: FeePayment[];
  paymentPlan?: PaymentPlan;
  scholarship?: Scholarship;
  bursary?: Bursary;
  lastPaymentDate?: string;
  flags: string[];
}

// ============================================
// PAYMENT PLAN TYPES
// ============================================
export interface PaymentPlan {
  id: string;
  studentId: string;
  studentName: string;
  totalAmount: number;
  remainingAmount: number;
  installments: Installment[];
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  createdBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'partial' | 'overdue';
  paidDate?: string;
  paymentId?: string;
  notes?: string;
}

// ============================================
// EXPENSE TYPES
// ============================================
export interface Expense {
  id: string;
  referenceNumber: string;
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank' | 'cheque';
  transactionReference?: string;
  vendor?: string;
  vendorContact?: string;
  date: string;
  department?: string;
  projectId?: string;
  projectName?: string;
  attachments: string[];
  recordedBy: string;
  recordedByName: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  budgetAllocation?: number;
  spentAmount?: number;
  remainingBudget?: number;
  color?: string;
  isActive: boolean;
}

// ============================================
// SALARY & PAYROLL TYPES
// ============================================
export interface SalaryStructure {
  id: string;
  name: string;
  grade: string;
  basicSalary: number;
  allowances: Allowance[];
  deductions: Deduction[];
  employerContributions: EmployerContribution[];
  isActive: boolean;
  effectiveDate: string;
  endDate?: string;
}

export interface Allowance {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  description?: string;
}

export interface Deduction {
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
  statutory: boolean;
  description?: string;
}

export interface EmployerContribution {
  name: string;
  type: 'percentage';
  value: number;
  description?: string;
}

export interface PayrollRun {
  id: string;
  name: string;
  month: number;
  year: number;
  status: 'draft' | 'processing' | 'completed' | 'disbursed';
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  totalEmployerCost: number;
  employeeCount: number;
  processedBy: string;
  approvedBy?: string;
  disbursedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  payrollRunId: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  grossSalary: number;
  netSalary: number;
  paymentMethod: 'bank' | 'mpesa' | 'cheque';
  bankAccount?: string;
  bankName?: string;
  mpesaNumber?: string;
  chequeNumber?: string;
  status: 'pending' | 'paid' | 'failed';
  paymentDate?: string;
  payslipUrl?: string;
  notes?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  requestDate: string;
  approvedAmount?: number;
  approvedBy?: string;
  approvedAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  repaymentSchedule: {
    month: string;
    amount: number;
    deducted: boolean;
  }[];
  totalRepaid: number;
  remainingBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BUDGET TYPES
// ============================================
export interface Budget {
  id: string;
  name: string;
  fiscalYear: string;
  departments: BudgetDepartment[];
  totalAllocation: number;
  totalSpent: number;
  remaining: number;
  utilizationPercentage: number;
  status: 'draft' | 'approved' | 'active' | 'closed' | 'CLOSED';
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDepartment {
  id: string;
  name: string;
  allocation: number;
  spent: number;
  remaining: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocation: number;
  spent: number;
  remaining: number;
}

// ============================================
// SCHOLARSHIP & BURSARY TYPES
// ============================================
export interface Scholarship {
  id: string;
  name: string;
  sponsor?: string;
  type: 'academic' | 'sports' | 'arts' | 'need-based' | 'other';
  coverage: 'full' | 'partial';
  coveragePercentage?: number;
  maxAmount?: number;
  criteria: string;
  applicationDeadline?: string;
  recipients: ScholarshipRecipient[];
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScholarshipRecipient {
  id?: string;
  studentId: string;
  studentName: string;
  scholarshipId: string;
  academicYear: string;
  term: 'term1' | 'term2' | 'term3';
  amount: number;
  status: 'active' | 'completed' | 'revoked';
  sponsor?: string;
  reason?: string;
  awardedBy: string;
  awardedAt: string;
  admissionNumber?: string;
  dateAwarded?: string;
  className?: string;
}

export interface Bursary {
  id: string;
  name: string;
  fund?: string;
  type: 'need-based' | 'emergency' | 'special';
  maxAmount: number;
  totalFund: number;
  remainingFund: number;
  criteria: string;
  applicationProcess: string;
  recipients: BursaryRecipient[];
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BursaryRecipient {
  id?: string;
  studentId: string;
  studentName: string;
  bursaryId: string;
  amount: number;
  academicYear: string;
  term: 'term1' | 'term2' | 'term3';
  reason: string;
  provider?: string;
  status: 'pending' | 'approved' | 'disbursed' | 'rejected';
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

// ============================================
// INVOICE TYPES
// ============================================
export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'fee' | 'other';
  studentId?: string;
  studentName?: string;
  admissionNumber?: string;
  amount?: number;
  description?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  issuedDate: string;
  sentDate?: string;
  paidDate?: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  feeComponentId?: string;
  academicYear?: string;
  term?: string;
}

// ============================================
// MPESA TRANSACTION TYPES
// ============================================
export interface MPesaTransaction {
  id: string;
  transactionId: string;
  mpesaReceiptNumber: string;
  phoneNumber: string;
  amount: number;
  transactionDate: string;
  transactionType: 'payment' | 'refund';
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  studentId?: string;
  studentName?: string;
  matched: boolean;
  matchedBy?: string;
  matchedAt?: string;
  notes?: string;
  rawCallbackData?: any;
  createdAt: string;
}

// ============================================
// BANK RECONCILIATION TYPES
// ============================================
export interface BankAccount {
  id: string;
  name: string;
  accountName?: string;
  bankName: string;
  accountNumber: string;
  branchCode?: string;
  currency: string;
  currentBalance: number;
  openingBalance?: number;
  lastReconciledDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountForm {
  accountName: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  openingBalance: number;
  isActive: boolean;
}

export interface BankReconciliation {
  statementBalance: number;
  schoolBalance: number;
  difference: number;
  unmatchedTransactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    reference?: string;
    type?: 'credit' | 'debit';
  }>;
  lastReconciledAt?: string;
}

export interface BankStatement {
  id: string;
  accountId: string;
  accountName: string;
  statementDate: string;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  importedBy: string;
  importedAt: string;
}

export interface BankTransaction {
  id: string;
  statementId: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  matched: boolean;
  matchedPaymentId?: string;
  matchedExpenseId?: string;
  notes?: string;
}

// ============================================
// FINANCIAL REPORT TYPES
// ============================================
export interface FinancialReport {
  id: string;
  name: string;
  type: 'income_statement' | 'balance_sheet' | 'cash_flow' | 'fee_collection' | 'expenses' | 'arrears' | 'budget';
  period: {
    startDate: string;
    endDate: string;
  };
  filters: ReportFilters;
  data: any;
  summary: ReportSummary;
  generatedBy: string;
  generatedAt: string;
}

export interface ReportFilters {
  classIds?: string[];
  paymentMethods?: string[];
  expenseCategories?: string[];
  status?: string[];
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netPosition: number;
  // Additional summary fields based on report type
}

// ============================================
// PETTY CASH TYPES
// ============================================
export interface PettyCash {
  id: string;
  custodian: string;
  custodianName: string;
  floatAmount: number;
  currentBalance: number;
  transactions: PettyCashTransaction[];
  lastReconciledDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashTransaction {
  id: string;
  pettyCashId: string;
  type: 'disbursement' | 'replenishment' | 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  receiptNumber?: string;
  reference?: string;
  date?: string;
  attachment?: string;
  processedBy: string;
  processedByName: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// FIXED ASSET TYPES
// ============================================
export interface FixedAsset {
  id: string;
  name: string;
  description?: string;
  category: string;
  assetType?: string;
  department?: string;
  purchaseDate: string;
  purchaseCost: number;
  supplier?: string;
  location?: string;
  serialNumber?: string;
  usefulLife: number;
  depreciationMethod: 'straight_line' | 'reducing_balance';
  salvageValue: number;
  accumulatedDepreciation: number;
  currentBookValue: number;
  status: 'active' | 'disposed' | 'lost' | 'maintenance';
  disposedDate?: string;
  disposedAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FixedAssetForm {
  name: string;
  description?: string;
  assetType: string;
  purchaseDate: string;
  purchaseCost: number;
  salvageValue: number;
  usefulLife: number;
  department?: string;
  location?: string;
  status: 'active' | 'disposed' | 'lost' | 'maintenance';
}

export interface DepreciationRecord {
  id: string;
  assetId?: string;
  year: number;
  method: string;
  beginningValue: number;
  depreciationExpense: number;
  endingValue: number;
}

export interface AssetMaintenanceRecord {
  id: string;
  assetId?: string;
  type: 'preventive' | 'repair' | 'upgrade' | 'inspection' | 'replacement';
  description?: string;
  date: string;
  cost?: number;
  performedBy?: string;
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

/** @deprecated Use AssetMaintenanceRecord — kept for bursar fixed-assets page imports */
export type MaintenanceRecord = AssetMaintenanceRecord;

// ============================================
// DASHBOARD TYPES
// ============================================
export interface BursarDashboard {
  quickStats: BursarQuickStats;
  recentPayments: FeePayment[];
  pendingArrears: StudentFeeState[];
  upcomingExpenses: Expense[];
  pendingSalaryAdvances: SalaryAdvance[];
  budgetAlerts: BudgetAlert[];
  mpesaReconciliation: MPesaReconciliationStats;
}

export interface BursarQuickStats {
  totalCollectedToday: number;
  totalCollectedThisMonth: number;
  totalArrears: number;
  totalExpensesThisMonth: number;
  cashBalance: number;
  pendingPayments: number;
  salaryDueDate?: string;
  budgetUtilization: number;
}

export interface BudgetAlert {
  department: string;
  allocation: number;
  spent: number;
  percentage: number;
  severity: 'warning' | 'critical';
}

export interface MPesaReconciliationStats {
  totalUnmatched: number;
  totalMatched: number;
  totalAmount: number;
  lastReconciledAt?: string;
}

// ============================================
// PROJECT TYPES
// ============================================
export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  actualSpend?: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectForm {
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  department?: string;
}

export interface ProjectFinance {
  projectId: string;
  projectName: string;
  budget: number;
  totalIncome: number;
  totalExpenses: number;
  netPosition: number;
  transactions: ProjectTransaction[];
}

export interface ProjectTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  reference?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export interface TransactionForm {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  reference?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface BursarNotification {
  id: string;
  type: 'payment' | 'arrears' | 'expense' | 'salary' | 'budget' | 'reconciliation';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  createdAt: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface BursarApiResponse<T> {
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

// Export ScholarshipApplication and Sponsor types for admin components
export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  academicYear: string;
  term: 'term1' | 'term2' | 'term3';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  // Additional UI properties
  admissionNumber?: string;
  amount?: number;
  class?: string;
  appliedDate?: string;
  academicPerformance?: string;
  financialStatus?: string;
  supportingDocs?: string[];
  sponsorId?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  totalCommitted: number;
  totalDisbursed: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  organization?: string;
  totalDonation?: number;
  activeScholarships?: number;
}

// ============================================
// BURSAR SETTINGS & ANALYTICS TYPES
// ============================================
export interface Settings {
  officeName?: string;
  fiscalYearStart?: string;
  defaultCurrency?: string;
  bankChargesAccount?: string;
  enableMultiUserApproval?: boolean;
  approvalThreshold?: number;
  [key: string]: unknown;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface NotificationPreferences {
  feeReminders?: boolean;
  paymentAlerts?: boolean;
  budgetAlerts?: boolean;
  expenseAlerts?: boolean;
  salaryAlerts?: boolean;
  reconciliationAlerts?: boolean;
  [key: string]: boolean | undefined;
}

export interface FinancialOverview {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueGrowth: number;
  expenseGrowth: number;
  netIncomeMargin: number;
}

export interface RevenueTrend {
  period: string;
  amount: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface CashFlowStatement {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  status: 'success' | 'failed' | 'pending';
  performedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  changes?: Record<string, unknown>;
}

export interface AuditFilter {
  startDate: string;
  endDate: string;
  userId: string;
  action: string;
  entityType: string;
}

export interface AuditSummary {
  totalActions: number;
  uniqueUsers: number;
  failedActions: number;
  todayActions: number;
}

export interface BulkOperation {
  id: string;
  operationType: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'deleted';
  startedAt?: string;
  completedAt?: string;
  recordsProcessed?: number;
  parameters?: Record<string, unknown>;
}

export interface BulkOperationForm {
  operationType: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface BulkOperationLog {
  id: string;
  operationId?: string;
  timestamp: string;
  level: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: unknown;
}

export interface StudentFee {
  id: string;
  studentId: string;
  feeComponentId?: string;
  description: string;
  amount: number;
  paidAmount?: number;
  balance?: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending' | 'waived';
  term?: string;
  academicYear?: string;
}

export interface StudentFeeSummary {
  studentId: string;
  studentName?: string;
  firstName?: string;
  lastName?: string;
  admissionNumber?: string;
  className?: string;
  stream?: string;
  totalBilled?: number;
  totalPaid?: number;
  totalOutstanding: number;
  balance?: number;
  status?: 'paid' | 'partial' | 'arrears' | 'overpaid';
}

export interface FeeBreakdown {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending' | 'waived';
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  date: string;
}

export interface InvoiceForm {
  studentId?: string;
  amount: number;
  description: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface InvoiceFilter {
  status: string;
  startDate: string;
  endDate: string;
  search: string;
}

export interface PettyCashTransactionForm {
  amount: number;
  description: string;
  type: 'expense' | 'income' | 'disbursement' | 'replenishment';
  date: string;
  reference?: string;
  category?: string;
}
