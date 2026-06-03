import api from './api';
import type {
  FeeStructure,
  FeePayment,
  StudentFeeState,
  PaymentPlan,
  Expense,
  ExpenseCategory,
  SalaryStructure,
  PayrollRun,
  SalaryPayment,
  SalaryAdvance,
  Budget,
  Scholarship,
  Bursary,
  Invoice,
  MPesaTransaction,
  BankAccount,
  BankStatement,
  FinancialReport,
  PettyCash,
  FixedAsset,
  BursarDashboard,
  BursarNotification,
  BursarApiResponse,
  Project,
  ProjectTransaction,
} from '../types/bursar';

// ============================================
// DASHBOARD API
// ============================================
export const bursarDashboardAPI = {
  getDashboard: async (): Promise<BursarApiResponse<BursarDashboard>> => {
    const response = await api.get('/bursar/dashboard');
    return response.data;
  },

  getQuickStats: async () => {
    const response = await api.get('/bursar/dashboard/stats');
    return response.data;
  },
};

// ============================================
// FEE STRUCTURE API
// ============================================
export const feeStructureAPI = {
  getFeeStructures: async (params?: {
    academicYear?: string;
    term?: string;
    classId?: string;
    boardingType?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/bursar/fee-structures', { params });
    return response.data;
  },

  getFeeStructure: async (structureId: string) => {
    const response = await api.get(`/bursar/fee-structures/${structureId}`);
    return response.data;
  },

  createFeeStructure: async (structureData: Partial<FeeStructure>) => {
    const response = await api.post('/bursar/fee-structures', structureData);
    return response.data;
  },

  updateFeeStructure: async (structureId: string, structureData: Partial<FeeStructure>) => {
    const response = await api.put(`/bursar/fee-structures/${structureId}`, structureData);
    return response.data;
  },

  deleteFeeStructure: async (structureId: string) => {
    const response = await api.delete(`/bursar/fee-structures/${structureId}`);
    return response.data;
  },

  bulkUpdateFees: async (updates: { structureId: string; amount: number }[]) => {
    const response = await api.post('/bursar/fee-structures/bulk-update', { updates });
    return response.data;
  },

  duplicateFeeStructure: async (structureId: string, academicYear: string, term: string) => {
    const response = await api.post(`/bursar/fee-structures/${structureId}/duplicate`, { academicYear, term });
    return response.data;
  },
};

// ============================================
// FEE PAYMENT API
// ============================================
export const feePaymentAPI = {
  getPayments: async (params?: {
    studentId?: string;
    admissionNumber?: string;
    classId?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/bursar/payments', { params });
    return response.data;
  },

  getPayment: async (paymentId: string) => {
    const response = await api.get(`/bursar/payments/${paymentId}`);
    return response.data;
  },

  recordPayment: async (paymentData: Partial<FeePayment>) => {
    const response = await api.post('/bursar/payments', paymentData);
    return response.data;
  },

  updatePayment: async (paymentId: string, paymentData: Partial<FeePayment>) => {
    const response = await api.put(`/bursar/payments/${paymentId}`, paymentData);
    return response.data;
  },

  deletePayment: async (paymentId: string, reason: string) => {
    const response = await api.delete(`/bursar/payments/${paymentId}`, { data: { reason } });
    return response.data;
  },

  bulkRecordPayments: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/bursar/payments/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  generateReceipt: async (paymentId: string) => {
    const response = await api.get(`/bursar/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  emailReceipt: async (paymentId: string, email: string) => {
    const response = await api.post(`/bursar/payments/${paymentId}/email-receipt`, { email });
    return response.data;
  },

  reprintReceipt: async (paymentId: string) => {
    const response = await api.post(`/bursar/payments/${paymentId}/reprint-receipt`);
    return response.data;
  },
};

// ============================================
// STUDENT FEE STATE API
// ============================================
export const studentFeeStateAPI = {
  getStudentFeeState: async (studentId: string) => {
    const response = await api.get(`/bursar/students/${studentId}/fees`);
    return response.data;
  },

  getStudentsInArrears: async (params?: {
    classId?: string;
    minArrears?: number;
    maxArrears?: number;
    agingDays?: number;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/bursar/students/arrears', { params });
    return response.data;
  },

  getArrearsSummary: async () => {
    const response = await api.get('/bursar/students/arrears/summary');
    return response.data;
  },

  getArrearsAging: async () => {
    const response = await api.get('/bursar/students/arrears/aging');
    return response.data;
  },

  applyLateFee: async (studentId: string, amount: number, reason: string) => {
    const response = await api.post(`/bursar/students/${studentId}/late-fee`, { amount, reason });
    return response.data;
  },

  waiveFee: async (studentId: string, feeIdOrAmount: string | number, reason?: string) => {
    if (typeof feeIdOrAmount === 'string' && reason === undefined) {
      const response = await api.post(`/bursar/students/${studentId}/waive-fee`, { feeId: feeIdOrAmount, reason: `Waive fee ${feeIdOrAmount}` });
      return response.data;
    }
    const response = await api.post(`/bursar/students/${studentId}/waive-fee`, { amount: feeIdOrAmount, reason: reason || '' });
    return response.data;
  },

  adjustBalance: async (studentId: string, amount: number, reason: string) => {
    const response = await api.post(`/bursar/students/${studentId}/adjust-balance`, { amount, reason });
    return response.data;
  },

  bulkSendArrearsReminders: async (studentIds: string[], message?: string) => {
    const response = await api.post('/bursar/students/arrears/send-reminders', { studentIds, message });
    return response.data;
  },

  searchStudents: async (term: string) => {
    const response = await api.get('/bursar/students/search', { params: { q: term } });
    return response.data;
  },

  getFeeBreakdown: async (studentId: string) => {
    const response = await api.get(`/bursar/students/${studentId}/fee-breakdown`);
    return response.data;
  },

  getPaymentHistory: async (studentId: string) => {
    const response = await api.get(`/bursar/students/${studentId}/payments`);
    return response.data;
  },

  recordPayment: async (studentId: string, data: Record<string, unknown>) => {
    const response = await api.post(`/bursar/students/${studentId}/payments`, data);
    return response.data;
  },
};

// ============================================
// PAYMENT PLAN API
// ============================================
export const paymentPlanAPI = {
  getPaymentPlans: async (params?: { status?: string; studentId?: string }) => {
    const response = await api.get('/bursar/payment-plans', { params });
    return response.data;
  },

  getPaymentPlan: async (planId: string) => {
    const response = await api.get(`/bursar/payment-plans/${planId}`);
    return response.data;
  },

  createPaymentPlan: async (planData: Partial<PaymentPlan>) => {
    const response = await api.post('/bursar/payment-plans', planData);
    return response.data;
  },

  updatePaymentPlan: async (planId: string, planData: Partial<PaymentPlan>) => {
    const response = await api.put(`/bursar/payment-plans/${planId}`, planData);
    return response.data;
  },

  cancelPaymentPlan: async (planId: string, reason: string) => {
    const response = await api.post(`/bursar/payment-plans/${planId}/cancel`, { reason });
    return response.data;
  },

  markInstallmentPaid: async (planId: string, installmentId: string, paymentId: string) => {
    const response = await api.post(`/bursar/payment-plans/${planId}/installments/${installmentId}/pay`, { paymentId });
    return response.data;
  },
};

// ============================================
// EXPENSE API
// ============================================
export const expenseAPI = {
  getExpenses: async (params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/bursar/expenses', { params });
    return response.data;
  },

  getExpense: async (expenseId: string) => {
    const response = await api.get(`/bursar/expenses/${expenseId}`);
    return response.data;
  },

  recordExpense: async (expenseData: Partial<Expense> | FormData) => {
    const isFormData = expenseData instanceof FormData;
    const response = await api.post('/bursar/expenses', expenseData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  updateExpense: async (expenseId: string, expenseData: Partial<Expense>) => {
    const response = await api.put(`/bursar/expenses/${expenseId}`, expenseData);
    return response.data;
  },

  approveExpense: async (expenseId: string) => {
    const response = await api.post(`/bursar/expenses/${expenseId}/approve`);
    return response.data;
  },

  rejectExpense: async (expenseId: string, reason: string) => {
    const response = await api.post(`/bursar/expenses/${expenseId}/reject`, { reason });
    return response.data;
  },

  getExpenseCategories: async () => {
    const response = await api.get('/bursar/expenses/categories');
    return response.data;
  },

  addExpenseCategory: async (categoryData: Partial<ExpenseCategory>) => {
    const response = await api.post('/bursar/expenses/categories', categoryData);
    return response.data;
  },

  updateExpenseCategory: async (categoryId: string, categoryData: Partial<ExpenseCategory>) => {
    const response = await api.put(`/bursar/expenses/categories/${categoryId}`, categoryData);
    return response.data;
  },

  getExpenseSummary: async (params?: { startDate?: string; endDate?: string; groupBy?: 'category' | 'month' | 'department' }) => {
    const response = await api.get('/bursar/expenses/summary', { params });
    return response.data;
  },

  deleteExpense: async (expenseId: string) => {
    const response = await api.delete(`/bursar/expenses/${expenseId}`);
    return response.data;
  },

  exportExpenses: async (params?: { startDate?: string; endDate?: string; category?: string }) => {
    const response = await api.get('/bursar/expenses/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// PAYROLL API
// ============================================
export const payrollAPI = {
  getSalaryStructures: async () => {
    const response = await api.get('/bursar/payroll/salary-structures');
    return response.data;
  },

  createSalaryStructure: async (structureData: Partial<SalaryStructure>) => {
    const response = await api.post('/bursar/payroll/salary-structures', structureData);
    return response.data;
  },

  updateSalaryStructure: async (structureId: string, structureData: Partial<SalaryStructure>) => {
    const response = await api.put(`/bursar/payroll/salary-structures/${structureId}`, structureData);
    return response.data;
  },

  getPayrollRuns: async (params?: { year?: number; month?: number; status?: string }) => {
    const response = await api.get('/bursar/payroll/runs', { params });
    return response.data;
  },

  createPayrollRun: async (runData: { month: number; year: number; name: string }) => {
    const response = await api.post('/bursar/payroll/runs', runData);
    return response.data;
  },

  processPayroll: async (runId: string) => {
    const response = await api.post(`/bursar/payroll/runs/${runId}/process`);
    return response.data;
  },

  approvePayroll: async (runId: string) => {
    const response = await api.post(`/bursar/payroll/runs/${runId}/approve`);
    return response.data;
  },

  disbursePayroll: async (runId: string) => {
    const response = await api.post(`/bursar/payroll/runs/${runId}/disburse`);
    return response.data;
  },

  getSalaryPayments: async (runId: string) => {
    const response = await api.get(`/bursar/payroll/runs/${runId}/payments`);
    return response.data;
  },

  generatePayslip: async (paymentId: string) => {
    const response = await api.get(`/bursar/payroll/payments/${paymentId}/payslip`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Salary Advances
  getSalaryAdvances: async (params?: { status?: string; employeeId?: string }) => {
    const response = await api.get('/bursar/payroll/advances', { params });
    return response.data;
  },

  requestSalaryAdvance: async (advanceData: Partial<SalaryAdvance>) => {
    const response = await api.post('/bursar/payroll/advances', advanceData);
    return response.data;
  },

  approveSalaryAdvance: async (advanceId: string, amount: number) => {
    const response = await api.post(`/bursar/payroll/advances/${advanceId}/approve`, { amount });
    return response.data;
  },

  rejectSalaryAdvance: async (advanceId: string, reason: string) => {
    const response = await api.post(`/bursar/payroll/advances/${advanceId}/reject`, { reason });
    return response.data;
  },
};

// ============================================
// BUDGET API
// ============================================
export const budgetAPI = {
  getBudgets: async (params?: { fiscalYear?: string; status?: string }) => {
    const response = await api.get('/bursar/budgets', { params });
    return response.data;
  },

  getBudget: async (budgetId: string) => {
    const response = await api.get(`/bursar/budgets/${budgetId}`);
    return response.data;
  },

  createBudget: async (budgetData: Partial<Budget>) => {
    const response = await api.post('/bursar/budgets', budgetData);
    return response.data;
  },

  updateBudget: async (budgetId: string, budgetData: Partial<Budget>) => {
    const response = await api.put(`/bursar/budgets/${budgetId}`, budgetData);
    return response.data;
  },

  approveBudget: async (budgetId: string) => {
    const response = await api.post(`/bursar/budgets/${budgetId}/approve`);
    return response.data;
  },

  getBudgetUtilization: async (budgetId: string) => {
    const response = await api.get(`/bursar/budgets/${budgetId}/utilization`);
    return response.data;
  },

  getBudgetVariance: async (budgetId: string) => {
    const response = await api.get(`/bursar/budgets/${budgetId}/variance`);
    return response.data;
  },
};

// ============================================
// SCHOLARSHIP & BURSARY API
// ============================================
export const scholarshipAPI = {
  getScholarships: async (params?: { type?: string; isActive?: boolean }) => {
    const response = await api.get('/bursar/scholarships', { params });
    return response.data;
  },

  createScholarship: async (scholarshipData: Partial<Scholarship>) => {
    const response = await api.post('/bursar/scholarships', scholarshipData);
    return response.data;
  },

  updateScholarship: async (scholarshipId: string, scholarshipData: Partial<Scholarship>) => {
    const response = await api.put(`/bursar/scholarships/${scholarshipId}`, scholarshipData);
    return response.data;
  },

  awardScholarship: async (scholarshipId: string, studentId: string, amount: number, academicYear: string, term: string) => {
    const response = await api.post(`/bursar/scholarships/${scholarshipId}/award`, { studentId, amount, academicYear, term });
    return response.data;
  },

  revokeScholarship: async (awardId: string, reason: string) => {
    const response = await api.post(`/bursar/scholarships/awards/${awardId}/revoke`, { reason });
    return response.data;
  },
};

export const bursaryAPI = {
  getBursaries: async (params?: { type?: string; isActive?: boolean }) => {
    const response = await api.get('/bursar/bursaries', { params });
    return response.data;
  },

  createBursary: async (bursaryData: Partial<Bursary>) => {
    const response = await api.post('/bursar/bursaries', bursaryData);
    return response.data;
  },

  updateBursary: async (bursaryId: string, bursaryData: Partial<Bursary>) => {
    const response = await api.put(`/bursar/bursaries/${bursaryId}`, bursaryData);
    return response.data;
  },

  applyForBursary: async (bursaryId: string, studentId: string, amount: number, reason: string) => {
    const response = await api.post(`/bursar/bursaries/${bursaryId}/apply`, { studentId, amount, reason });
    return response.data;
  },

  approveBursary: async (applicationId: string) => {
    const response = await api.post(`/bursar/bursaries/applications/${applicationId}/approve`);
    return response.data;
  },

  rejectBursary: async (applicationId: string, reason: string) => {
    const response = await api.post(`/bursar/bursaries/applications/${applicationId}/reject`, { reason });
    return response.data;
  },
};

// ============================================
// INVOICE API
// ============================================
export const invoiceAPI = {
  getInvoices: async (params?: { status?: string; studentId?: string; type?: string }) => {
    const response = await api.get('/bursar/invoices', { params });
    return response.data;
  },

  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/bursar/invoices/${invoiceId}`);
    return response.data;
  },

  createInvoice: async (invoiceData: Partial<Invoice> | Record<string, unknown>) => {
    const response = await api.post('/bursar/invoices', invoiceData);
    return response.data;
  },

  updateInvoice: async (invoiceId: string, invoiceData: Partial<Invoice> | Record<string, unknown>) => {
    const response = await api.put(`/bursar/invoices/${invoiceId}`, invoiceData);
    return response.data;
  },

  sendInvoice: async (invoiceId: string, emailOrChannel?: string) => {
    const payload = emailOrChannel?.includes('@')
      ? { email: emailOrChannel }
      : { channel: emailOrChannel || 'email' };
    const response = await api.post(`/bursar/invoices/${invoiceId}/send`, payload);
    return response.data;
  },

  cancelInvoice: async (invoiceId: string, reason?: string) => {
    const response = await api.post(`/bursar/invoices/${invoiceId}/cancel`, { reason: reason || 'Cancelled' });
    return response.data;
  },

  generateBulkInvoices: async (classId: string, academicYear: string, term: string) => {
    const response = await api.post('/bursar/invoices/bulk-generate', { classId, academicYear, term });
    return response.data;
  },
};

// ============================================
// MPESA API
// ============================================
export const mpesaAPI = {
  getMPesaTransactions: async (params?: {
    status?: string;
    matched?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/bursar/mpesa/transactions', { params });
    return response.data;
  },

  matchMPesaTransaction: async (transactionId: string, paymentId: string) => {
    const response = await api.post(`/bursar/mpesa/transactions/${transactionId}/match`, { paymentId });
    return response.data;
  },

  bulkMatchMPesa: async (matches: { transactionId: string; paymentId: string }[]) => {
    const response = await api.post('/bursar/mpesa/transactions/bulk-match', { matches });
    return response.data;
  },

  getMPesaReconciliationStats: async () => {
    const response = await api.get('/bursar/mpesa/reconciliation/stats');
    return response.data;
  },

  processMPesaRefund: async (transactionId: string, reason: string) => {
    const response = await api.post(`/bursar/mpesa/transactions/${transactionId}/refund`, { reason });
    return response.data;
  },
};

// ============================================
// BANK RECONCILIATION API
// ============================================
export const bankAPI = {
  getBankAccounts: async () => {
    const response = await api.get('/bursar/bank-accounts');
    return response.data;
  },

  addBankAccount: async (accountData: Partial<BankAccount>) => {
    const response = await api.post('/bursar/bank-accounts', accountData);
    return response.data;
  },

  updateBankAccount: async (accountId: string, accountData: Partial<BankAccount>) => {
    const response = await api.put(`/bursar/bank-accounts/${accountId}`, accountData);
    return response.data;
  },

  importBankStatement: async (accountId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/bursar/bank-accounts/${accountId}/import-statement`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getBankStatements: async (accountId: string) => {
    const response = await api.get(`/bursar/bank-accounts/${accountId}/statements`);
    return response.data;
  },

  matchBankTransaction: async (transactionId: string, paymentId?: string, expenseId?: string) => {
    const response = await api.post(`/bursar/bank-transactions/${transactionId}/match`, { paymentId, expenseId });
    return response.data;
  },

  reconcileBank: async (accountId: string, statementId: string) => {
    const response = await api.post(`/bursar/bank-accounts/${accountId}/reconcile`, { statementId });
    return response.data;
  },

  generateReconciliationReport: async (accountId: string, statementId: string) => {
    const response = await api.get(`/bursar/bank-accounts/${accountId}/statements/${statementId}/reconciliation-report`);
    return response.data;
  },

  createBankAccount: async (accountData: Partial<BankAccount>) => {
    const response = await api.post('/bursar/bank-accounts', accountData);
    return response.data;
  },
  deleteBankAccount: async (accountId: string) => {
    const response = await api.delete(`/bursar/bank-accounts/${accountId}`);
    return response.data;
  },
  getBankReconciliation: async () => {
    const response = await api.get('/bursar/bank-accounts/reconciliation');
    return response.data;
  },
};

// ============================================
// FINANCIAL REPORTS API
// ============================================
export const reportsAPI = {
  generateReport: async (reportType: string, filters: any): Promise<BursarApiResponse<FinancialReport>> => {
    const response = await api.post('/bursar/reports/generate', { reportType, filters });
    return response.data;
  },

  getReportTemplates: async () => {
    const response = await api.get('/bursar/reports/templates');
    return response.data;
  },

  exportReport: async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const response = await api.get(`/bursar/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Pre-built reports
  getIncomeStatement: async (startDate: string, endDate: string) => {
    const response = await api.get('/bursar/reports/income-statement', { params: { startDate, endDate } });
    return response.data;
  },

  getBalanceSheet: async (asOfDate: string) => {
    const response = await api.get('/bursar/reports/balance-sheet', { params: { asOfDate } });
    return response.data;
  },

  getCashFlowStatement: async (startDate: string, endDate: string) => {
    const response = await api.get('/bursar/reports/cash-flow', { params: { startDate, endDate } });
    return response.data;
  },

  getFeeCollectionReport: async (academicYear: string, term: string) => {
    const response = await api.get('/bursar/reports/fee-collection', { params: { academicYear, term } });
    return response.data;
  },

  getArrearsReport: async (asOfDate: string) => {
    const response = await api.get('/bursar/reports/arrears', { params: { asOfDate } });
    return response.data;
  },

  getExpenseReport: async (startDate: string, endDate: string, groupBy?: string) => {
    const response = await api.get('/bursar/reports/expenses', { params: { startDate, endDate, groupBy } });
    return response.data;
  },
};

// ============================================
// PETTY CASH API
// ============================================
export const pettyCashAPI = {
  getPettyCash: async () => {
    const response = await api.get('/bursar/petty-cash');
    return response.data;
  },

  createPettyCash: async (pettyCashData: Partial<PettyCash>) => {
    const response = await api.post('/bursar/petty-cash', pettyCashData);
    return response.data;
  },

  disbursePettyCash: async (data: { amount: number; description: string; category: string; receiptNumber?: string }) => {
    const response = await api.post('/bursar/petty-cash/disburse', data);
    return response.data;
  },

  replenishPettyCash: async (data: { amount: number; description: string }) => {
    const response = await api.post('/bursar/petty-cash/replenish', data);
    return response.data;
  },

  reconcilePettyCash: async () => {
    const response = await api.post('/bursar/petty-cash/reconcile');
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/bursar/petty-cash/transactions');
    return response.data;
  },

  createTransaction: async (data: { amount: number; description: string; type: string; date?: string; reference?: string; category?: string } | object) => {
    if (data.type === 'income' || data.type === 'replenishment') {
      const response = await api.post('/bursar/petty-cash/replenish', { amount: data.amount, description: data.description });
      return response.data;
    }
    const response = await api.post('/bursar/petty-cash/disburse', {
      amount: data.amount,
      description: data.description,
      category: data.category || 'general',
      receiptNumber: data.reference,
    });
    return response.data;
  },

  updateTransaction: async (transactionId: string, data: Record<string, unknown>) => {
    const response = await api.put(`/bursar/petty-cash/transactions/${transactionId}`, data);
    return response.data;
  },

  deleteTransaction: async (transactionId: string) => {
    const response = await api.delete(`/bursar/petty-cash/transactions/${transactionId}`);
    return response.data;
  },
};

// ============================================
// PROJECT API
// ============================================
export const projectsAPI = {
  getProjects: async () => {
    const response = await api.get('/bursar/projects');
    return response.data;
  },

  getProject: async (projectId: string) => {
    const response = await api.get(`/bursar/projects/${projectId}`);
    return response.data;
  },

  createProject: async (projectData: Partial<Project>) => {
    const response = await api.post('/bursar/projects', projectData);
    return response.data;
  },

  updateProject: async (projectId: string, projectData: Partial<Project>) => {
    const response = await api.put(`/bursar/projects/${projectId}`, projectData);
    return response.data;
  },

  deleteProject: async (projectId: string) => {
    const response = await api.delete(`/bursar/projects/${projectId}`);
    return response.data;
  },

  getProjectFinances: async (projectId: string) => {
    const response = await api.get(`/bursar/projects/${projectId}/finances`);
    return response.data;
  },

  recordProjectTransaction: async (projectId: string, transactionData: Partial<ProjectTransaction>) => {
    const response = await api.post(`/bursar/projects/${projectId}/transactions`, transactionData);
    return response.data;
  },
};

// ============================================
// FIXED ASSETS API
// ============================================
export const fixedAssetsAPI = {
  getFixedAssets: async (params?: { status?: string; category?: string }) => {
    const response = await api.get('/bursar/fixed-assets', { params });
    return response.data;
  },

  addFixedAsset: async (assetData: Partial<FixedAsset>) => {
    const response = await api.post('/bursar/fixed-assets', assetData);
    return response.data;
  },

  updateFixedAsset: async (assetId: string, assetData: Partial<FixedAsset>) => {
    const response = await api.put(`/bursar/fixed-assets/${assetId}`, assetData);
    return response.data;
  },

  disposeFixedAsset: async (assetId: string, amount: number, reason: string) => {
    const response = await api.post(`/bursar/fixed-assets/${assetId}/dispose`, { amount, reason });
    return response.data;
  },

  calculateDepreciation: async (assetId: string) => {
    const response = await api.post(`/bursar/fixed-assets/${assetId}/calculate-depreciation`);
    return response.data;
  },

  getFixedAssetsRegister: async () => {
    const response = await api.get('/bursar/fixed-assets/register');
    return response.data;
  },

  getAssets: async (params?: { status?: string; category?: string }) => {
    const response = await api.get('/bursar/fixed-assets', { params });
    return response.data;
  },
  createAsset: async (assetData: Partial<FixedAsset>) => {
    const response = await api.post('/bursar/fixed-assets', assetData);
    return response.data;
  },
  updateAsset: async (assetId: string, assetData: Partial<FixedAsset>) => {
    const response = await api.put(`/bursar/fixed-assets/${assetId}`, assetData);
    return response.data;
  },
  deleteAsset: async (assetId: string) => {
    const response = await api.post(`/bursar/fixed-assets/${assetId}/dispose`, { amount: 0, reason: 'Removed' });
    return response.data;
  },
  getAssetDepreciation: async (assetId: string) => {
    const response = await api.get(`/bursar/fixed-assets/${assetId}/depreciation`);
    return response.data;
  },
  getAssetMaintenance: async (assetId: string) => {
    const response = await api.get(`/bursar/fixed-assets/${assetId}/maintenance`);
    return response.data;
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: async (unreadOnly?: boolean): Promise<BursarApiResponse<BursarNotification[]>> => {
    const response = await api.get('/bursar/notifications', { params: { unreadOnly } });
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.patch(`/bursar/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/bursar/notifications/read-all');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/bursar/notifications/unread-count');
    return response.data;
  },
};

// ============================================
// BURSAR WORKSPACE API
// ============================================
export const bursarWorkspaceAPI = {
  list: async (section?: string, item?: string) => {
    const response = await api.get('/bursar/workspaces', { params: { section, item } });
    return response.data;
  },

  create: async (data: {
    section: string;
    item: string;
    title: string;
    content?: string;
    amount?: number | string;
    payload?: Record<string, unknown>;
    status?: string;
  }) => {
    const response = await api.post('/bursar/workspaces/records', data);
    return response.data;
  },

  update: async (recordId: string, data: Record<string, unknown>) => {
    const response = await api.put(`/bursar/workspaces/records/${recordId}`, data);
    return response.data;
  },

  delete: async (recordId: string) => {
    const response = await api.delete(`/bursar/workspaces/records/${recordId}`);
    return response.data;
  },
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  getRevenueTrends: async (params?: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string } | string) => {
    const normalized = typeof params === 'string'
      ? { period: ({ month: 'monthly', quarter: 'monthly', year: 'yearly' } as const)[params] || 'monthly' }
      : params;
    const response = await api.get('/bursar/analytics/revenue-trends', { params: normalized });
    return response.data;
  },
  getExpenseTrends: async (params?: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) => {
    const response = await api.get('/bursar/analytics/expense-trends', { params });
    return response.data;
  },
  getProfitLossTrends: async (params?: { period?: 'termly' | 'yearly' }) => {
    const response = await api.get('/bursar/analytics/profit-loss', { params });
    return response.data;
  },
  getCollectionRate: async () => {
    const response = await api.get('/bursar/analytics/collection-rate');
    return response.data;
  },
  getArrearsReductionRate: async () => {
    const response = await api.get('/bursar/analytics/arrears-reduction');
    return response.data;
  },
  getTopRevenueSources: async () => {
    const response = await api.get('/bursar/analytics/top-revenue-sources');
    return response.data;
  },
  getExpenseDistribution: async () => {
    const response = await api.get('/bursar/analytics/expense-distribution');
    return response.data;
  },
  getCashFlowForecast: async (days?: number) => {
    const response = await api.get('/bursar/analytics/cash-flow-forecast', { params: { days } });
    return response.data;
  },
  getFeeCollectionForecast: async (period?: 'term' | 'year') => {
    const response = await api.get('/bursar/analytics/fee-forecast', { params: { period } });
    return response.data;
  },
  getExpenseForecast: async (period?: 'term' | 'year') => {
    const response = await api.get('/bursar/analytics/expense-forecast', { params: { period } });
    return response.data;
  },
  runWhatIfAnalysis: async (scenario: { feeIncreasePercent?: number; enrollmentChange?: number }) => {
    const response = await api.post('/bursar/analytics/what-if', scenario);
    return response.data;
  },
  getFinancialHealthScore: async () => {
    const response = await api.get('/bursar/analytics/health-score');
    return response.data;
  },
  getLiquidityRatio: async () => {
    const response = await api.get('/bursar/analytics/liquidity-ratio');
    return response.data;
  },
  getCollectionEfficiency: async () => {
    const response = await api.get('/bursar/analytics/collection-efficiency');
    return response.data;
  },
  getExpenseRatio: async () => {
    const response = await api.get('/bursar/analytics/expense-ratio');
    return response.data;
  },
  getKPIDs: async () => {
    const response = await api.get('/bursar/analytics/kpis');
    return response.data;
  },
  getFinancialOverview: async (_dateRange?: string) => {
    const response = await api.get('/bursar/analytics/kpis');
    return response.data;
  },
  getExpenseBreakdown: async (_dateRange?: string) => {
    const response = await api.get('/bursar/analytics/expense-distribution');
    return response.data;
  },
  getCashFlowStatement: async (_dateRange?: string) => {
    const response = await api.get('/bursar/analytics/cash-flow-forecast', { params: { days: 30 } });
    return response.data;
  },
};

// ============================================
// AUDIT API
// ============================================
export const auditAPI = {
  getAuditTrail: async (params?: { startDate?: string; endDate?: string; userId?: string; actionType?: string; module?: string; keyword?: string; page?: number; limit?: number }) => {
    const response = await api.get('/bursar/audit/trail', { params });
    return response.data;
  },
  getTransactionHistory: async (params?: { startDate?: string; endDate?: string; type?: string }) => {
    const response = await api.get('/bursar/audit/transactions', { params });
    return response.data;
  },
  getEditHistory: async (resourceType: string, resourceId: string) => {
    const response = await api.get(`/bursar/audit/edits/${resourceType}/${resourceId}`);
    return response.data;
  },
  getApprovalHistory: async (params?: { startDate?: string; endDate?: string; userId?: string }) => {
    const response = await api.get('/bursar/audit/approvals', { params });
    return response.data;
  },
  getDeletedTransactions: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/bursar/audit/deleted', { params });
    return response.data;
  },
  flagSuspiciousTransaction: async (transactionId: string, reason: string) => {
    const response = await api.post(`/bursar/audit/flag/${transactionId}`, { reason });
    return response.data;
  },
  getSuspiciousTransactions: async () => {
    const response = await api.get('/bursar/audit/suspicious');
    return response.data;
  },
  generateAuditReport: async (params?: { startDate?: string; endDate?: string; includeDeleted?: boolean }) => {
    const response = await api.get('/bursar/audit/report', { params, responseType: 'blob' });
    return response.data;
  },
  exportAuditLog: async (fileFormatOrFilter: 'excel' | 'pdf' | object, queryParam?: any) => {
    const fileFormat = typeof fileFormatOrFilter === 'string' ? fileFormatOrFilter : 'excel';
    const params = typeof fileFormatOrFilter === 'string' ? queryParam : fileFormatOrFilter;
    const auditResponse = await api.get('/bursar/audit/export', { params: { ...params, format: fileFormat }, responseType: 'blob' });
    return { success: true, data: auditResponse.data, message: 'Audit log exported successfully' };
  },
  getAuditLogs: async (filter?: { startDate?: string; endDate?: string; userId?: string; action?: string; entityType?: string }) => {
    const response = await api.get('/bursar/audit/trail', {
      params: {
        startDate: filter?.startDate,
        endDate: filter?.endDate,
        userId: filter?.userId,
        actionType: filter?.action,
        module: filter?.entityType,
      },
    });
    return response.data;
  },
  getAuditSummary: async (filter?: { startDate?: string; endDate?: string }) => {
    const response = await api.get('/bursar/audit/summary', { params: filter });
    return response.data;
  },
};

// ============================================
// TAX API
// ============================================
export const taxAPI = {
  calculatePAYE: async (employeeId: string, month: number, year: number) => {
    const response = await api.get(`/bursar/tax/paye/${employeeId}`, { params: { month, year } });
    return response.data;
  },
  calculateNHIF: async (employeeId: string, month: number, year: number) => {
    const response = await api.get(`/bursar/tax/nhif/${employeeId}`, { params: { month, year } });
    return response.data;
  },
  calculateNSSF: async (employeeId: string, month: number, year: number) => {
    const response = await api.get(`/bursar/tax/nssf/${employeeId}`, { params: { month, year } });
    return response.data;
  },
  calculateHousingLevy: async (employeeId: string, month: number, year: number) => {
    const response = await api.get(`/bursar/tax/housing-levy/${employeeId}`, { params: { month, year } });
    return response.data;
  },
  getTaxSummary: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/summary', { params: { month, year } });
    return response.data;
  },
  generatePAYEReport: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/reports/paye', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  generateNHIFReport: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/reports/nhif', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  generateNSSFReport: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/reports/nssf', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  prepareKRAReturn: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/returns/kra', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  prepareNHIFReturn: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/returns/nhif', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  prepareNSSFReturn: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/returns/nssf', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  exportTaxData: async (month: number, year: number) => {
    const response = await api.get('/bursar/tax/export', { params: { month, year }, responseType: 'blob' });
    return response.data;
  },
  trackTaxPayments: async () => {
    const response = await api.get('/bursar/tax/payments');
    return response.data;
  },
  getTaxDeadlines: async () => {
    const response = await api.get('/bursar/tax/deadlines');
    return response.data;
  },
  getTaxPenaltyAlerts: async () => {
    const response = await api.get('/bursar/tax/penalty-alerts');
    return response.data;
  },
};

// ============================================
// COMMUNICATION API (Bursar Specific)
// ============================================
export const bursarCommunicationAPI = {
  sendFeeReminder: async (studentId: string, channel: 'sms' | 'email' | 'whatsapp', message?: string) => {
    const response = await api.post('/bursar/communication/fee-reminder', { studentId, channel, message });
    return response.data;
  },
  sendReceipt: async (paymentId: string, channel: 'sms' | 'email' | 'whatsapp') => {
    const response = await api.post('/bursar/communication/send-receipt', { paymentId, channel });
    return response.data;
  },
  sendArrearsNotice: async (studentId: string, channel: 'sms' | 'email' | 'whatsapp', message?: string) => {
    const response = await api.post('/bursar/communication/arrears-notice', { studentId, channel, message });
    return response.data;
  },
  sendPaymentConfirmation: async (paymentId: string, channel: 'sms' | 'email' | 'whatsapp') => {
    const response = await api.post('/bursar/communication/payment-confirmation', { paymentId, channel });
    return response.data;
  },
  sendInvoice: async (invoiceId: string, channel: 'sms' | 'email' | 'whatsapp') => {
    const response = await api.post('/bursar/communication/send-invoice', { invoiceId, channel });
    return response.data;
  },
  sendFeeStructureUpdate: async (classId?: string) => {
    const response = await api.post('/bursar/communication/fee-structure-update', { classId });
    return response.data;
  },
  sendPaymentPlanConfirmation: async (planId: string) => {
    const response = await api.post('/bursar/communication/payment-plan-confirmation', { planId });
    return response.data;
  },
  sendBulkMessage: async (recipientType: 'all' | 'arrears' | 'paid', channel: 'sms' | 'email' | 'whatsapp', message: string) => {
    const response = await api.post('/bursar/communication/bulk-message', { recipientType, channel, message });
    return response.data;
  },
  scheduleReminder: async (studentIds: string[], channel: 'sms' | 'email' | 'whatsapp', message: string, schedule: { frequency: 'daily' | 'weekly' | 'monthly'; startDate: string; endDate?: string }) => {
    const response = await api.post('/bursar/communication/schedule-reminder', { studentIds, channel, message, schedule });
    return response.data;
  },
  emailReportToPrincipal: async (reportType: string, schedule?: 'daily' | 'weekly' | 'monthly') => {
    const response = await api.post('/bursar/communication/email-report', { reportType, schedule });
    return response.data;
  },
  requestPrincipalApproval: async (requestType: string, data: any) => {
    const response = await api.post('/bursar/communication/request-approval', { requestType, data });
    return response.data;
  },
  escalateToPrincipal: async (type: string, data: any) => {
    const response = await api.post('/bursar/communication/escalate', { type, data });
    return response.data;
  },
  notifyStoreKeeper: async (message: string, data?: any) => {
    const response = await api.post('/bursar/communication/notify-storekeeper', { message, data });
    return response.data;
  },
  notifyTeacher: async (teacherId: string, message: string, type: 'salary' | 'general') => {
    const response = await api.post('/bursar/communication/notify-teacher', { teacherId, message, type });
    return response.data;
  },
  getQueryHistory: async (studentId?: string) => {
    const response = await api.get('/bursar/communication/queries', { params: { studentId } });
    return response.data;
  },
  respondToQuery: async (queryId: string, replyText: string) => {
    const queryResponse = await api.post(`/bursar/communication/queries/${queryId}/respond`, { response: replyText });
    return queryResponse.data;
  },
};

// ============================================
// SETTINGS API
// ============================================
export const bursarSettingsAPI = {
  getSettings: async () => {
    const response = await api.get('/bursar/settings');
    return response.data;
  },
  updateSettings: async (settings: any) => {
    const response = await api.put('/bursar/settings', settings);
    return response.data;
  },
  setLateFeePercentage: async (percentage: number) => {
    const response = await api.patch('/bursar/settings/late-fee-percentage', { percentage });
    return response.data;
  },
  setLateFeeFixedAmount: async (amount: number) => {
    const response = await api.patch('/bursar/settings/late-fee-amount', { amount });
    return response.data;
  },
  setArrearsThreshold: async (days: number) => {
    const response = await api.patch('/bursar/settings/arrears-threshold', { days });
    return response.data;
  },
  setPaymentTerms: async (days: number) => {
    const response = await api.patch('/bursar/settings/payment-terms', { days });
    return response.data;
  },
  setCurrency: async (symbol: string, code: string) => {
    const response = await api.patch('/bursar/settings/currency', { symbol, code });
    return response.data;
  },
  setFinancialYearStart: async (date: string) => {
    const response = await api.patch('/bursar/settings/financial-year-start', { date });
    return response.data;
  },
  setTermDates: async (terms: any[]) => {
    const response = await api.patch('/bursar/settings/term-dates', { terms });
    return response.data;
  },
  configurePaymentMethods: async (methods: { cash?: boolean; mpesa?: boolean; bank?: boolean; card?: boolean }) => {
    const response = await api.patch('/bursar/settings/payment-methods', { methods });
    return response.data;
  },
  setMPESAAutoMatchRules: async (rules: { referenceFormat: string; autoMatch: boolean }) => {
    const response = await api.patch('/bursar/settings/mpesa-auto-match', { rules });
    return response.data;
  },
  manageFeeCategories: async (action: 'add' | 'edit' | 'delete', data: any) => {
    const response = await api.post('/bursar/settings/fee-categories', { action, data });
    return response.data;
  },
  manageExpenseCategories: async (action: 'add' | 'edit' | 'delete', data: any) => {
    const response = await api.post('/bursar/settings/expense-categories', { action, data });
    return response.data;
  },
  setBudgetAlertThreshold: async (percentage: number) => {
    const response = await api.patch('/bursar/settings/budget-alert-threshold', { percentage });
    return response.data;
  },
  setLowBalanceAlert: async (amount: number) => {
    const response = await api.patch('/bursar/settings/low-balance-alert', { amount });
    return response.data;
  },
  configureTaxRates: async (rates: { paye?: any; nhif?: any; nssf?: any }) => {
    const response = await api.patch('/bursar/settings/tax-rates', { rates });
    return response.data;
  },
  setSalaryProcessingDay: async (day: number) => {
    const response = await api.patch('/bursar/settings/salary-day', { day });
    return response.data;
  },
  toggleAutoLateFees: async (enabled: boolean) => {
    const response = await api.patch('/bursar/settings/auto-late-fees', { enabled });
    return response.data;
  },
  toggleAutoReceiptEmails: async (enabled: boolean) => {
    const response = await api.patch('/bursar/settings/auto-receipt-emails', { enabled });
    return response.data;
  },
  toggleAutoArrearsReminders: async (enabled: boolean) => {
    const response = await api.patch('/bursar/settings/auto-arrears-reminders', { enabled });
    return response.data;
  },
  configureReceiptFormat: async (format: { prefix?: string; suffix?: string; footer?: string }) => {
    const response = await api.patch('/bursar/settings/receipt-format', { format });
    return response.data;
  },
  configureInvoiceFormat: async (format: { prefix?: string; suffix?: string }) => {
    const response = await api.patch('/bursar/settings/invoice-format', { format });
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/bursar/settings/payment-methods');
    return response.data;
  },

  getNotificationPreferences: async () => {
    const response = await api.get('/bursar/settings/notification-preferences');
    return response.data;
  },

  updatePaymentMethods: async (methods: unknown) => {
    const response = await api.put('/bursar/settings/payment-methods', methods);
    return response.data;
  },

  updateNotificationPreferences: async (preferences: unknown) => {
    const response = await api.put('/bursar/settings/notification-preferences', preferences);
    return response.data;
  },
};

// Export all APIs as a single object
export const bursarService = {
  dashboard: bursarDashboardAPI,
  feeStructures: feeStructureAPI,
  payments: feePaymentAPI,
  studentFees: studentFeeStateAPI,
  paymentPlans: paymentPlanAPI,
  expenses: expenseAPI,
  payroll: payrollAPI,
  budgets: budgetAPI,
  scholarships: scholarshipAPI,
  bursaries: bursaryAPI,
  invoices: invoiceAPI,
  // Alias for backwards compatibility (components use 'invoice' singular)
  invoice: invoiceAPI,
  mpesa: mpesaAPI,
  banks: bankAPI,
  // Alias for backwards compatibility (components use 'bank' singular)
  bank: bankAPI,
  reports: reportsAPI,
  pettyCash: pettyCashAPI,
  fixedAssets: fixedAssetsAPI,
  notifications: notificationsAPI,
  workspace: bursarWorkspaceAPI,
  projects: projectsAPI,
  // New modules
  analytics: analyticsAPI,
  audit: auditAPI,
  tax: taxAPI,
  communication: bursarCommunicationAPI,
  settings: bursarSettingsAPI,
  // Bulk operations
  bulk: {
    importStudents: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/bursar/bulk/import-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    importPayments: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/bursar/bulk/import-payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    exportStudents: async () => {
      const response = await api.get('/bursar/bulk/export-students', { responseType: 'blob' });
      return response.data;
    },
    exportPayments: async () => {
      const response = await api.get('/bursar/bulk/export-payments', { responseType: 'blob' });
      return response.data;
    },
    processPayments: async (studentIds: string[], amount: number) => {
      const response = await api.post('/bursar/bulk/process-payments', { studentIds, amount });
      return response.data;
    },
    applyFeeIncrease: async (percentage: number, classId?: string) => {
      const response = await api.post('/bursar/bulk/apply-fee-increase', { percentage, classId });
      return response.data;
    },
    applyLateFees: async (studentIds?: string[]) => {
      const response = await api.post('/bursar/bulk/apply-late-fees', { studentIds });
      return response.data;
    },
    applyDiscount: async (discount: { type: 'percentage' | 'fixed'; value: number; classId?: string }) => {
      const response = await api.post('/bursar/bulk/apply-discount', discount);
      return response.data;
    },
    sendReminders: async (recipientType: 'all' | 'arrears', channel: 'sms' | 'email' | 'whatsapp', message: string) => {
      const response = await api.post('/bursar/bulk/send-reminders', { recipientType, channel, message });
      return response.data;
    },
    generateInvoices: async (classId?: string) => {
      const response = await api.post('/bursar/bulk/generate-invoices', { classId });
      return response.data;
    },
    emailInvoices: async (invoiceIds: string[]) => {
      const response = await api.post('/bursar/bulk/email-invoices', { invoiceIds });
      return response.data;
    },
    generateReceipts: async (startDate: string, endDate: string) => {
      const response = await api.post('/bursar/bulk/generate-receipts', { startDate, endDate });
      return response.data;
    },
    emailReceipts: async (paymentIds: string[]) => {
      const response = await api.post('/bursar/bulk/email-receipts', { paymentIds });
      return response.data;
    },
    markPayments: async (payments: { studentId: string; amount: number; method: string; reference?: string }[]) => {
      const response = await api.post('/bursar/bulk/mark-payments', { payments });
      return response.data;
    },
    adjustBalances: async (adjustments: { studentId: string; amount: number; reason: string }[]) => {
      const response = await api.post('/bursar/bulk/adjust-balances', { adjustments });
      return response.data;
    },
    archiveOldRecords: async (beforeDate: string) => {
      const response = await api.post('/bursar/bulk/archive', { beforeDate });
      return response.data;
    },
    getBulkOperations: async () => {
      const response = await api.get('/bursar/bulk/operations');
      return response.data;
    },
    getBulkOperationLogs: async (operationId: string) => {
      const response = await api.get(`/bursar/bulk/operations/${operationId}/logs`);
      return response.data;
    },
    createBulkOperation: async (data: Record<string, unknown> | object) => {
      const response = await api.post('/bursar/bulk/operations', data);
      return response.data;
    },
    executeBulkOperation: async (operationId: string) => {
      const response = await api.post(`/bursar/bulk/operations/${operationId}/execute`);
      return response.data;
    },
    deleteBulkOperation: async (operationId: string) => {
      const response = await api.delete(`/bursar/bulk/operations/${operationId}`);
      return response.data;
    },
  },
};

export default bursarService;
