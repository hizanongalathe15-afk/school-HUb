import { Request, Response } from 'express';
import { Prisma, PrismaClient, PaymentStatus, PaymentMethod, TeacherWorkflowStatus } from '@prisma/client';
import { hasFullAccess } from '../utils/accessControl.js';
import { processFeePayment } from '../services/automationService.js';

const prisma = new PrismaClient();

function normalizePaymentMethod(value: unknown): PaymentMethod {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'mpesa') return PaymentMethod.MPESA;
  if (normalized === 'card') return PaymentMethod.CARD;
  if (normalized === 'bank' || normalized === 'bank_transfer') return PaymentMethod.BANK_TRANSFER;
  if (normalized === 'cheque') return PaymentMethod.CHEQUE;
  return PaymentMethod.CASH;
}

function getAuthUserId(req: Request) {
  return (req as any).user?.userId || (req as any).user?.id;
}

function parseWorkspaceStatus(value: unknown) {
  const normalized = String(value || 'PENDING').toUpperCase();
  return normalized in TeacherWorkflowStatus
    ? normalized as TeacherWorkflowStatus
    : TeacherWorkflowStatus.PENDING;
}

function bursarOnly(roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const authUser = (req as any).user as { role: string };
    if (hasFullAccess(authUser?.role) || roles.includes(authUser?.role)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
  };
}

async function getBursarStats() {
  const [totalStudents, totalFees, completedFees] = await Promise.all([
    prisma.student.count(),
    prisma.fee.findMany(),
    prisma.fee.findMany({ where: { status: 'COMPLETED' } })
  ]);

  const totalBilled = totalFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = completedFees.reduce((sum, fee) => sum + fee.amount, 0);
  const totalArrears = totalBilled - totalPaid;

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayPayments, monthPayments, expenses] = await Promise.all([
    prisma.fee.findMany({ where: { paidDate: { gte: startOfDay }, status: 'COMPLETED' } }),
    prisma.fee.findMany({ where: { paidDate: { gte: startOfMonth }, status: 'COMPLETED' } }),
    prisma.expense.findMany({ where: { date: { gte: startOfMonth } } })
  ]);

  return {
    totalStudents,
    totalCollectedToday: todayPayments.reduce((sum, fee) => sum + fee.amount, 0),
    totalCollectedThisMonth: monthPayments.reduce((sum, fee) => sum + fee.amount, 0),
    totalArrears,
    totalExpensesThisMonth: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    cashBalance: totalPaid - expenses.reduce((sum, exp) => sum + exp.amount, 0),
    pendingPayments: totalFees.filter(f => f.status === 'PENDING').length
  };
}

