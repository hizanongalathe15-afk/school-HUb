import { Router } from 'express';
import { bursarController, bursarOnlyMiddleware } from '../controllers/bursarController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// All bursar routes require authentication and BURSAR role
router.use(auth);
router.use(bursarOnlyMiddleware);

// Dashboard
router.get('/dashboard', bursarController.getDashboard);
router.get('/dashboard/stats', bursarController.getDashboard);

// Persisted bursar workspaces for complete finance workflows without mock data
router.get('/workspaces', bursarController.listWorkspaceRecords);
router.post('/workspaces/records', bursarController.createWorkspaceRecord);
router.put('/workspaces/records/:recordId', bursarController.updateWorkspaceRecord);
router.delete('/workspaces/records/:recordId', bursarController.deleteWorkspaceRecord);

// MPESA Transactions
router.get('/mpesa/transactions', bursarController.getMpesaTransactions);
router.post('/mpesa/transactions/:transactionId/match', bursarController.matchMpesaTransaction);
router.post('/mpesa/transactions/bulk-match', bursarController.bulkMatchMpesa);
router.get('/mpesa/reconciliation/stats', bursarController.getMPesaReconciliationStats);
router.post('/mpesa/transactions/:transactionId/refund', bursarController.processMPesaRefund);

// Fee Structures
router.get('/fee-structures', bursarController.getFeeStructures);
router.get('/fee-structures/:structureId', bursarController.getFeeStructures);
router.post('/fee-structures', bursarController.getFeeStructures);
router.put('/fee-structures/:structureId', bursarController.getFeeStructures);
router.delete('/fee-structures/:structureId', bursarController.getFeeStructures);

// Payments
router.get('/payments', bursarController.getPayments);
router.get('/payments/:paymentId', bursarController.getPayments);
router.post('/payments', bursarController.recordPayment);
router.put('/payments/:paymentId', bursarController.recordPayment);
router.delete('/payments/:paymentId', bursarController.recordPayment);

// Student Fee State
router.get('/students/:studentId/fees', bursarController.getStudentFeeState);
router.get('/students/arrears', bursarController.getStudentsInArrears);
router.get('/students/arrears/summary', bursarController.getArrearsSummary);
router.get('/students/arrears/aging', bursarController.getArrearsAging);
router.post('/students/:studentId/late-fee', bursarController.applyLateFee);
router.post('/students/:studentId/waive-fee', bursarController.waiveFee);
router.post('/students/:studentId/adjust-balance', bursarController.adjustBalance);
router.post('/students/arrears/send-reminders', bursarController.bulkSendArrearsReminders);

// Payment Plans
router.get('/payment-plans', bursarController.getPaymentPlans);
router.get('/payment-plans/:planId', bursarController.getPaymentPlans);
router.post('/payment-plans', bursarController.createPaymentPlan);
router.put('/payment-plans/:planId', bursarController.createPaymentPlan);
router.post('/payment-plans/:planId/cancel', bursarController.createPaymentPlan);

// Expenses
router.get('/expenses', bursarController.getExpenses);
router.get('/expenses/:expenseId', bursarController.getExpenses);
router.post('/expenses', bursarController.recordExpense);
router.put('/expenses/:expenseId', bursarController.recordExpense);
router.post('/expenses/:expenseId/approve', bursarController.recordExpense);
router.post('/expenses/:expenseId/reject', bursarController.recordExpense);
router.get('/expenses/categories', bursarController.getExpenses);
router.post('/expenses/categories', bursarController.recordExpense);
router.put('/expenses/categories/:categoryId', bursarController.recordExpense);
router.get('/expenses/summary', bursarController.getExpenses);
router.delete('/expenses/:expenseId', bursarController.recordExpense);

// Payroll
router.get('/payroll/salary-structures', bursarController.getSalaryStructures);
router.post('/payroll/salary-structures', bursarController.createSalaryStructure);
router.put('/payroll/salary-structures/:structureId', bursarController.createSalaryStructure);
router.get('/payroll/runs', bursarController.getPayrollRuns);
router.post('/payroll/runs', bursarController.createPayrollRun);
router.post('/payroll/runs/:runId/process', bursarController.processPayroll);
router.post('/payroll/runs/:runId/approve', bursarController.approvePayroll);
router.post('/payroll/runs/:runId/disburse', bursarController.disbursePayroll);
router.get('/payroll/runs/:runId/payments', bursarController.getSalaryPayments);
router.get('/payroll/payments/:paymentId/payslip', bursarController.generatePayslip);
router.get('/payroll/advances', bursarController.getSalaryAdvances);
router.post('/payroll/advances', bursarController.requestSalaryAdvance);
router.post('/payroll/advances/:advanceId/approve', bursarController.approveSalaryAdvance);
router.post('/payroll/advances/:advanceId/reject', bursarController.rejectSalaryAdvance);

// Budgets
router.get('/budgets', bursarController.getBudgets);
router.get('/budgets/:budgetId', bursarController.getBudget);
router.post('/budgets', bursarController.createBudget);
router.put('/budgets/:budgetId', bursarController.updateBudget);
router.post('/budgets/:budgetId/approve', bursarController.approveBudget);
router.get('/budgets/:budgetId/utilization', bursarController.getBudgetUtilization);
router.get('/budgets/:budgetId/variance', bursarController.getBudgetVariance);

// Scholarships & Bursaries
router.get('/scholarships', bursarController.getScholarships);
router.post('/scholarships', bursarController.createScholarship);
router.put('/scholarships/:scholarshipId', bursarController.updateScholarship);
router.post('/scholarships/:scholarshipId/award', bursarController.createScholarship);
router.post('/scholarships/awards/:awardId/revoke', bursarController.updateScholarship);
router.get('/bursaries', bursarController.getScholarships);
router.post('/bursaries', bursarController.createScholarship);
router.put('/bursaries/:bursaryId', bursarController.updateScholarship);

// Invoices
router.get('/invoices', bursarController.getInvoices);
router.post('/invoices', bursarController.createInvoice);
router.put('/invoices/:invoiceId', bursarController.createInvoice);
router.post('/invoices/:invoiceId/send', bursarController.createInvoice);
router.post('/invoices/:invoiceId/cancel', bursarController.createInvoice);

// Bank Accounts
router.get('/bank-accounts', bursarController.getBankAccounts);
router.post('/bank-accounts', bursarController.addBankAccount);

// Petty Cash
router.get('/petty-cash', bursarController.getPettyCash);

// Fixed Assets
router.get('/fixed-assets', bursarController.getFixedAssets);
router.get('/fixed-assets/register', bursarController.getFixedAssets);

// Notifications
router.get('/notifications', bursarController.getNotifications);
router.patch('/notifications/:notificationId/read', bursarController.markNotificationAsRead);
router.patch('/notifications/read-all', bursarController.markAllNotificationsAsRead);
router.get('/notifications/unread-count', bursarController.getUnreadNotificationCount);

// Reports
router.post('/reports/generate', bursarController.generateFinancialReport);
router.get('/reports/templates', bursarController.generateFinancialReport);

export default router;
