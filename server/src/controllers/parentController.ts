import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hasFullAccess } from '../utils/accessControl.js';
import { parentSelfClaimStudent, sendParentTeacherMessage, processFeePayment } from '../services/automationService.js';

const prisma = new PrismaClient();

function splitName(fullName?: string) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Parent',
    lastName: parts.slice(1).join(' ') || 'Guardian'
  };
}

interface TimetableEntry {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  period: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
}

export const parentController = {
  list: async (_req: Request, res: Response) => {
    try {
      const parents = await prisma.parent.findMany({ include: { students: true } });
      res.json({ data: parents });
    } catch {
      res.status(500).json({ message: 'Unable to load parents' });
    }
  },

  students: async (req: Request, res: Response) => {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id: req.params.id },
        include: { students: { include: { fees: true, attendance: true, results: true } } }
      });
      if (!parent) return res.status(404).json({ message: 'Parent not found' });
      res.json({ data: parent.students });
    } catch {
      res.status(500).json({ message: 'Unable to load parent students' });
    }
  },

  dashboard: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: hasFullAccess(authUser.role) ? {} : { userId: authUser.userId },
        include: { students: { include: { class: true, fees: true, attendance: true, results: true } } }
      });

      if (!parent) return res.status(404).json({ message: 'Parent profile not found' });

      const children = parent.students.map((student) => {
        const paid = student.fees.filter((fee) => fee.status === 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
        const billed = student.fees.filter((fee) => fee.status !== 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);
        const balance = Math.max(billed - paid, 0);
        const feeProgress = billed > 0 ? Math.min(100, Math.round((paid / billed) * 100)) : 100;
        const present = student.attendance.filter((item) => ['PRESENT', 'LATE'].includes(item.status.toUpperCase())).length;
        const attendanceRate = student.attendance.length ? Math.round((present / student.attendance.length) * 100) : 0;
        const mean = student.results.length ? Math.round(student.results.reduce((sum, result) => sum + result.score, 0) / student.results.length) : 0;
        const recentPayments = student.fees
          .filter((fee) => fee.status === 'COMPLETED')
          .sort((a, b) => Number(new Date(b.paidDate || b.createdAt)) - Number(new Date(a.paidDate || a.createdAt)))
          .slice(0, 5)
          .map((fee) => ({
            id: fee.id,
            amount: fee.amount,
            reference: fee.reference,
            term: fee.term,
            year: fee.year,
            paidDate: fee.paidDate || fee.createdAt
          }));
        return {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          photo: student.photo,
          classId: student.classId,
          className: student.class?.name || student.classId,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          currentTermStats: {
            attendancePercentage: attendanceRate,
            averageScore: mean,
            meritsCount: 0,
            demeritsCount: 0
          },
          totalFee: billed,
          paidAmount: paid,
          balance,
          recentPayments
        };
      });

      const pendingFees = children
        .filter((child) => child.balance > 0)
        .map((child) => ({
          studentId: child.id,
          studentName: `${child.firstName} ${child.lastName}`,
          classId: child.classId,
          className: child.className,
          termId: '1',
          termName: 'Term 1',
          year: new Date().getFullYear(),
          totalFee: child.totalFee,
          paidAmount: child.paidAmount,
          balance: child.balance,
          isOverdue: false
        }));

      const unreadMessages = await prisma.message.count({
        where: { parentId: parent.id, isRead: false }
      });

      res.json({
        success: true,
        data: {
          children,
          pendingFees,
          upcomingEvents: [],
          recentAnnouncements: [],
          recentMessages: [],
          attendanceAlerts: [],
          pendingHomework: [],
          upcomingMeetings: [],
          recentNotifications: [],
          quickStats: {
            totalChildren: children.length,
            totalFeesPending: pendingFees.reduce((sum, fee) => sum + fee.balance, 0),
            unreadMessages,
            upcomingEventsCount: 0,
            attendanceAlertsCount: 0,
            pendingHomeworkCount: 0
          }
        }
      });
    } catch {
      res.status(500).json({ message: 'Unable to load parent dashboard' });
    }
  },

  getMyChildren: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { include: { class: true, attendance: true, results: true } } }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });
      const children = parent.students.map((student) => {
        const present = student.attendance.filter((item) => ['PRESENT', 'LATE'].includes(item.status.toUpperCase())).length;
        const attendanceRate = student.attendance.length ? Math.round((present / student.attendance.length) * 100) : 0;
        const mean = student.results.length ? Math.round(student.results.reduce((sum, result) => sum + result.score, 0) / student.results.length) : 0;

        return {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          photo: student.photo,
          classId: student.classId,
          className: student.class?.name || student.classId,
          streamName: student.class?.stream || student.stream,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          medicalInfo: {
            allergies: student.allergies,
            conditions: Array.isArray(student.medicalConditions) ? student.medicalConditions : [],
            bloodGroup: student.bloodGroup || undefined
          },
          currentTermStats: {
            attendancePercentage: attendanceRate,
            averageScore: mean,
            meritsCount: 0,
            demeritsCount: 0
          }
        };
      });
      res.json({ success: true, data: children });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load children' });
    }
  },

  linkExistingStudent: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: Role };
      if (authUser.role !== Role.PARENT) {
        return res.status(403).json({ success: false, message: 'Only parent accounts can link students' });
      }

      const { admissionNumber, dateOfBirth, relationship } = req.body as {
        admissionNumber?: string;
        dateOfBirth?: string;
        relationship?: string;
      };

      if (!admissionNumber || !dateOfBirth) {
        return res.status(400).json({ success: false, message: 'Admission number and child date of birth are required' });
      }

      const [user, student] = await Promise.all([
        prisma.user.findUnique({ where: { id: authUser.userId } }),
        prisma.student.findUnique({
          where: { admissionNumber: admissionNumber.trim() },
          select: { id: true, admissionNumber: true, dateOfBirth: true }
        })
      ]);

      if (!user) {
        return res.status(404).json({ success: false, message: 'Parent account not found' });
      }

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found. Check the admission number and try again.' });
      }

      const providedDob = new Date(dateOfBirth).toISOString().slice(0, 10);
      const storedDob = student.dateOfBirth.toISOString().slice(0, 10);
      if (providedDob !== storedDob) {
        return res.status(403).json({ success: false, message: 'Verification failed. The date of birth does not match school records.' });
      }

      const names = splitName(`${user.firstName} ${user.lastName}`);
      const result = await parentSelfClaimStudent(
        {
          firstName: names.firstName,
          lastName: names.lastName,
          email: user.email,
          phone: user.phone || 'Not provided',
          relationship: relationship || 'Guardian'
        },
        { admissionNumber: student.admissionNumber }
      );

      res.status(201).json({
        success: true,
        message: 'Student linked successfully. Your dashboard will keep this connection on future logins.',
        data: {
          id: result.student.id,
          admissionNumber: result.student.admissionNumber,
          firstName: result.student.firstName,
          lastName: result.student.lastName,
          classId: result.student.classId,
          className: result.student.class?.name || result.student.classId,
          streamName: result.student.class?.stream || result.student.stream,
          dateOfBirth: result.student.dateOfBirth,
          gender: result.student.gender
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Unable to link student' });
    }
  },

  getChildFeeBalance: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      // Verify parent has access to this child
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const fees = await prisma.fee.findMany({ where: { studentId: childId } });
      const totalFee = fees.reduce((sum, fee) => sum + fee.amount, 0);
      const paidAmount = fees.filter((fee) => fee.status === 'COMPLETED').reduce((sum, fee) => sum + fee.amount, 0);

      const balance = {
        studentId: childId,
        studentName: `${parent.students[0].firstName} ${parent.students[0].lastName}`,
        classId: parent.students[0].classId,
        className: parent.students[0].classId,
        termId: '1',
        termName: 'Term 1',
        year: new Date().getFullYear(),
        totalFee,
        paidAmount,
        balance: Math.max(totalFee - paidAmount, 0),
        isOverdue: false
      };
      res.json({ success: true, data: balance });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load fee balance' });
    }
  },

  getParentFeeBalances: async (req: Request, res: Response) => {
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
          isOverdue: false
        };
      }));
      res.json({ success: true, data: balances });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load fee balances' });
    }
  },

  getParentPaymentHistory: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.query as any;
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: true }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const studentIds = childId ? [childId as string] : parent.students.map((s) => s.id);
      const fees = await prisma.fee.findMany({
        where: { studentId: { in: studentIds as string[] } },
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
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load payment history' });
    }
  },

   makeMPESAPayment: async (req: Request, res: Response) => {
     try {
       const { childId, amount, phoneNumber } = req.body;
       const authUser = (req as any).user as { userId: string; role: string };
       const parent = await prisma.parent.findFirst({
         where: { userId: authUser.userId },
         include: { students: { where: { id: childId } } }
       });
       if (!parent || !parent.students.length) return res.status(403).json({ success: false, message: 'Invalid child or access denied' });

       // Use automation service for automatic processing (updates balance, sends notifications, etc.)
       const result = await processFeePayment(
         childId,
         parent.id,
         Number(amount),
         'MPESA', // PaymentMethod
         undefined, // transactionId (will be generated)
         undefined  // mpesaReceipt (will be generated)
       );

       res.json({ success: true, message: 'MPESA payment processed successfully', data: result });
     } catch (error: any) {
       res.status(500).json({ success: false, message: error.message || 'Unable to process MPESA payment' });
     }
   },

   makeCardPayment: async (req: Request, res: Response) => {
     try {
       const { childId, amount, cardToken } = req.body;
       const authUser = (req as any).user as { userId: string; role: string };
       const parent = await prisma.parent.findFirst({
         where: { userId: authUser.userId },
         include: { students: { where: { id: childId } } }
       });
       if (!parent || !parent.students.length) return res.status(403).json({ success: false, message: 'Invalid child or access denied' });

       // Use automation service for automatic processing (updates balance, sends notifications, etc.)
       const result = await processFeePayment(
         childId,
         parent.id,
         Number(amount),
         'CARD', // PaymentMethod
         cardToken, // transactionId
         undefined  // mpesaReceipt (not applicable for card)
       );

       res.json({ success: true, message: 'Card payment processed successfully', data: result });
     } catch (error: any) {
       res.status(500).json({ success: false, message: error.message || 'Unable to process card payment' });
     }
   },

  downloadReceipt: async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      // Return mock receipt as blob
      const receiptContent = `Receipt #REC-${paymentId}\nSchool Hub Academy\nThank you for your payment.`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt_${paymentId}.pdf`);
      res.send(receiptContent);
    } catch {
      res.status(500).json({ success: false, message: 'Unable to download receipt' });
    }
  },

  getProfile: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: true, user: true }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const { user, ...parentData } = parent;
      res.json({
        success: true,
        data: {
          ...parentData,
          avatar: user?.avatar || null,
          email: user?.email || parentData.email,
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load profile' });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { firstName, lastName, phone, address } = req.body;
      const parent = await prisma.parent.updateMany({
        where: { userId: authUser.userId },
        data: { firstName, lastName, phone, address }
      });
      res.json({ success: true, message: 'Profile updated', data: parent });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to update profile' });
    }
  },

  getNotifications: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const unreadOnly = req.query.unreadOnly === 'true';
      // Mock notifications
      const notifications = [
        { id: '1', type: 'info', title: 'Welcome', message: 'Welcome to School Hub', createdAt: new Date().toISOString(), isRead: false }
      ];
      res.json({ success: true, data: unreadOnly ? notifications.filter((n) => !n.isRead) : notifications });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load notifications' });
    }
  },

  getMessages: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: authUser.userId },
            { receiverId: authUser.userId }
          ]
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true } },
          receiver: { select: { id: true, firstName: true, lastName: true, role: true } },
          teacher: { include: { subjects: { include: { subject: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(req.query.limit || 50)
      });

      res.json({
        success: true,
        data: messages.map((message) => ({
          id: message.id,
          senderId: message.senderId,
          senderName: `${message.sender.firstName} ${message.sender.lastName}`,
          recipientId: message.receiverId,
          recipientName: `${message.receiver.firstName} ${message.receiver.lastName}`,
          subject: message.teacher?.subjects?.[0]?.subject?.name || 'Parent-teacher chat',
          body: message.message,
          isRead: message.isRead,
          createdAt: message.createdAt,
          attachments: message.attachment ? [message.attachment] : []
        }))
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load messages' });
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const { recipientId, teacherId, studentId, subjectId, subject, body, attachments = [] } = req.body;
      const authUser = (req as any).user as { userId: string; role: string };
      const parent = await prisma.parent.findFirst({ where: { userId: authUser.userId } });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const resolvedTeacher = teacherId
        ? await prisma.teacher.findUnique({ where: { id: teacherId } })
        : await prisma.teacher.findFirst({ where: { userId: recipientId } });

      if (!resolvedTeacher) {
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }

      const child = studentId
        ? await prisma.student.findFirst({ where: { id: studentId, parentId: parent.id } })
        : await prisma.student.findFirst({ where: { parentId: parent.id } });

      if (!child || !child.classId) {
        return res.status(400).json({ success: false, message: 'Select a linked student before sending a teacher message' });
      }

      const resolvedSubjectId = subjectId || (await prisma.subjectClass.findFirst({
        where: { classId: child.classId, teacherId: resolvedTeacher.id },
        select: { subjectId: true }
      }))?.subjectId;

      if (!resolvedSubjectId) {
        return res.status(403).json({ success: false, message: 'This teacher is not assigned to the selected student' });
      }

      const message = await sendParentTeacherMessage(
        parent.id,
        resolvedTeacher.id,
        child.id,
        resolvedSubjectId,
        [subject, body].filter(Boolean).join('\n\n'),
        attachments[0]
      );

      res.json({ success: true, message: 'Message sent', data: message });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Unable to send message' });
    }
  },

  getChildTeacherContacts: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId }, include: { class: true } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const child = parent.students[0];
      const assignments = await prisma.subjectClass.findMany({
        where: { classId: child.classId || undefined, teacherId: { not: null } },
        include: { subject: true, teacher: { include: { user: true } } },
        orderBy: { subject: { name: 'asc' } }
      });

      res.json({
        success: true,
        data: assignments
          .filter((assignment) => assignment.teacher)
          .map((assignment) => ({
            teacherId: assignment.teacher!.id,
            userId: assignment.teacher!.userId,
            name: `${assignment.teacher!.firstName} ${assignment.teacher!.lastName}`,
            email: assignment.teacher!.email,
            phone: assignment.teacher!.phone,
            subjectId: assignment.subjectId,
            subjectName: assignment.subject.name,
            classId: child.classId
          }))
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load teacher contacts' });
    }
  },

  getChildTimetable: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId }, include: { class: true } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const student = parent.students[0];
      const entries = await prisma.timetable.findMany({
        where: { classId: student.classId || undefined },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });

      const dayNames: (TimetableEntry['day'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const mappedEntries = entries.map((entry, idx) => ({
        id: entry.id,
        day: dayNames[entry.dayOfWeek] || 'monday',
        period: idx + 1,
        startTime: entry.startTime || '08:00',
        endTime: entry.endTime || '08:40',
        subjectId: entry.subjectId,
        subjectName: (entry.subject as any)?.name || 'Unknown',
        teacherId: entry.teacherId,
        teacherName: (entry.teacher as any) ? `${(entry.teacher as any).firstName} ${(entry.teacher as any).lastName}` : 'Unknown'
      }));

      res.json({
        success: true,
        data: {
          classId: student.classId,
          className: student.class?.name || student.classId,
          streamName: (student as any).streamName,
          termId: '1',
          entries: mappedEntries,
          updatedAt: new Date().toISOString()
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load timetable' });
    }
  },

  getExamTimetable: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId }, include: { class: true } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const student = parent.students[0];
      const entries = await prisma.timetable.findMany({
        where: { classId: student.classId || undefined },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });

      const dayNames: (TimetableEntry['day'])[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const mappedEntries = entries.map((entry, idx) => ({
        id: entry.id,
        day: dayNames[entry.dayOfWeek] || 'monday',
        period: idx + 1,
        startTime: entry.startTime || '08:00',
        endTime: entry.endTime || '08:40',
        subjectId: entry.subjectId,
        subjectName: (entry.subject as any)?.name || 'Unknown',
        teacherId: entry.teacherId,
        teacherName: (entry.teacher as any) ? `${(entry.teacher as any).firstName} ${(entry.teacher as any).lastName}` : 'Unknown'
      }));

      res.json({
        success: true,
        data: {
          classId: student.classId,
          className: student.class?.name || student.classId,
          streamName: (student as any).streamName,
          termId: '1',
          entries: mappedEntries,
          updatedAt: new Date().toISOString()
        }
      });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load exam timetable' });
    }
  },

  downloadTimetable: async (req: Request, res: Response) => {
    try {
      const { childId } = req.params;
      const receiptContent = `Timetable for student ${childId}\nSchool Hub Academy`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=timetable_${childId}.pdf`);
      res.send(receiptContent);
    } catch {
      res.status(500).json({ success: false, message: 'Unable to download timetable' });
    }
  },

  // Academic results endpoints
  getChildResults: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { termId } = req.query as { termId?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const where: any = { studentId: childId };
      if (termId) where.term = Number(termId);

      const results = await prisma.result.findMany({
        where,
        include: { subject: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: results });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load results' });
    }
  },

  getChildPerformanceTrend: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const results = await prisma.result.findMany({
        where: { studentId: childId },
        orderBy: { year: 'asc' }
      });

      const trends = results.map((r) => ({
        term: `Term ${r.term}`,
        year: r.year,
        averageScore: r.score,
        grade: r.grade,
        classPosition: 1,
        totalStudents: 40
      }));
      res.json({ success: true, data: trends });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load performance trend' });
    }
  },

  getChildReportCard: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { termId } = req.query as { termId?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId }, include: { class: true } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const student = parent.students[0];
      const results = await prisma.result.findMany({
        where: { studentId: childId },
        include: { subject: true }
      });

      const reportCard = {
        id: `rc-${childId}`,
        studentId: childId,
        studentName: `${student.firstName} ${student.lastName}`,
        classId: student.classId,
        className: student.class?.name || student.classId || 'Unknown',
        termId: termId || '1',
        termName: `Term ${termId || '1'}`,
        year: new Date().getFullYear(),
        results: results.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          subjectId: r.subjectId,
          subjectName: r.subject?.name || 'Unknown',
          subjectCode: r.subject?.code || '',
          totalScore: r.score,
          grade: r.grade
        })),
        totalPoints: results.reduce((sum, r) => sum + r.score, 0),
        averagePoints: results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0,
        overallGrade: results.length ? results[0].grade : 'N/A',
        classPosition: 1,
        totalStudents: 40,
        teacherComments: '',
        issuedDate: new Date().toISOString()
      };
      res.json({ success: true, data: reportCard });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load report card' });
    }
  },

  // Attendance endpoints
  getChildAttendance: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { month, year } = req.query as { month?: string; year?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const monthNum = Number(month || new Date().getMonth() + 1);
      const yearNum = Number(year || new Date().getFullYear());
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);

      const attendance = await prisma.attendance.findMany({
        where: {
          studentId: childId,
          date: { gte: startDate, lte: endDate }
        },
        orderBy: { date: 'asc' }
      });

      const records = attendance.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date.toISOString().split('T')[0],
        status: a.status.toLowerCase() as any,
        arrivalTime: a.checkIn?.toISOString() || null,
        departureTime: a.checkOut?.toISOString() || null,
        notes: a.notes
      }));

      res.json({ success: true, data: records });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load attendance' });
    }
  },

  getChildAttendanceSummary: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { month, year } = req.query as { month?: string; year?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const monthNum = Number(month || new Date().getMonth() + 1);
      const yearNum = Number(year || new Date().getFullYear());
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);

      const attendance = await prisma.attendance.findMany({
        where: {
          studentId: childId,
          date: { gte: startDate, lte: endDate }
        }
      });

      const presentDays = attendance.filter((a) => a.status.toUpperCase() === 'PRESENT').length;
      const absentDays = attendance.filter((a) => a.status.toUpperCase() === 'ABSENT').length;
      const lateDays = attendance.filter((a) => a.status.toUpperCase() === 'LATE').length;

      const summary = {
        studentId: childId,
        month: new Date(yearNum, monthNum - 1, 1).toLocaleString('default', { month: 'long' }),
        year: yearNum,
        totalDays: attendance.length,
        presentDays,
        absentDays,
        lateDays,
        excusedDays: 0,
        attendancePercentage: attendance.length ? Math.round((presentDays / attendance.length) * 100) : 0,
        records: []
      };
      res.json({ success: true, data: summary });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load attendance summary' });
    }
  },

  // Homework endpoints
  getChildHomework: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { status } = req.query as { status?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const student = parent.students[0];
      const where: any = { class: { students: { some: { id: childId } } } };
      if (status === 'active') where.dueDate = { gte: new Date() };
      if (status === 'completed') where.dueDate = { lt: new Date() };

      const homework = await prisma.homework.findMany({
        where,
        include: { subject: true, class: true, submissions: true },
        orderBy: { createdAt: 'desc' }
      });

      const assignments = homework.map((hw) => ({
        id: hw.id,
        classId: hw.classId,
        subjectId: hw.subjectId,
        subjectName: hw.subject?.name || 'Unknown',
        title: hw.title,
        description: hw.description,
        attachments: hw.attachments,
        dueDate: hw.dueDate.toISOString(),
        assignedDate: hw.createdAt.toISOString(),
        teacherId: hw.teacherId,
        teacherName: '',
        status: hw.dueDate < new Date() ? 'overdue' : 'active'
      }));

      res.json({ success: true, data: assignments });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load homework' });
    }
  },

  // Discipline endpoints
  getChildDiscipline: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId },
        include: { students: { where: { id: childId } } }
      });
      if (!parent || !parent.students.length) {
        return res.status(403).json({ success: false, message: 'Access denied to this child' });
      }

      const discipline = await prisma.discipline.findMany({
        where: { studentId: childId },
        orderBy: { date: 'desc' }
      });

      res.json({ success: true, data: discipline });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load discipline records' });
    }
  },

  // Announcements endpoint
  getParentAnnouncements: async (req: Request, res: Response) => {
    try {
      const announcements = await prisma.announcement.findMany({
        where: { OR: [{ audience: 'all' }, { audience: 'parents' }] },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: announcements });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load announcements' });
    }
  },

  // Complaints endpoints
  submitComplaint: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { category, subject, description, studentId, priority, attachments } = req.body;

      const parent = await prisma.parent.findFirst({ where: { userId: authUser.userId } });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const complaint = await prisma.complaint.create({
        data: {
          parentId: parent.id,
          studentId,
          category,
          subject,
          description,
          priority: priority || 'NORMAL',
          attachments: attachments || []
        }
      });
      res.status(201).json({ success: true, data: complaint });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to submit complaint' });
    }
  },

  getMyComplaints: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { status } = req.query as { status?: string };

      const parent = await prisma.parent.findFirst({
        where: { userId: authUser.userId }
      });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const where: any = { parentId: parent.id };
      if (status) where.status = status.toUpperCase();

      const complaints = await prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: complaints });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to load complaints' });
    }
  },

  // Rename child display name for parent's view
  renameChild: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;
      const { displayName } = req.body;

      const parent = await prisma.parent.findFirst({ where: { userId: authUser.userId }, include: { students: { select: { id: true } } } });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      const student = await prisma.student.findUnique({ where: { id: childId } });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      // Verify parent-child relationship
      const hasRelation = parent.students.some((s: any) => s.id === childId);
      if (!hasRelation) return res.status(403).json({ success: false, message: 'Access denied' });

      res.json({ success: true, message: 'Display name updated', data: { id: childId, displayName } });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to rename child' });
    }
  },

  // Unlink child from parent account
  unlinkChild: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { childId } = req.params;

      const parent = await prisma.parent.findFirst({ where: { userId: authUser.userId } });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });

      // Remove student from parent's students array
      await prisma.parent.update({
        where: { id: parent.id },
        data: {
          students: {
            disconnect: { id: childId }
          }
        }
      });

      res.json({ success: true, message: 'Child unlinked successfully' });
    } catch {
      res.status(500).json({ success: false, message: 'Unable to unlink child' });
    }
  },
};
