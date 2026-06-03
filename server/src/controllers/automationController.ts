/**
 * Automation Controller
 * 
 * Exposes all automation flows via REST API endpoints
 * COMPLETE VERSION - All endpoints included
 */

import { Request, Response } from 'express';
import { automationService } from '../services/automationService.js';
import { hasFullAccess } from '../utils/accessControl.js';
import { Role } from '@prisma/client';

export const automationController = {
  // ==================== FLOW 1: Parent Registration & Auto-Assignment ====================
  
  registerStudent: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const schoolId = req.body.schoolId || req.query.schoolId;
      
      if (!schoolId && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'School ID required or admin access needed' });
      }

      const { studentData, parentData, config } = req.body;
      
      if (!studentData || !parentData) {
        return res.status(400).json({ message: 'Student and parent data required' });
      }

      const result = await automationService.registerStudentWithAutoAssignment(
        schoolId,
        studentData,
        parentData,
        config
      );

      res.status(201).json({
        message: 'Student registered successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Automation error:', error);
      res.status(500).json({ message: error.message || 'Registration failed' });
    }
  },

  // ==================== FLOW 2: Parent-Teacher Messaging ====================
  
  sendMessageToTeacher: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.PARENT) {
        return res.status(403).json({ message: 'Only parents can use this endpoint' });
      }

      const { parentId, teacherId, studentId, subjectId, message, attachment } = req.body;
      
      if (!parentId || !teacherId || !studentId || !subjectId || !message) {
        return res.status(400).json({ message: 'All fields required' });
      }

      const result = await automationService.sendParentTeacherMessage(
        parentId,
        teacherId,
        studentId,
        subjectId,
        message,
        attachment
      );

      res.json({ message: 'Message sent successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to send message' });
    }
  },

  // 2.1 Teacher Reply to Parent
  teacherReplyToParent: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Only teachers can reply' });
      }

      const { teacherId, parentId, studentId, message, attachment, originalMessageId } = req.body;
      
      if (!teacherId || !parentId || !studentId || !message) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      const result = await automationService.teacherReplyToParent(
        teacherId,
        parentId,
        studentId,
        message,
        attachment,
        originalMessageId
      );

      res.json({ message: 'Reply sent successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to send reply' });
    }
  },

  // 2.2 Get Chat Messages between Parent and Teacher
  getChatMessages: async (req: Request, res: Response) => {
    try {
      const { parentId, teacherId, studentId } = req.params;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!parentId || !teacherId || !studentId) {
        return res.status(400).json({ message: 'Parent ID, Teacher ID, and Student ID required' });
      }

      const messages = await automationService.getChatMessages(
        parentId,
        teacherId,
        studentId,
        authUser.userId,
        authUser.role
      );
      
      res.json({ messages, count: messages.length });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch messages' });
    }
  },

  // 2.3 Mark Message as Read
  markMessageAsRead: async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!messageId) {
        return res.status(400).json({ message: 'Message ID required' });
      }

      const result = await automationService.markMessageAsRead(messageId, authUser.userId);
      
      res.json({ message: 'Message marked as read', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark message as read' });
    }
  },

  // 2.4 Get Unread Message Count
  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      const count = await automationService.getUnreadMessageCount(authUser.userId, authUser.role);
      
      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get unread count' });
    }
  },

  // 2.5 Get All Conversations for a User
  getConversations: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      const conversations = await automationService.getUserConversations(authUser.userId, authUser.role);
      
      res.json({ conversations });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch conversations' });
    }
  },

  // ==================== FLOW 3: Attendance → Parent Notification ====================
  
  markAttendance: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Only teachers can mark attendance' });
      }

      const { classId, teacherId, attendanceData, date } = req.body;
      
      if (!classId || !teacherId || !attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({ message: 'Valid attendance data required' });
      }

      const result = await automationService.markAttendanceAndNotify(
        classId,
        teacherId,
        attendanceData,
        date ? new Date(date) : undefined
      );

      res.json({ message: 'Attendance marked and parents notified', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark attendance' });
    }
  },

  // 3.1 Get Attendance for a Student
  getStudentAttendance: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID required' });
      }

      const attendance = await automationService.getStudentAttendance(
        studentId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({ attendance });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch attendance' });
    }
  },

  // 3.2 Get Class Attendance Summary
  getClassAttendanceSummary: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;
      
      if (!classId) {
        return res.status(400).json({ message: 'Class ID required' });
      }

      const summary = await automationService.getClassAttendanceSummary(
        classId,
        date ? new Date(date as string) : new Date()
      );
      
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch attendance summary' });
    }
  },

  // ==================== FLOW 4: Grade Entry → Parent Visibility ====================
  
  publishGrades: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Only teachers can publish grades' });
      }

      const { teacherId, subjectId, classId, examType, gradesData, term, year } = req.body;
      
      if (!teacherId || !subjectId || !classId || !examType || !gradesData || !term || !year) {
        return res.status(400).json({ message: 'All fields required' });
      }

      const result = await automationService.publishGradesAndNotify(
        teacherId,
        subjectId,
        classId,
        examType,
        gradesData,
        term,
        year
      );

      res.json({ message: 'Grades published and parents notified', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to publish grades' });
    }
  },

  // 4.1 Get Student Results
  getStudentResults: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { term, year, subjectId } = req.query;
      
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID required' });
      }

      const results = await automationService.getStudentResults(
        studentId,
        term ? parseInt(term as string) : undefined,
        year ? parseInt(year as string) : undefined,
        subjectId as string
      );
      
      res.json({ results });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch results' });
    }
  },

  // 4.2 Get Class Results Summary
  getClassResultsSummary: async (req: Request, res: Response) => {
    try {
      const { classId, subjectId } = req.params;
      const { examType, term, year } = req.query;
      
      if (!classId || !subjectId) {
        return res.status(400).json({ message: 'Class ID and Subject ID required' });
      }

      const summary = await automationService.getClassResultsSummary(
        classId,
        subjectId,
        examType as any,
        term ? parseInt(term as string) : undefined,
        year ? parseInt(year as string) : undefined
      );
      
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch class results' });
    }
  },

  // ==================== FLOW 5: Fee Payment → Multi-System Update ====================
  
  processPayment: async (req: Request, res: Response) => {
    try {
      const { studentId, parentId, amount, method, transactionId, mpesaReceipt } = req.body;
      
      if (!studentId || !parentId || !amount || !method) {
        return res.status(400).json({ message: 'All payment fields required' });
      }

      const result = await automationService.processFeePayment(
        studentId,
        parentId,
        amount,
        method,
        transactionId,
        mpesaReceipt
      );

      res.json({ message: 'Payment processed successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Payment processing failed' });
    }
  },

  getFeeBalance: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const balance = await automationService.getStudentFeeBalance(studentId);
      res.json({ studentId, balance });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get balance' });
    }
  },

  // 5.1 Get Student Payment History
  getPaymentHistory: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({ message: 'Student ID required' });
      }

      const payments = await automationService.getStudentPaymentHistory(studentId);
      
      res.json({ payments });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch payment history' });
    }
  },

  // 5.2 Generate Payment Receipt PDF
  generateReceipt: async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        return res.status(400).json({ message: 'Payment ID required' });
      }

      const pdfBuffer = await automationService.generateReceiptPDF(paymentId);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt_${paymentId}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate receipt' });
    }
  },

  // ==================== FLOW 6: Stock Request → Store Keeper Fulfillment ====================
  
  createStockRequest: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Only teachers can request stock' });
      }

      const { teacherId, itemId, quantity, purpose } = req.body;
      
      if (!teacherId || !itemId || !quantity || !purpose) {
        return res.status(400).json({ message: 'All fields required' });
      }

      const result = await automationService.createStockRequest(
        teacherId,
        itemId,
        quantity,
        purpose
      );

      res.status(201).json({ message: 'Stock request created', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create request' });
    }
  },

  approveStockRequest: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.STORE_KEEPER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Store keeper access required' });
      }

      const { requestId } = req.params;
      const { approvedBy } = req.body;
      
      if (!approvedBy) {
        return res.status(400).json({ message: 'Approver ID required' });
      }

      const result = await automationService.approveStockRequest(requestId, approvedBy);
      res.json({ message: 'Stock request approved', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to approve request' });
    }
  },

  // 6.1 Get All Stock Requests
  getStockRequests: async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const authUser = (req as any).user as { userId: string; role: string };
      
      const requests = await automationService.getStockRequests(
        status as any,
        authUser.userId,
        authUser.role
      );
      
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch stock requests' });
    }
  },

  // 6.2 Get Low Stock Items
  getLowStockItems: async (req: Request, res: Response) => {
    try {
      const items = await automationService.getLowStockItems();
      res.json({ items });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch low stock items' });
    }
  },

  // ==================== FLOW 7: Admin Adds Teacher → Auto Assignment ====================
  
  addTeacher: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role) && authUser?.role !== Role.PRINCIPAL) {
        return res.status(403).json({ message: 'Admin or Principal access required' });
      }

      const { schoolId, teacherData, config } = req.body;
      
      if (!schoolId || !teacherData) {
        return res.status(400).json({ message: 'School ID and teacher data required' });
      }

      const result = await automationService.addTeacherWithAutoAssignment(
        schoolId,
        teacherData,
        config
      );

      res.status(201).json({
        message: 'Teacher added and auto-assigned successfully',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to add teacher' });
    }
  },

  // 7.1 Get All Teachers
  getAllTeachers: async (req: Request, res: Response) => {
    try {
      const { schoolId, subject } = req.query;
      
      const teachers = await automationService.getAllTeachers(
        schoolId as string,
        subject as string
      );
      
      res.json({ teachers });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch teachers' });
    }
  },

  // 7.2 Get Teacher's Assigned Classes
  getTeacherClasses: async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      
      if (!teacherId) {
        return res.status(400).json({ message: 'Teacher ID required' });
      }

      const classes = await automationService.getTeacherAssignedClasses(teacherId);
      
      res.json({ classes });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch teacher classes' });
    }
  },

  // ==================== FLOW 8: Parent Meeting Request → Auto Schedule ====================
  
  requestMeeting: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.PARENT) {
        return res.status(403).json({ message: 'Only parents can request meetings' });
      }

      const { parentId, teacherId, studentId, subject, preferredDateTime, description, meetingType } = req.body;
      
      if (!parentId || !teacherId || !studentId || !subject || !preferredDateTime) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      const result = await automationService.requestParentTeacherMeeting(
        parentId,
        teacherId,
        studentId,
        subject,
        new Date(preferredDateTime),
        description,
        meetingType
      );

      res.status(201).json({ message: 'Meeting scheduled successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to schedule meeting' });
    }
  },

  // 8.1 Get Meetings for User
  getMyMeetings: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { status, startDate, endDate } = req.query;
      
      const meetings = await automationService.getUserMeetings(
        authUser.userId,
        authUser.role,
        status as any,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json({ meetings });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch meetings' });
    }
  },

  // 8.2 Cancel Meeting
  cancelMeeting: async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.params;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!meetingId) {
        return res.status(400).json({ message: 'Meeting ID required' });
      }

      const result = await automationService.cancelMeeting(meetingId, authUser.userId, authUser.role);
      
      res.json({ message: 'Meeting cancelled', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to cancel meeting' });
    }
  },

  // 8.3 Update Meeting Status
  updateMeetingStatus: async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.params;
      const { status, notes } = req.body;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!meetingId || !status) {
        return res.status(400).json({ message: 'Meeting ID and status required' });
      }

      const result = await automationService.updateMeetingStatus(
        meetingId,
        status,
        notes,
        authUser.userId,
        authUser.role
      );
      
      res.json({ message: 'Meeting status updated', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update meeting status' });
    }
  },

  // ==================== FLOW 9: Online Class Automation ====================
  
  joinOnlineClass: async (req: Request, res: Response) => {
    try {
      const { studentId, classId, subjectId } = req.body;
      
      if (!studentId || !classId || !subjectId) {
        return res.status(400).json({ message: 'Student, class, and subject required' });
      }

      const result = await automationService.joinOnlineClass(
        studentId,
        classId,
        subjectId
      );

      res.json({ message: 'Joined online class successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to join class' });
    }
  },

  // 9.1 Start Live Class
  startLiveClass: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER && !hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Only teachers can start live classes' });
      }

      const { teacherId, classId, subjectId, title } = req.body;
      
      if (!teacherId || !classId || !subjectId) {
        return res.status(400).json({ message: 'Teacher, class, and subject required' });
      }

      const result = await automationService.startLiveClass(
        teacherId,
        classId,
        subjectId,
        title
      );

      res.json({ message: 'Live class started', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to start live class' });
    }
  },

  // 9.2 End Live Class
  endLiveClass: async (req: Request, res: Response) => {
    try {
      const { classSessionId } = req.params;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!classSessionId) {
        return res.status(400).json({ message: 'Class session ID required' });
      }

      const result = await automationService.endLiveClass(classSessionId, authUser.userId);
      
      res.json({ message: 'Live class ended', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to end live class' });
    }
  },

  // 9.3 Get Active Live Classes
  getActiveLiveClasses: async (req: Request, res: Response) => {
    try {
      const { classId, subjectId } = req.query;
      
      const classes = await automationService.getActiveLiveClasses(
        classId as string,
        subjectId as string
      );
      
      res.json({ classes });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch live classes' });
    }
  },

  // ==================== FLOW 10: End of Term Auto-Processing ====================
  
  processEndOfTerm: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role) && authUser?.role !== Role.PRINCIPAL) {
        return res.status(403).json({ message: 'Admin or Principal access required' });
      }

      const { schoolId, term, year, options } = req.body;
      
      if (!schoolId || !term || !year) {
        return res.status(400).json({ message: 'School ID, term, and year required' });
      }

      const result = await automationService.processEndOfTerm(schoolId, term, year, options);

      res.json({ message: 'End of term processing complete', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'End of term processing failed' });
    }
  },

  // 10.1 Generate Report Card (Single Student)
  generateReportCard: async (req: Request, res: Response) => {
    try {
      const { studentId, term, year } = req.params;
      
      if (!studentId || !term || !year) {
        return res.status(400).json({ message: 'Student ID, term, and year required' });
      }

      const pdfBuffer = await automationService.generateSingleReportCard(
        studentId,
        parseInt(term),
        parseInt(year)
      );
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report_card_${studentId}_${term}_${year}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate report card' });
    }
  },

  // 10.2 Generate Bulk Report Cards (Class)
  generateBulkReportCards: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role) && authUser?.role !== Role.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { classId, term, year } = req.body;
      
      if (!classId || !term || !year) {
        return res.status(400).json({ message: 'Class ID, term, and year required' });
      }

      const zipBuffer = await automationService.generateBulkReportCards(
        classId,
        term,
        year
      );
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=report_cards_class_${classId}_term_${term}.zip`);
      res.send(zipBuffer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate bulk report cards' });
    }
  },

  // ==================== DATA MIGRATION ====================
  
  bulkImportStudents: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role) && authUser?.role !== Role.PRINCIPAL) {
        return res.status(403).json({ message: 'Admin or Principal access required' });
      }

      const { schoolId, studentsData, options } = req.body;
      
      if (!schoolId || !studentsData || !Array.isArray(studentsData)) {
        return res.status(400).json({ message: 'School ID and students data required' });
      }

      const result = await automationService.bulkImportStudents(schoolId, studentsData, options);

      res.json({
        message: 'Bulk import completed',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Bulk import failed' });
    }
  },

  parentSelfClaim: async (req: Request, res: Response) => {
    try {
      const { parentData, studentIdentifier } = req.body;
      
      if (!parentData || !studentIdentifier) {
        return res.status(400).json({ message: 'Parent data and student identifier required' });
      }

      const result = await automationService.parentSelfClaimStudent(parentData, studentIdentifier);

      res.json({ message: 'Student claimed successfully', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to claim student' });
    }
  },

  // ==================== NOTIFICATION MANAGEMENT ====================
  
  sendManualNotification: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { userId, title, message, type, channels, link } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ message: 'User ID, title, and message required' });
      }

      const result = await automationService.sendManualNotification(
        userId,
        { title, message, type, channels, link }
      );

      res.json({ message: 'Notification sent', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to send notification' });
    }
  },

  getUserNotifications: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      const { limit, offset, unreadOnly } = req.query;
      
      const notifications = await automationService.getUserNotifications(
        authUser.userId,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0,
        unreadOnly === 'true'
      );
      
      res.json({ notifications });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
    }
  },

  markNotificationAsRead: async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!notificationId) {
        return res.status(400).json({ message: 'Notification ID required' });
      }

      const result = await automationService.markNotificationAsRead(notificationId, authUser.userId);
      
      res.json({ message: 'Notification marked as read', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to mark notification as read' });
    }
  },

  // ==================== DASHBOARD STATS ====================
  
  getParentDashboardStats: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.PARENT) {
        return res.status(403).json({ message: 'Parent access required' });
      }

      const { parentId } = req.params;
      
      const stats = await automationService.getParentDashboardStats(parentId);
      
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch dashboard stats' });
    }
  },

  getTeacherDashboardStats: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (authUser?.role !== Role.TEACHER) {
        return res.status(403).json({ message: 'Teacher access required' });
      }

      const { teacherId } = req.params;
      
      const stats = await automationService.getTeacherDashboardStats(teacherId);
      
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch dashboard stats' });
    }
  },

  getAdminDashboardStats: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { schoolId } = req.params;
      
      const stats = await automationService.getAdminDashboardStats(schoolId);
      
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to fetch dashboard stats' });
    }
  },

  // ==================== WHATSAPP MANAGEMENT ====================
  
  syncWhatsAppGroup: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { classId, groupId } = req.body;
      
      if (!classId || !groupId) {
        return res.status(400).json({ message: 'Class ID and Group ID required' });
      }

      const result = await automationService.syncWhatsAppGroup(classId, groupId);
      
      res.json({ message: 'WhatsApp group synced', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to sync WhatsApp group' });
    }
  },

  sendWhatsAppBroadcast: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      
      if (!hasFullAccess(authUser?.role)) {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const { classId, message, attachment } = req.body;
      
      if (!classId || !message) {
        return res.status(400).json({ message: 'Class ID and message required' });
      }

      const result = await automationService.sendWhatsAppBroadcast(classId, message, attachment);
      
      res.json({ message: 'WhatsApp broadcast sent', data: result });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to send WhatsApp broadcast' });
    }
  }
};
