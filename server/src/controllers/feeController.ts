import { Request, Response } from 'express';
import { PaymentMethod, PrismaClient } from '@prisma/client';
import { hasFullAccess } from '../utils/accessControl.js';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';
import { processFeePayment } from '../services/automationService.js';

const prisma = new PrismaClient();

function normalizePaymentMethod(channel: unknown): PaymentMethod {
  const normalized = String(channel || '').toUpperCase();
  if (normalized === 'MPESA') return PaymentMethod.MPESA;
  if (normalized === 'CARD') return PaymentMethod.CARD;
  if (normalized === 'BANK' || normalized === 'BANK_TRANSFER') return PaymentMethod.BANK_TRANSFER;
  if (normalized === 'CHEQUE') return PaymentMethod.CHEQUE;
  return PaymentMethod.CASH;
}

async function canAccessStudent(req: Request, studentId: string) {
  const authUser = (req as any).user as { userId: string; role: string };
  if (hasFullAccess(authUser?.role) || ['BURSAR', 'STORE_KEEPER'].includes(authUser?.role)) return true;

  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      parent: { userId: authUser.userId }
    },
    select: { id: true }
  });
  return Boolean(student);
}

export const feeController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const fees = await prisma.fee.findMany();
      res.json(fees);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getByStudent: async (req: Request, res: Response) => {
    try {
      if (!await canAccessStudent(req, req.params.studentId)) {
        return res.status(403).json({ message: 'You can only view fees for your linked children.' });
      }

      const fees = await prisma.fee.findMany({
        where: { studentId: req.params.studentId },
        orderBy: { createdAt: 'desc' }
      });
      const billed = fees.filter((fee) => fee.status !== 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
      const paid = fees.filter((fee) => fee.status === 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
      res.json({ data: fees, summary: { billed, paid, balance: Math.max(billed - paid, 0) } });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

   makePayment: async (req: Request, res: Response) => {
     try {
       const { studentId, amount, channel = 'MANUAL', reference } = req.body;
       if (!studentId || !amount || Number(amount) <= 0) {
         return res.status(400).json({ message: 'studentId and positive amount are required' });
       }

       if (!await canAccessStudent(req, studentId)) {
         return res.status(403).json({ message: 'You can only pay fees for your linked children.' });
       }

       // Find the parent linked to the student to get parentId
       const student = await prisma.student.findUnique({
         where: { id: studentId },
         select: { parentId: true }
       });

       if (!student || !student.parentId) {
         return res.status(404).json({ message: 'Student or parent not found' });
       }

       // Use automation service for automatic processing (updates balance, sends notifications, etc.)
       const result = await processFeePayment(
         studentId,
         student.parentId,
         Number(amount),
         normalizePaymentMethod(channel),
         reference, // transactionId
         channel === 'MPESA' ? reference : undefined  // mpesaReceipt (only for MPESA)
       );
       const firstPayment = result.payments[0];

       // Emit event for real-time updates
       eventEmitter.emitEvent('fee:paid', {
         studentId,
         amount: Number(amount),
         transactionId: firstPayment?.transactionId || reference || '',
         timestamp: new Date().toISOString()
       });

       // Audit log
       await auditLogger.logCreate(
         (req as any).user?.userId,
         'Payment',
         firstPayment?.id || '',
         {
           studentId,
           amount: Number(amount),
           channel,
           reference,
           term: Number(req.body.term || 2),
           year: new Date().getFullYear()
         },
         `Payment recorded for student ${studentId}: KSh ${amount} via ${channel}`
       );

       res.status(201).json({ 
         message: 'Payment processed successfully', 
         receiptNumber: firstPayment?.receiptNumber || result.receipts[0] || `REC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, 
         data: result 
       });
     } catch (error: any) {
       res.status(error?.message === 'Student not found' ? 404 : 500).json({ message: error?.message || 'Unable to record payment' });
     }
   },

  simulateMpesa: async (req: Request, res: Response) => {
    req.body.channel = 'MPESA';
    req.body.reference = req.body.reference || `MPESA-${Date.now()}`;
    return feeController.makePayment(req, res);
  },

  reports: async (_req: Request, res: Response) => {
    try {
      const fees = await prisma.fee.findMany({ include: { student: true } });
      const paid = fees.filter((fee) => fee.status === 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
      const pending = fees.filter((fee) => fee.status !== 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
      const recent = fees.slice(0, 20).map((fee) => ({
        id: fee.id,
        student: `${fee.student.firstName} ${fee.student.lastName}`,
        amount: fee.amount,
        status: fee.status,
        reference: fee.reference,
        date: fee.paidDate || fee.createdAt
      }));
      res.json({ paid, pending, collectionRate: paid + pending ? Math.round((paid / (paid + pending)) * 100) : 0, recent });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load fee reports' });
    }
  },

  // Parent-specific fee endpoints
  parentGetFeeBalances: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: true }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const balances = await Promise.all(parent.students.map(async (student) => {
        const fees = await prisma.fee.findMany({ where: { studentId: student.id } });
        const totalFee = fees.reduce((sum, fee) => sum + fee.amount, 0);
        const paidAmount = fees.filter((fee) => fee.status === 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          classId: student.classId,
          className: student.classId,
          termId: '1',
          termName: 'Term 1',
          year: new Date().getFullYear(),
          totalFee,
          paidAmount,
          balance: Math.max(totalFee - paidAmount, 0),
          isOverdue: fees.some((fee) => fee.status !== 'COMPLETED' && fee.dueDate && new Date(fee.dueDate) < new Date())
        };
      }));
      res.json({ success: true, data: balances });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load fee balances' });
    }
  },

  parentGetPaymentHistory: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.query as any;
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: true }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const studentIds = childId ? [childId] : parent.students.map((s) => s.id);
      const fees = await prisma.fee.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: { createdAt: 'desc' }
      });

      const payments = fees.map((fee) => ({
        id: fee.id,
        studentId: fee.studentId,
        amount: fee.amount,
        paymentDate: fee.paidDate || fee.createdAt,
        paymentMethod: fee.type === 'MPESA_PAYMENT' ? 'mpesa' : 'bank',
        reference: fee.reference,
        receiptNumber: `REC-${fee.id.slice(-6).toUpperCase()}`,
        paidBy: 'Parent',
        status: fee.status === 'COMPLETED' ? 'completed' : 'pending'
      }));
      res.json({ success: true, data: payments });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to load payment history' });
    }
  },

  parentMakeMPESAPayment: async (req: Request, res: Response) => {
    try {
      const { childId, amount, phoneNumber } = req.body;
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) return res.status(403).json({ success: false, message: 'Invalid child or access denied' });

      const fee = await prisma.fee.create({
        data: {
          studentId: childId,
          amount: Number(amount),
          type: 'MPESA_PAYMENT',
          term: 2,
          year: new Date().getFullYear(),
          status: 'PENDING',
          dueDate: new Date(),
          reference: `MPESA-${phoneNumber}-${Date.now()}`,
        }
      });
      res.json({ success: true, message: 'MPESA payment initiated', data: { ...fee, receiptNumber: `REC-${fee.id.slice(-6).toUpperCase()}` } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to process MPESA payment' });
    }
  },

  parentMakeCardPayment: async (req: Request, res: Response) => {
    try {
      const { childId, amount, cardToken } = req.body;
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) return res.status(403).json({ success: false, message: 'Invalid child or access denied' });

      const fee = await prisma.fee.create({
        data: {
          studentId: childId,
          amount: Number(amount),
          type: 'CARD_PAYMENT',
          term: 2,
          year: new Date().getFullYear(),
          status: 'PENDING',
          dueDate: new Date(),
          reference: `CARD-${cardToken.slice(-4)}-${Date.now()}`,
        }
      });
      res.json({ success: true, message: 'Card payment initiated', data: { ...fee, receiptNumber: `REC-${fee.id.slice(-6).toUpperCase()}` } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Unable to process card payment' });
    }
  }
};