export const bursarController = {
  // Dashboard
  getDashboard: async (req: Request, res: Response) => {
    try {
      const stats = await getBursarStats();
      const recentPayments = await prisma.fee.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { paidDate: 'desc' },
        take: 10,
        include: { student: { include: { class: true } } }
      });
      const pendingArrears = await prisma.student.findMany({
        where: { fees: { some: { status: 'PENDING' } } },
        include: { fees: { where: { status: 'PENDING' } }, class: true },
        take: 20
      });
      const mpesaTransactions = await prisma.mpesaTransaction.findMany({
        where: { status: 'PENDING' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: {
          quickStats: {
            totalCollectedToday: stats.totalCollectedToday,
            totalCollectedThisMonth: stats.totalCollectedThisMonth,
            totalArrears: stats.totalArrears,
            totalExpensesThisMonth: stats.totalExpensesThisMonth,
            cashBalance: stats.cashBalance,
            pendingPayments: stats.pendingPayments,
            budgetUtilization: Math.min(100, Math.round((stats.totalCollectedThisMonth / 5000000) * 100))
          },
          recentPayments: recentPayments.map(p => ({
            id: p.id,
            studentName: `${p.student.firstName} ${p.student.lastName}`,
            className: p.student.class?.name || '',
            amount: p.amount,
            paymentMethod: p.type,
            paymentDate: p.paidDate?.toISOString() || p.createdAt.toISOString()
          })),
          pendingArrears: pendingArrears.map(s => ({
            studentId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            className: s.class?.name || '',
            totalBalance: s.fees.reduce((sum, f) => sum + f.amount, 0),
            overdueAmount: 0,
            lastPaymentDate: new Date().toISOString()
          })),
          mpesaReconciliation: {
            totalUnmatched: mpesaTransactions.length,
            totalMatched: 0,
            totalAmount: mpesaTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
            lastReconciledAt: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load dashboard data' });
    }
  },

  // MPESA Transactions
  getMpesaTransactions: async (req: Request, res: Response) => {
    try {
      const { status, matched, startDate, endDate, page = 1, limit = 50 } = req.query as any;
      const where: any = {};
      
      if (status) where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const transactions = await prisma.mpesaTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.mpesaTransaction.count({ where });

      const data = await Promise.all(transactions.map(async (t) => {
        const student = t.studentId ? await prisma.student.findUnique({ where: { id: t.studentId }, include: { class: true } }) : null;
        return {
          id: t.id,
          date: t.createdAt.toISOString(),
          reference: t.mpesaReceiptNumber || t.checkoutRequestID || '',
          amount: t.amount || 0,
          studentName: student ? `${student.firstName} ${student.lastName}` : null,
          status: t.status
        };
      }));

      res.json({
        success: true,
        data,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load MPESA transactions' });
    }
  },

  matchMpesaTransaction: async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const { paymentId } = req.body;
      
      const transaction = await prisma.mpesaTransaction.update({
        where: { id: transactionId },
        data: {
          studentId: paymentId,
          status: 'COMPLETED'
        }
      });

      res.json({ success: true, data: transaction, message: 'Transaction matched' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to match transaction' });
    }
  },

  bulkMatchMpesa: async (req: Request, res: Response) => {
    try {
      const { matches } = req.body as { matches: { transactionId: string; paymentId: string }[] };
      
      for (const match of matches) {
        await prisma.mpesaTransaction.update({
          where: { id: match.transactionId },
          data: { studentId: match.paymentId, status: 'COMPLETED' }
        });
      }

      res.json({ success: true, message: `Matched ${matches.length} transactions` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Bulk match failed' });
    }
  },

  // Fee Structures
  getFeeStructures: async (req: Request, res: Response) => {
    try {
      const { academicYear, term, classId, isActive } = req.query as any;
      const where: any = {};
      
      if (academicYear) where.academicYear = Number(academicYear);
      if (term) where.term = term;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const structures = await prisma.feeStructure.findMany({
        where,
        include: {
          components: {
            include: {
              category: true,
              class: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: structures });
    } catch (error) {
      console.error('Unable to load fee structures:', error);
      res.status(500).json({ success: false, message: 'Unable to load fee structures' });
    }
  },

  // Payments
  getPayments: async (req: Request, res: Response) => {
    try {
      const { studentId, classId, paymentMethod, startDate, endDate, page = 1, limit = 50 } = req.query as any;
      const where: any = {};
      
      if (studentId) where.studentId = studentId;
      if (paymentMethod) where.type = paymentMethod;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const payments = await prisma.fee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { class: true } } }
      });

      const total = await prisma.fee.count({ where });

      res.json({
        success: true,
        data: payments.map(p => ({
          id: p.id,
          receiptNumber: `REC-${p.id.slice(-6).toUpperCase()}`,
          studentId: p.studentId,
          studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
          admissionNumber: p.student?.admissionNumber || '',
          classId: p.student?.classId || '',
          className: p.student?.class?.name || '',
          amount: p.amount,
          paymentMethod: p.type === 'MPESA_PAYMENT' ? 'mpesa' : 'bank',
          paymentDate: p.paidDate?.toISOString() || p.createdAt.toISOString(),
          status: p.status.toLowerCase()
        })),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load payments' });
    }
  },

   recordPayment: async (req: Request, res: Response) => {
     try {
       const { studentId, amount, paymentMethod, reference } = req.body;
       
       // Find the parent linked to the student to get parentId
       const student = await prisma.student.findUnique({
         where: { id: studentId },
         select: { parentId: true }
       });

       if (!student || !student.parentId) {
         return res.status(404).json({ success: false, message: 'Student or parent not found' });
       }

       // Use automation service for automatic processing (updates balance, sends notifications, etc.)
       const result = await processFeePayment(
         studentId,
         student.parentId,
         Number(amount),
         normalizePaymentMethod(paymentMethod),
         reference, // transactionId
         paymentMethod === 'mpesa' ? reference : undefined  // mpesaReceipt (only for MPESA)
       );

       res.status(201).json({ 
         success: true, 
         data: result, 
         message: 'Payment processed successfully' 
       });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Unable to record payment';
       res.status(500).json({ success: false, message });
     }
   },

  // Expenses
  getExpenses: async (req: Request, res: Response) => {
    try {
      const { category, startDate, endDate, page = 1, limit = 50 } = req.query as any;
      const where: any = {};
      
      if (category) where.category = category;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const expenses = await prisma.expense.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' }
      });

      const total = await prisma.expense.count({ where });

      res.json({
        success: true,
        data: expenses,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load expenses' });
    }
  },

  recordExpense: async (req: Request, res: Response) => {
    try {
      const { amount, category, description, date } = req.body;
      
      const expense = await prisma.expense.create({
        data: {
          amount: Number(amount),
          category,
          description,
          date: date ? new Date(date) : new Date(),
          recordedBy: (req as any).user?.userId || 'admin',
          approvedBy: (req as any).user?.userId || 'admin'
        }
      });

      res.status(201).json({ success: true, data: expense, message: 'Expense recorded' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to record expense' });
    }
  },

  // Student Arrears
  getStudentsInArrears: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query as any;
      
      const students = await prisma.student.findMany({
        where: { fees: { some: { status: 'PENDING' } } },
        skip: (page - 1) * limit,
        take: limit,
        include: { fees: { where: { status: 'PENDING' } }, class: true }
      });

      const total = await prisma.student.count({ where: { fees: { some: { status: 'PENDING' } } } });

      res.json({
        success: true,
        data: students.map(s => ({
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`,
          admissionNumber: s.admissionNumber,
          classId: s.classId,
          className: s.class?.name || '',
          totalBilled: s.fees.reduce((sum, f) => sum + f.amount, 0),
          totalPaid: 0,
          balance: s.fees.reduce((sum, f) => sum + f.amount, 0),
          status: 'arrears',
          lastPaymentDate: s.fees[0]?.createdAt?.toISOString()
        })),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load arrears' });
    }
  },

  // Reports
  generateFinancialReport: async (req: Request, res: Response) => {
    try {
      const { reportType, startDate, endDate } = req.body;
      const stats = await getBursarStats();

      const report = await prisma.financialReport.create({
        data: {
          name: reportType || 'financial',
          type: reportType || 'financial',
          period: `${startDate || new Date().toISOString()} - ${endDate || new Date().toISOString()}`,
          data: {
            summary: {
              totalIncome: stats.totalCollectedThisMonth,
              totalExpenses: stats.totalExpensesThisMonth,
              netPosition: stats.cashBalance
            }
          },
          generatedBy: getAuthUserId(req)
        }
      });

      res.json({
        success: true,
        data: {
          id: report.id,
          name: report.name,
          type: report.type,
          period: report.period,
          summary: report.data,
          generatedAt: report.generatedAt
        }
      });
    } catch (error) {
      console.error('Unable to generate report:', error);
      res.status(500).json({ success: false, message: 'Unable to generate report' });
    }
  },

  // MPESA Reconciliation
  getMPesaReconciliationStats: async (req: Request, res: Response) => {
    try {
      const [unmatched, matched, totalAmount] = await Promise.all([
        prisma.mpesaTransaction.count({ where: { status: 'PENDING' } }),
        prisma.mpesaTransaction.count({ where: { status: 'COMPLETED' } }),
        prisma.mpesaTransaction.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } })
      ]);

      res.json({
        success: true,
        data: {
          totalUnmatched: unmatched,
          totalMatched: matched,
          totalAmount: totalAmount._sum.amount || 0,
          lastReconciledAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load reconciliation stats' });
    }
  },

  processMPesaRefund: async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;

      await prisma.mpesaTransaction.update({
        where: { id: transactionId },
        data: { status: 'REFUNDED' }
      });

      res.json({ success: true, message: 'Refund processed' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to process refund' });
    }
  },

  // Student Fee State - GET specific student fees
  getStudentFeeState: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { fees: true, class: true, parent: true }
      });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const totalBilled = student.fees.reduce((sum, f) => sum + f.amount, 0);
      const totalPaid = student.fees.filter(f => f.status === 'COMPLETED').reduce((sum, f) => sum + f.amount, 0);

      res.json({
        success: true,
        data: {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          classId: student.classId,
          className: student.class?.name || '',
          guardianName: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : '',
          guardianPhone: student.parent?.phone || '',
          totalBilled,
          totalPaid,
          balance: totalBilled - totalPaid,
          arrears: totalBilled - totalPaid,
          status: totalBilled === totalPaid ? 'paid' : totalPaid > 0 ? 'partial' : 'arrears',
          paymentHistory: student.fees.map(f => ({
            id: f.id,
            amount: f.amount,
            paymentDate: f.paidDate?.toISOString() || f.createdAt.toISOString(),
            status: f.status.toLowerCase()
          })),
          flags: []
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load student fee state' });
    }
  },

  // Students Arrears additional endpoints
  getArrearsSummary: async (req: Request, res: Response) => {
    try {
      const pendingFees = await prisma.fee.findMany({ where: { status: 'PENDING' } });
      const totalArrears = pendingFees.reduce((sum, f) => sum + f.amount, 0);
      const studentCount = await prisma.student.count({ where: { fees: { some: { status: 'PENDING' } } } });
      
      res.json({
        success: true,
        data: {
          totalOutstanding: totalArrears,
          studentCount,
          overdueCount: pendingFees.length,
          averageOutstanding: totalArrears / studentCount || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load arrears summary' });
    }
  },

  getArrearsAging: async (req: Request, res: Response) => {
    try {
      const students = await prisma.student.findMany({
        where: { fees: { some: { status: 'PENDING' } } },
        include: { fees: { where: { status: 'PENDING' } } }
      });

      const aging = {
        current: students.filter(s => s.fees.every(f => {
          const daysDiff = (new Date().getTime() - new Date(f.dueDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30;
        })).length,
        thirtyDays: students.filter(s => s.fees.some(f => {
          const daysDiff = (new Date().getTime() - new Date(f.dueDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 30 && daysDiff <= 60;
        })).length,
        sixtyDays: students.filter(s => s.fees.some(f => {
          const daysDiff = (new Date().getTime() - new Date(f.dueDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 60 && daysDiff <= 90;
        })).length,
        ninetyPlusDays: students.filter(s => s.fees.some(f => {
          const daysDiff = (new Date().getTime() - new Date(f.dueDate).getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff > 90;
        })).length
      };

      res.json({ success: true, data: aging });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load arrears aging' });
    }
  },

  applyLateFee: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { amount, reason } = req.body;

      await prisma.fee.create({
        data: {
          studentId,
          amount: Number(amount),
          type: 'LATE_FEE',
          status: 'PENDING',
          term: 1,
          year: new Date().getFullYear(),
          dueDate: new Date(),
          reference: reason
        }
      });

      res.json({ success: true, message: 'Late fee applied' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to apply late fee' });
    }
  },

  waiveFee: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { amount, reason } = req.body;

      await prisma.fee.updateMany({
        where: { studentId, status: 'PENDING' },
        data: { status: 'REFUNDED' }
      });

      res.json({ success: true, message: 'Fee waived' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to waive fee' });
    }
  },

  adjustBalance: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { amount, reason } = req.body;

      await prisma.fee.create({
        data: {
          studentId,
          amount: Number(amount),
          type: 'ADJUSTMENT',
          status: 'PENDING',
          term: 1,
          year: new Date().getFullYear(),
          dueDate: new Date(),
          reference: reason
        }
      });

      res.json({ success: true, message: 'Balance adjusted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to adjust balance' });
    }
  },

  bulkSendArrearsReminders: async (req: Request, res: Response) => {
    try {
      const { studentIds, message } = req.body;
      // Placeholder for SMS integration
      res.json({ success: true, message: `Reminders sent to ${studentIds?.length || 0} students` });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to send reminders' });
    }
  },

  // Payment Plans
  getPaymentPlans: async (req: Request, res: Response) => {
    try {
      const { studentId, status } = req.query as any;
      const where: any = {};
      
      if (studentId) where.studentFeeId = studentId;
      if (status) where.status = status;

      const plans = await prisma.paymentPlan.findMany({
        where,
        include: {
          studentFee: {
            include: {
              student: {
                include: { class: true }
              }
            }
          },
          installments: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: plans });
    } catch (error) {
      console.error('Unable to load payment plans:', error);
      res.status(500).json({ success: false, message: 'Unable to load payment plans' });
    }
  },

  createPaymentPlan: async (req: Request, res: Response) => {
    try {
      const { studentFeeId, totalAmount, installmentCount, frequency, startDate } = req.body;
      
      const installmentAmount = totalAmount / installmentCount;
      const endDate = new Date(startDate);
      
      if (frequency === 'MONTHLY') {
        endDate.setMonth(endDate.getMonth() + installmentCount);
      } else if (frequency === 'WEEKLY') {
        endDate.setDate(endDate.getDate() + (installmentCount * 7));
      }

      const plan = await prisma.paymentPlan.create({
        data: {
          studentFeeId,
          totalAmount: Number(totalAmount),
          installmentCount: Number(installmentCount),
          installmentAmount,
          frequency,
          startDate: new Date(startDate),
          endDate,
          status: 'ACTIVE'
        },
        include: {
          studentFee: {
            include: {
              student: { include: { class: true } }
            }
          }
        }
      });

      // Create installments
      const installments = [];
      for (let i = 0; i < installmentCount; i++) {
        const dueDate = new Date(startDate);
        if (frequency === 'MONTHLY') {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else if (frequency === 'WEEKLY') {
          dueDate.setDate(dueDate.getDate() + (i * 7));
        }

        const installment = await prisma.paymentInstallment.create({
          data: {
            paymentPlanId: plan.id,
            installmentNumber: i + 1,
            dueDate,
            amount: installmentAmount,
            status: 'PENDING'
          }
        });
        installments.push(installment);
      }

      res.status(201).json({ success: true, data: { ...plan, installments }, message: 'Payment plan created' });
    } catch (error) {
      console.error('Unable to create payment plan:', error);
      res.status(500).json({ success: false, message: 'Unable to create payment plan' });
    }
  },

  // Payroll
  getSalaryStructures: async (req: Request, res: Response) => {
    try {
      const { employeeType } = req.query as any;
      const where: any = {};
      
      if (employeeType) where.employeeType = employeeType;

      const advances = await prisma.salaryAdvance.findMany({
        where,
        orderBy: { requestedAt: 'desc' }
      });

      res.json({ success: true, data: advances });
    } catch (error) {
      console.error('Unable to load salary structures:', error);
      res.status(500).json({ success: false, message: 'Unable to load salary structures' });
    }
  },

  createSalaryStructure: async (req: Request, res: Response) => {
    try {
      const { employeeId, employeeType, amount, reason } = req.body;
      
      const advance = await prisma.salaryAdvance.create({
        data: {
          employeeId,
          employeeType,
          amount: Number(amount),
          reason,
          repaymentAmount: Number(amount),
          status: 'PENDING',
          requestedAt: new Date()
        }
      });

      res.status(201).json({ success: true, data: advance, message: 'Salary advance request created' });
    } catch (error) {
      console.error('Unable to create salary structure:', error);
      res.status(500).json({ success: false, message: 'Unable to create salary structure' });
    }
  },

  getPayrollRuns: async (req: Request, res: Response) => {
    try {
      const { year, month } = req.query as any;
      const where: any = {};
      
      if (year) where.year = Number(year);
      if (month) where.month = Number(month);

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          entries: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: payrolls });
    } catch (error) {
      console.error('Unable to load payroll runs:', error);
      res.status(500).json({ success: false, message: 'Unable to load payroll runs' });
    }
  },

  createPayrollRun: async (req: Request, res: Response) => {
    try {
      const { month, year, name } = req.body;
      
      const payroll = await prisma.payroll.create({
        data: {
          name,
          month: Number(month),
          year: Number(year),
          processingDate: new Date(),
          totalAmount: 0,
          status: 'DRAFT',
          processedBy: getAuthUserId(req)
        }
      });

      res.status(201).json({ success: true, data: payroll, message: 'Payroll run created' });
    } catch (error) {
      console.error('Unable to create payroll run:', error);
      res.status(500).json({ success: false, message: 'Unable to create payroll run' });
    }
  },

  processPayroll: async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      
      const payroll = await prisma.payroll.update({
        where: { id: runId },
        data: {
          status: 'PROCESSED',
          processedBy: getAuthUserId(req)
        }
      });

      res.json({ success: true, data: payroll, message: 'Payroll processed' });
    } catch (error) {
      console.error('Unable to process payroll:', error);
      res.status(500).json({ success: false, message: 'Unable to process payroll' });
    }
  },

  approvePayroll: async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      
      const payroll = await prisma.payroll.update({
        where: { id: runId },
        data: {
          status: 'PAID',
          processedBy: getAuthUserId(req)
        }
      });

      res.json({ success: true, data: payroll, message: 'Payroll approved' });
    } catch (error) {
      console.error('Unable to approve payroll:', error);
      res.status(500).json({ success: false, message: 'Unable to approve payroll' });
    }
  },

  disbursePayroll: async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      
      const payroll = await prisma.payroll.update({
        where: { id: runId },
        data: {
          status: 'PAID',
          processedBy: getAuthUserId(req)
        }
      });

      res.json({ success: true, data: payroll, message: 'Payroll disbursed' });
    } catch (error) {
      console.error('Unable to disburse payroll:', error);
      res.status(500).json({ success: false, message: 'Unable to disburse payroll' });
    }
  },

  getSalaryPayments: async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      
      const entries = await prisma.payrollEntry.findMany({
        where: { payrollId: runId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: entries });
    } catch (error) {
      console.error('Unable to load salary payments:', error);
      res.status(500).json({ success: false, message: 'Unable to load salary payments' });
    }
  },

  generatePayslip: async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      const entry = await prisma.payrollEntry.findUnique({
        where: { id: paymentId }
      });

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Payment entry not found' });
      }

      res.json({ 
        success: true, 
        data: {
          ...entry,
          payslipUrl: `/payslips/${paymentId}.pdf`
        },
        message: 'Payslip generated' 
      });
    } catch (error) {
      console.error('Unable to generate payslip:', error);
      res.status(500).json({ success: false, message: 'Unable to generate payslip' });
    }
  },

  // Salary Advances
  getSalaryAdvances: async (req: Request, res: Response) => {
    try {
      const { employeeId, status } = req.query as any;
      const where: any = {};
      
      if (employeeId) where.employeeId = employeeId;
      if (status) where.status = status;

      const advances = await prisma.salaryAdvance.findMany({
        where,
        orderBy: { requestedAt: 'desc' }
      });

      res.json({ success: true, data: advances });
    } catch (error) {
      console.error('Unable to load salary advances:', error);
      res.status(500).json({ success: false, message: 'Unable to load salary advances' });
    }
  },

  requestSalaryAdvance: async (req: Request, res: Response) => {
    try {
      const { employeeId, employeeType, amount, reason } = req.body;
      
      const advance = await prisma.salaryAdvance.create({
        data: {
          employeeId,
          employeeType,
          amount: Number(amount),
          reason,
          repaymentAmount: Number(amount),
          status: 'PENDING',
          requestedAt: new Date()
        }
      });

      res.status(201).json({ success: true, data: advance, message: 'Salary advance request submitted' });
    } catch (error) {
      console.error('Unable to request salary advance:', error);
      res.status(500).json({ success: false, message: 'Unable to request salary advance' });
    }
  },

  approveSalaryAdvance: async (req: Request, res: Response) => {
    try {
      const { advanceId } = req.params;
      
      const advance = await prisma.salaryAdvance.update({
        where: { id: advanceId },
        data: {
          status: 'APPROVED',
          approvedBy: getAuthUserId(req),
          approvedAt: new Date()
        }
      });

      res.json({ success: true, data: advance, message: 'Salary advance approved' });
    } catch (error) {
      console.error('Unable to approve salary advance:', error);
      res.status(500).json({ success: false, message: 'Unable to approve salary advance' });
    }
  },

  rejectSalaryAdvance: async (req: Request, res: Response) => {
    try {
      const { advanceId } = req.params;
      const { reason } = req.body;
      
      const advance = await prisma.salaryAdvance.update({
        where: { id: advanceId },
        data: {
          status: 'REJECTED',
          approvedBy: getAuthUserId(req),
          approvedAt: new Date()
        }
      });

      res.json({ success: true, data: advance, message: 'Salary advance rejected' });
    } catch (error) {
      console.error('Unable to reject salary advance:', error);
      res.status(500).json({ success: false, message: 'Unable to reject salary advance' });
    }
  },

  // Budgets
  getBudgets: async (req: Request, res: Response) => {
    try {
      const { academicYear, status } = req.query as any;
      const where: any = {};
      
      if (academicYear) where.academicYear = Number(academicYear);
      if (status) where.status = status;

      const budgets = await prisma.budget.findMany({
        where,
        include: {
          allocations: {
            include: {
              actuals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: budgets });
    } catch (error) {
      console.error('Unable to load budgets:', error);
      res.status(500).json({ success: false, message: 'Unable to load budgets' });
    }
  },

  createBudget: async (req: Request, res: Response) => {
    try {
      const { name, academicYear, totalAmount, allocations } = req.body;

      const budget = await prisma.budget.create({
        data: {
          name,
          academicYear: Number(academicYear),
          totalAmount: Number(totalAmount),
          status: 'DRAFT',
          allocations: {
            create: allocations?.map((alloc: any) => ({
              department: alloc.department,
              category: alloc.category,
              allocatedAmount: Number(alloc.allocatedAmount)
            })) || []
          }
        },
        include: {
          allocations: {
            include: {
              actuals: true
            }
          }
        }
      });

      res.status(201).json({ success: true, data: budget, message: 'Budget created' });
    } catch (error) {
      console.error('Unable to create budget:', error);
      res.status(500).json({ success: false, message: 'Unable to create budget' });
    }
  },

  getBudget: async (req: Request, res: Response) => {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: req.params.budgetId },
        include: {
          allocations: {
            include: {
              actuals: {
                orderBy: { recordedAt: 'desc' }
              }
            }
          }
        }
      });

      if (!budget) {
        return res.status(404).json({ success: false, message: 'Budget not found' });
      }

      const totalSpent = budget.allocations.reduce((sum, alloc) => {
        return sum + alloc.actuals.reduce((aSum, actual) => aSum + actual.actualAmount, 0);
      }, 0);

      const remaining = budget.totalAmount - totalSpent;
      const utilizationPercentage = budget.totalAmount > 0 ? Math.min(100, Math.round((totalSpent / budget.totalAmount) * 100)) : 0;

      const payload = {
        ...budget,
        totalSpent,
        remaining,
        utilizationPercentage,
        allocations: budget.allocations.map(alloc => {
          const allocSpent = alloc.actuals.reduce((sum, actual) => sum + actual.actualAmount, 0);
          const allocRemaining = alloc.allocatedAmount - allocSpent;
          const allocUtilization = alloc.allocatedAmount > 0 ? Math.min(100, Math.round((allocSpent / alloc.allocatedAmount) * 100)) : 0;
          return {
            ...alloc,
            spent: allocSpent,
            remaining: allocRemaining,
            utilizationPercentage: allocUtilization,
            actuals: alloc.actuals
          };
        })
      };

      res.json({ success: true, data: payload });
    } catch (error) {
      console.error('Unable to load budget:', error);
      res.status(500).json({ success: false, message: 'Unable to load budget' });
    }
  },

  updateBudget: async (req: Request, res: Response) => {
    try {
      const { name, academicYear, totalAmount, allocations } = req.body;

      const budget = await prisma.budget.update({
        where: { id: req.params.budgetId },
        data: {
          ...(name !== undefined && { name }),
          ...(academicYear !== undefined && { academicYear: Number(academicYear) }),
          ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
          ...(allocations !== undefined && {
            allocations: {
              deleteMany: {},
              create: allocations.map((alloc: any) => ({
                department: alloc.department,
                category: alloc.category,
                allocatedAmount: Number(alloc.allocatedAmount)
              }))
            }
          })
        },
        include: {
          allocations: {
            include: {
              actuals: true
            }
          }
        }
      });

      const totalSpent = budget.allocations.reduce((sum, alloc) => {
        return sum + alloc.actuals.reduce((aSum, actual) => aSum + actual.actualAmount, 0);
      }, 0);

      const payload = {
        ...budget,
        totalSpent,
        remaining: budget.totalAmount - totalSpent,
        utilizationPercentage: budget.totalAmount > 0 ? Math.min(100, Math.round((totalSpent / budget.totalAmount) * 100)) : 0
      };

      res.json({ success: true, data: payload, message: 'Budget updated' });
    } catch (error) {
      console.error('Unable to update budget:', error);
      res.status(500).json({ success: false, message: 'Unable to update budget' });
    }
  },

  approveBudget: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const budget = await prisma.budget.update({
        where: { id: req.params.budgetId },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date()
        },
        include: {
          allocations: {
            include: {
              actuals: true
            }
          }
        }
      });

      res.json({ success: true, data: budget, message: 'Budget approved' });
    } catch (error) {
      console.error('Unable to approve budget:', error);
      res.status(500).json({ success: false, message: 'Unable to approve budget' });
    }
  },

  getBudgetUtilization: async (req: Request, res: Response) => {
    try {
      const budget = await prisma.budget.findUnique({
        where: { id: req.params.budgetId },
        include: {
          allocations: {
            include: {
              actuals: {
                orderBy: { recordedAt: 'desc' }
              }
            }
          }
        }
      });

      if (!budget) {
        return res.status(404).json({ success: false, message: 'Budget not found' });
      }

      const totalSpent = budget.allocations.reduce((sum, alloc) => {
        return sum + alloc.actuals.reduce((aSum, actual) => aSum + actual.actualAmount, 0);
      }, 0);

      res.json({
        success: true,
        data: {
          totalAllocation: budget.totalAmount,
          totalSpent,
          remaining: budget.totalAmount - totalSpent,
          utilizationPercentage: budget.totalAmount > 0 ? Math.min(100, (totalSpent / budget.totalAmount) * 100) : 0
        }
      });
    } catch (error) {
      console.error('Unable to get budget utilization:', error);
      res.status(500).json({ success: false, message: 'Unable to get budget utilization' });
    }
  },

  getBudgetVariance: async (req: Request, res: Response) => {
    try {
      const variances = await prisma.budgetActual.findMany({
        where: { budgetId: req.params.budgetId },
        include: {
          allocation: true
        },
        orderBy: { recordedAt: 'desc' }
      });

      res.json({ success: true, data: variances });
    } catch (error) {
      console.error('Unable to get budget variance:', error);
      res.status(500).json({ success: false, message: 'Unable to get budget variance' });
    }
  },

  // Scholarships & Bursaries
  getScholarships: async (req: Request, res: Response) => {
    try {
      const { type, isActive } = req.query as any;
      const where: any = {};
      
      if (type) where.type = type;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const scholarships = await prisma.scholarshipProgram.findMany({
        where,
        include: {
          awards: {
            include: {
              studentFee: {
                include: {
                  student: { include: { class: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: scholarships });
    } catch (error) {
      console.error('Unable to load scholarships:', error);
      res.status(500).json({ success: false, message: 'Unable to load scholarships' });
    }
  },

  createScholarship: async (req: Request, res: Response) => {
    try {
      const { name, description, type, criteria, amount, percentage, duration, maxRecipients } = req.body;
      
      const scholarship = await prisma.scholarshipProgram.create({
        data: {
          name,
          description,
          type,
          criteria,
          amount: amount ? Number(amount) : null,
          percentage: percentage ? Number(percentage) : null,
          duration,
          maxRecipients: maxRecipients ? Number(maxRecipients) : null,
          isActive: true
        }
      });

      res.status(201).json({ success: true, data: scholarship, message: 'Scholarship created' });
    } catch (error) {
      console.error('Unable to create scholarship:', error);
      res.status(500).json({ success: false, message: 'Unable to create scholarship' });
    }
  },

  updateScholarship: async (req: Request, res: Response) => {
    try {
      const { scholarshipId } = req.params;
      const { name, description, type, criteria, amount, percentage, duration, maxRecipients, isActive } = req.body;
      
      const scholarship = await prisma.scholarshipProgram.update({
        where: { id: scholarshipId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type }),
          ...(criteria !== undefined && { criteria }),
          ...(amount !== undefined && { amount: Number(amount) }),
          ...(percentage !== undefined && { percentage: Number(percentage) }),
          ...(duration !== undefined && { duration }),
          ...(maxRecipients !== undefined && { maxRecipients: Number(maxRecipients) }),
          ...(isActive !== undefined && { isActive })
        }
      });

      res.json({ success: true, data: scholarship, message: 'Scholarship updated' });
    } catch (error) {
      console.error('Unable to update scholarship:', error);
      res.status(500).json({ success: false, message: 'Unable to update scholarship' });
    }
  },

  // Invoices
  getInvoices: async (req: Request, res: Response) => {
    try {
      const { studentId, status, startDate, endDate } = req.query as any;
      const where: any = {};
      
      if (studentId) where.studentId = studentId;
      if (status) where.status = status;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          studentFee: {
            include: {
              student: { include: { class: true } }
            }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: invoices });
    } catch (error) {
      console.error('Unable to load invoices:', error);
      res.status(500).json({ success: false, message: 'Unable to load invoices' });
    }
  },

  createInvoice: async (req: Request, res: Response) => {
    try {
      const { studentFeeId, studentId, totalAmount, dueDate, notes, items } = req.body;
      
      const invoiceNumber = `INV-${Date.now()}`;
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          studentFeeId,
          studentId,
          totalAmount: Number(totalAmount),
          paidAmount: 0,
          balanceAmount: Number(totalAmount),
          dueDate: new Date(dueDate),
          status: 'DRAFT',
          notes,
          items: {
            create: items?.map((item: any) => ({
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice),
              amount: Number(item.quantity || 1) * Number(item.unitPrice)
            })) || []
          }
        },
        include: {
          items: true
        }
      });

      res.status(201).json({ success: true, data: invoice, message: 'Invoice created' });
    } catch (error) {
      console.error('Unable to create invoice:', error);
      res.status(500).json({ success: false, message: 'Unable to create invoice' });
    }
  },

  // Bank Accounts
  getBankAccounts: async (req: Request, res: Response) => {
    try {
      const { isActive } = req.query as any;
      const where: any = {};
      
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const accounts = await prisma.bankAccount.findMany({
        where,
        include: {
          transactions: {
            take: 10,
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: accounts });
    } catch (error) {
      console.error('Unable to load bank accounts:', error);
      res.status(500).json({ success: false, message: 'Unable to load bank accounts' });
    }
  },

  addBankAccount: async (req: Request, res: Response) => {
    try {
      const { bankName, accountName, accountNumber, accountType, currency, balance } = req.body;
      
      const account = await prisma.bankAccount.create({
        data: {
          bankName,
          accountName,
          accountNumber,
          accountType,
          currency: currency || 'KES',
          balance: Number(balance) || 0,
          isActive: true
        }
      });

      res.status(201).json({ success: true, data: account, message: 'Bank account added' });
    } catch (error) {
      console.error('Unable to add bank account:', error);
      res.status(500).json({ success: false, message: 'Unable to add bank account' });
    }
  },

  // Petty Cash
  getPettyCash: async (req: Request, res: Response) => {
    try {
      const { custodianId, isActive } = req.query as any;
      const where: any = {};
      
      if (custodianId) where.custodianId = custodianId;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const pettyCashAccounts = await prisma.pettyCash.findMany({
        where,
        include: {
          transactions: {
            take: 20,
            orderBy: { createdAt: 'desc' }
          },
          replenishments: {
            take: 10,
            orderBy: { requestedAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, data: pettyCashAccounts });
    } catch (error) {
      console.error('Unable to load petty cash:', error);
      res.status(500).json({ success: false, message: 'Unable to load petty cash' });
    }
  },

  // Fixed Assets
  getFixedAssets: async (req: Request, res: Response) => {
    try {
      const { category, status, location } = req.query as any;
      const where: any = {};
      
      if (category) where.category = category;
      if (status) where.status = status;
      if (location) where.location = location;

      const assets = await prisma.fixedAsset.findMany({
        where,
        include: {
          maintenanceRecords: {
            take: 5,
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { purchaseDate: 'desc' }
      });

      res.json({ success: true, data: assets });
    } catch (error) {
      console.error('Unable to load fixed assets:', error);
      res.status(500).json({ success: false, message: 'Unable to load fixed assets' });
    }
  },

  // Notifications
  getNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      res.json({ success: true, data: notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load notifications' });
    }
  },

  markNotificationAsRead: async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to mark notification as read' });
    }
  },

  markAllNotificationsAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to mark all notifications as read' });
    }
  },

  getUnreadNotificationCount: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const count = await prisma.notification.count({ where: { userId, isRead: false } });
      res.json({ success: true, data: { count } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to get unread count' });
    }
  },

  listWorkspaceRecords: async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { section, item } = req.query;
      const records = await prisma.bursarWorkspaceRecord.findMany({
        where: {
          userId,
          ...(section ? { section: String(section) } : {}),
          ...(item ? { item: String(item) } : {})
        },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Unable to load bursar workspace records:', error);
      res.status(500).json({ success: false, message: 'Unable to load workspace records' });
    }
  },

  createWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const record = await prisma.bursarWorkspaceRecord.create({
        data: {
          userId,
          section: String(req.body.section || 'general'),
          item: String(req.body.item || req.body.section || 'record'),
          title: String(req.body.title || 'Financial record'),
          content: req.body.content ? String(req.body.content) : undefined,
          amount: req.body.amount !== undefined && req.body.amount !== '' ? Number(req.body.amount) : undefined,
          payload: (req.body.payload || {}) as Prisma.InputJsonObject,
          status: parseWorkspaceStatus(req.body.status)
        }
      });
      res.status(201).json({ success: true, data: record, message: 'Record saved' });
    } catch (error) {
      console.error('Unable to create bursar workspace record:', error);
      res.status(500).json({ success: false, message: 'Unable to create workspace record' });
    }
  },

  updateWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const existing = await prisma.bursarWorkspaceRecord.findFirst({ where: { id: req.params.recordId, userId } });
      if (!existing) return res.status(404).json({ success: false, message: 'Record not found' });
      const record = await prisma.bursarWorkspaceRecord.update({
        where: { id: req.params.recordId },
        data: {
          title: req.body.title !== undefined ? String(req.body.title) : undefined,
          content: req.body.content !== undefined ? String(req.body.content) : undefined,
          amount: req.body.amount !== undefined && req.body.amount !== '' ? Number(req.body.amount) : undefined,
          payload: req.body.payload as Prisma.InputJsonObject,
          status: req.body.status ? parseWorkspaceStatus(req.body.status) : undefined
        }
      });
      res.json({ success: true, data: record, message: 'Record updated' });
    } catch (error) {
      console.error('Unable to update bursar workspace record:', error);
      res.status(500).json({ success: false, message: 'Unable to update workspace record' });
    }
  },

  deleteWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const existing = await prisma.bursarWorkspaceRecord.findFirst({ where: { id: req.params.recordId, userId } });
      if (!existing) return res.status(404).json({ success: false, message: 'Record not found' });
      await prisma.bursarWorkspaceRecord.delete({ where: { id: req.params.recordId } });
      res.json({ success: true, message: 'Record deleted' });
    } catch (error) {
      console.error('Unable to delete bursar workspace record:', error);
      res.status(500).json({ success: false, message: 'Unable to delete workspace record' });
    }
  }
};

export const bursarOnlyMiddleware = bursarOnly(['BURSAR']);
