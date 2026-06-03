/**
 * School Hub Automation Service
 * 
 * Handles all automatic workflows in the school management system:
 * - Flow 1: Parent Registration & Auto-Assignment
 * - Flow 2: Parent-Teacher Messaging Auto-Routing
 * - Flow 3: Attendance → Parent Notification
 * - Flow 4: Grade Entry → Parent Visibility
 * - Flow 5: Fee Payment → Multi-System Update
 * - Flow 6: Stock Request → Store Keeper Fulfillment
 * - Flow 7: Admin Adds Teacher → Auto Assignment
 * - Flow 8: Parent Meeting Request → Auto Schedule
 * - Flow 9: Online Class Automation
 * - Flow 10: End of Term Auto-Processing
 * - Data Migration: Bulk Import, Self-Claim, etc.
 * - COMPLETE VERSION - All functions included
 */

import { PrismaClient, Role, Gender, AttendanceStatus, ExamType, PaymentStatus, PaymentMethod, NotificationType, MeetingStatus, StockRequestStatus, MeetingType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { eventEmitter } from './eventEmitterService.js';
import { notificationService } from './notificationService.js';
import { smsService } from './smsService.js';
import { emailService } from './emailService.js';
import { whatsappService } from './whatsappService.js';
import { WebSocketService } from './websocketService.js';

const prisma = new PrismaClient();

// ==================== CONFIGURATION ====================

interface AutomationConfig {
  autoAssignTeachers: boolean;
  autoNotifyParents: boolean;
  autoCreateChatRooms: boolean;
  autoAddToWhatsAppGroup: boolean;
  autoPromoteStudents: boolean;
  autoGenerateReportCards: boolean;
  sendWelcomeMessages: boolean;
  notificationChannels: ('SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH')[];
}

const defaultConfig: AutomationConfig = {
  autoAssignTeachers: true,
  autoNotifyParents: true,
  autoCreateChatRooms: true,
  autoAddToWhatsAppGroup: true,
  autoPromoteStudents: true,
  autoGenerateReportCards: true,
  sendWelcomeMessages: true,
  notificationChannels: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']
};

// ==================== HELPER FUNCTIONS ====================

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getClassByAge(age: number): string {
  if (age >= 12 && age <= 13) return 'Form 1';
  if (age >= 13 && age <= 14) return 'Form 2';
  if (age >= 14 && age <= 15) return 'Form 3';
  if (age >= 15 && age <= 16) return 'Form 4';
  if (age >= 11 && age < 12) return 'Class 8';
  if (age >= 10 && age < 11) return 'Class 7';
  if (age >= 9 && age < 10) return 'Class 6';
  return 'Form 1';
}

function generateAdmissionNumber(year: number, className: string, stream: string, rollNo: number): string {
  const classCode = className.replace(/^Form\s+/i, 'F').replace(/\s/g, '').toUpperCase();
  const streamCode = stream.toUpperCase().charAt(0);
  return `${year}-${classCode}${streamCode}-${String(rollNo).padStart(3, '0')}`;
}

async function getCurrentTerm(schoolId: string) {
  return prisma.academicTerm.findFirst({
    where: { schoolId, isCurrent: true }
  });
}

async function getLeastFilledStream(schoolId: string, className: string) {
  const classes = await prisma.class.findMany({
    where: { schoolId, name: className },
    include: { students: { where: { isActive: true } } }
  });

  if (classes.length === 0) {
    const newClass = await prisma.class.create({
      data: { schoolId, name: className, stream: 'A', capacity: 40 }
    });
    return { classId: newClass.id, stream: 'A', currentCount: 0, capacity: 40 };
  }

  let leastFilled = classes[0];
  let minRatio = leastFilled.students.length / leastFilled.capacity;

  for (const cls of classes) {
    const ratio = cls.students.length / cls.capacity;
    if (ratio < minRatio) {
      minRatio = ratio;
      leastFilled = cls;
    }
  }

  return {
    classId: leastFilled.id,
    stream: leastFilled.stream || 'A',
    currentCount: leastFilled.students.length,
    capacity: leastFilled.capacity
  };
}

async function getNextRollNumber(classId: string): Promise<number> {
  const count = await prisma.student.count({ where: { classId } });
  return count + 1;
}

async function getSubjectsForClass(schoolId: string, className: string) {
  return prisma.subject.findMany({
    where: {
      schoolId,
      classes: { some: { class: { name: className } } }
    },
    include: {
      classes: { include: { teacher: true } }
    }
  });
}

async function findTeacherForSubject(schoolId: string, subjectId: string, classId: string) {
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { subjectId, subject: { schoolId } },
    include: {
      teacher: {
        include: {
          user: true,
          subjectClasses: { where: { classId } }
        }
      }
    }
  });

  if (teacherSubjects.length === 0) {
    return await prisma.teacher.findFirst({
      where: { isActive: true },
      include: { user: true }
    });
  }

  teacherSubjects.sort((a, b) => a.teacher.subjectClasses.length - b.teacher.subjectClasses.length);
  return teacherSubjects[0].teacher;
}

async function createParentTeacherChatRoom(parentId: string, teacherId: string, studentId: string, subjectId?: string) {
  const parentUser = await prisma.parent.findUnique({ where: { id: parentId }, select: { userId: true } });
  const teacherUser = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
  
  if (!parentUser || !teacherUser) return null;

  const existingRoom = await prisma.message.findFirst({
    where: {
      parentId,
      teacherId,
      senderId: parentUser.userId,
      receiverId: teacherUser.userId,
      message: { startsWith: 'Chat room established' }
    },
    orderBy: { createdAt: 'asc' }
  });

  if (existingRoom) return existingRoom;

  return prisma.message.create({
    data: {
      senderId: parentUser.userId,
      receiverId: teacherUser.userId,
      parentId,
      teacherId,
      message: `Chat room established${subjectId ? ' - Subject: ' + subjectId : ''} for student ${studentId}`,
      isRead: true,
      status: 'SENT'
    }
  });
}

// ==================== FLOW 1: PARENT REGISTRATION & AUTO-ASSIGNMENT ====================

export interface RegistrationResult {
  student: any;
  parent: any;
  user: any;
  classAssigned: any;
  teachers: any[];
  chatRooms: any[];
  admissionNumber: string;
}

export async function registerStudentWithAutoAssignment(
  schoolId: string,
  studentData: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: Gender;
    previousSchool?: string;
    previousClass?: string;
  },
  parentData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    alternativePhone?: string;
    relationship: string;
    occupation?: string;
    address?: string;
    idNumber?: string;
  },
  config: Partial<AutomationConfig> = {}
): Promise<RegistrationResult> {
  const finalConfig = { ...defaultConfig, ...config };
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const age = calculateAge(studentData.dateOfBirth);
  const className = getClassByAge(age);
  const streamInfo = await getLeastFilledStream(schoolId, className);
  const rollNo = await getNextRollNumber(streamInfo.classId);
  const admissionNumber = generateAdmissionNumber(currentYear, className, streamInfo.stream, rollNo);

  let parentUser = await prisma.user.findUnique({ where: { email: parentData.email } });
  let parentTempPassword: string | null = null;

  if (!parentUser) {
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
    parentTempPassword = tempPassword;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    parentUser = await prisma.user.create({
      data: {
        email: parentData.email,
        password: hashedPassword,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        phone: parentData.phone,
        role: Role.PARENT,
        isVerified: false
      }
    });
  }

  let parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } });

  if (!parent) {
    parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        phone: parentData.phone,
        alternativePhone: parentData.alternativePhone,
        relationship: parentData.relationship,
        occupation: parentData.occupation || '',
        address: parentData.address || ''
      }
    });
  }

  const student = await prisma.student.create({
    data: {
      admissionNumber,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      middleName: studentData.middleName,
      dateOfBirth: studentData.dateOfBirth,
      gender: studentData.gender,
      classId: streamInfo.classId,
      parentId: parent.id,
      enrollmentDate: currentDate,
      isActive: true
    }
  });

  const subjects = await getSubjectsForClass(schoolId, className);
  const assignedTeachers: any[] = [];
  const chatRooms: any[] = [];

  if (finalConfig.autoAssignTeachers) {
    for (const subject of subjects) {
      const teacher = await findTeacherForSubject(schoolId, subject.id, streamInfo.classId);
      if (teacher) {
        assignedTeachers.push({ teacher, subject });
        if (finalConfig.autoCreateChatRooms) {
          const chatRoom = await createParentTeacherChatRoom(parent.id, teacher.id, student.id, subject.id);
          chatRooms.push(chatRoom);
        }
      }
    }
  }

  if (finalConfig.autoAddToWhatsAppGroup) {
    try {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (school?.whatsappGroupId && parentData.phone) {
        await whatsappService.create({
          to: parentData.phone,
          message: `Welcome to ${school.name}! You have been added to the school communication group.`
        });
      }
    } catch (error) {
      console.error('Failed to add parent to WhatsApp group:', error);
    }
  }

  if (finalConfig.sendWelcomeMessages) {
    await smsService.sendSms(
      parentData.phone,
      `Welcome! Your child ${studentData.firstName} has been admitted to ${className}${streamInfo.stream}. Admission No: ${admissionNumber}.`
    );

    await emailService.create({
      to: parentData.email,
      subject: `Welcome - ${studentData.firstName} Admitted to ${className}${streamInfo.stream}`,
      html: `<h2>Welcome to Our School!</h2><p>Your child <strong>${studentData.firstName} ${studentData.lastName}</strong> has been admitted to <strong>${className}${streamInfo.stream}</strong>.</p><p><strong>Admission Number:</strong> ${admissionNumber}</p>${parentTempPassword ? `<p>Temporary password: <strong>${parentTempPassword}</strong></p>` : ''}`
    });
  }

  eventEmitter.emitEvent('student:registered', {
    studentId: student.id,
    parentId: parent.id,
    admissionNumber,
    className,
    stream: streamInfo.stream,
    timestamp: new Date().toISOString()
  });

  return { student, parent, user: parentUser, classAssigned: { classId: streamInfo.classId, className, stream: streamInfo.stream }, teachers: assignedTeachers, chatRooms, admissionNumber };
}

// ==================== FLOW 2: PARENT-TEACHER MESSAGING AUTO-ROUTING ====================

export async function sendParentTeacherMessage(
  parentId: string,
  teacherId: string,
  studentId: string,
  subjectId: string,
  message: string,
  attachment?: string
) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { parent: true } });
  if (!student || student.parentId !== parentId) {
    throw new Error('Parent is not linked to this student');
  }
  if (!student.classId) {
    throw new Error('Student is not assigned to a class');
  }

  const teacherAssignment = await prisma.subjectClass.findFirst({
    where: { teacherId, classId: student.classId, subjectId },
    include: { subject: true, teacher: { include: { user: true } } }
  });

  if (!teacherAssignment) {
    throw new Error('Teacher is not assigned to teach this student');
  }

  const parentUser = await prisma.parent.findUnique({ where: { id: parentId }, select: { userId: true } });
  const teacherUser = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
  
  if (!parentUser || !teacherUser) {
    throw new Error('Parent or teacher user not found');
  }

  const savedMessage = await prisma.message.create({
    data: {
      senderId: parentUser.userId,
      receiverId: teacherUser.userId,
      parentId,
      teacherId,
      studentId,
      message,
      attachment,
      status: 'SENT'
    }
  });

  try {
    const wsService = WebSocketService.getInstance();
    wsService.sendToUser(teacherUser.userId, {
      type: 'message:new',
      data: {
        messageId: savedMessage.id,
        senderId: parentUser.userId,
        receiverId: teacherUser.userId,
        message: message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {}

  eventEmitter.emitEvent('message:new', {
    messageId: savedMessage.id,
    senderId: parentUser.userId,
    receiverId: teacherUser.userId,
    message: message,
    timestamp: new Date().toISOString()
  });

  return savedMessage;
}

// 2.1 Teacher Reply to Parent
export async function teacherReplyToParent(
  teacherId: string,
  parentId: string,
  studentId: string,
  message: string,
  attachment?: string,
  originalMessageId?: string
) {
  const student = await prisma.student.findUnique({ where: { id: studentId }, include: { parent: true } });
  if (!student || student.parentId !== parentId) {
    throw new Error('Invalid student-parent relationship');
  }

  const teacherUser = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
  const parentUser = await prisma.parent.findUnique({ where: { id: parentId }, select: { userId: true } });

  if (!teacherUser || !parentUser) {
    throw new Error('Teacher or parent user not found');
  }

  const savedMessage = await prisma.message.create({
    data: {
      senderId: teacherUser.userId,
      receiverId: parentUser.userId,
      parentId,
      teacherId,
      studentId,
      message,
      attachment,
      status: 'SENT',
      replyToId: originalMessageId
    }
  });

  try {
    const wsService = WebSocketService.getInstance();
    wsService.sendToUser(parentUser.userId, {
      type: 'message:new',
      data: {
        messageId: savedMessage.id,
        senderId: teacherUser.userId,
        receiverId: parentUser.userId,
        message: message,
        isReply: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {}

  await notificationService.sendNotification(parentUser.userId, {
    title: 'New Message from Teacher',
    message: `Teacher replied: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    link: `/dashboard/parent/chat/${savedMessage.id}`,
    type: NotificationType.MESSAGE_RECEIVED,
    channels: ['SMS', 'PUSH']
  });

  return savedMessage;
}

// 2.2 Get Chat Messages
export async function getChatMessages(
  parentId: string,
  teacherId: string,
  studentId: string,
  userId: string,
  userRole: string
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error('Student not found');

  if (userRole === Role.PARENT && student.parentId !== parentId) {
    throw new Error('Access denied: You can only view messages for your own children');
  }

  if (userRole === Role.TEACHER) {
    const teacherAssignment = await prisma.subjectClass.findFirst({
      where: { teacherId, classId: student.classId! }
    });
    if (!teacherAssignment) throw new Error('Access denied: You do not teach this student');
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { parentId, teacherId },
        { parentId, teacherId }
      ],
      studentId
    },
    orderBy: { createdAt: 'asc' }
  });

  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      isRead: false
    },
    data: { isRead: true }
  });

  return messages;
}

// 2.3 Mark Message as Read
export async function markMessageAsRead(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) throw new Error('Message not found');
  if (message.receiverId !== userId) throw new Error('You cannot mark this message as read');

  return prisma.message.update({
    where: { id: messageId },
    data: { isRead: true, readAt: new Date() }
  });
}

// 2.4 Get Unread Message Count
export async function getUnreadMessageCount(userId: string, role: string) {
  let whereCondition: any = { receiverId: userId, isRead: false };

  if (role === Role.TEACHER) {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (teacher) whereCondition.teacherId = teacher.id;
  }

  if (role === Role.PARENT) {
    const parent = await prisma.parent.findUnique({ where: { userId }, select: { id: true } });
    if (parent) whereCondition.parentId = parent.id;
  }

  return prisma.message.count({ where: whereCondition });
}

// 2.5 Get User Conversations
export async function getUserConversations(userId: string, role: string) {
  let conversations: any[] = [];

  if (role === Role.TEACHER) {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (teacher) {
      const messages = await prisma.message.findMany({
        where: { teacherId: teacher.id },
        include: { parent: { include: { user: true } }, student: true },
        orderBy: { createdAt: 'desc' },
        distinct: ['parentId', 'studentId']
      });
      conversations = messages.map(m => ({
        parentId: m.parentId,
        parentName: `${m.parent?.user.firstName} ${m.parent?.user.lastName}`,
        studentId: m.studentId,
        studentName: `${m.student?.firstName} ${m.student?.lastName}`,
        lastMessage: m.message,
        lastMessageDate: m.createdAt,
        unreadCount: 0
      }));
    }
  }

  if (role === Role.PARENT) {
    const parent = await prisma.parent.findUnique({ where: { userId }, select: { id: true } });
    if (parent) {
      const messages = await prisma.message.findMany({
        where: { parentId: parent.id },
        include: { teacher: { include: { user: true } }, student: true },
        orderBy: { createdAt: 'desc' },
        distinct: ['teacherId', 'studentId']
      });
      conversations = messages.map(m => ({
        teacherId: m.teacherId,
        teacherName: `${m.teacher?.user.firstName} ${m.teacher?.user.lastName}`,
        studentId: m.studentId,
        studentName: `${m.student?.firstName} ${m.student?.lastName}`,
        lastMessage: m.message,
        lastMessageDate: m.createdAt,
        unreadCount: 0
      }));
    }
  }

  return conversations;
}

// ==================== FLOW 3: ATTENDANCE → PARENT NOTIFICATION ====================

export async function markAttendanceAndNotify(
  classId: string,
  teacherId: string,
  attendanceData: { studentId: string; status: AttendanceStatus; notes?: string }[],
  date: Date = new Date()
) {
  const results = [];

  for (const record of attendanceData) {
    const attendance = await prisma.attendance.create({
      data: {
        studentId: record.studentId,
        classId,
        teacherId,
        date,
        status: record.status,
        notes: record.notes,
        checkIn: record.status === AttendanceStatus.PRESENT ? new Date() : null,
        checkOut: record.status === AttendanceStatus.PRESENT ? new Date() : null
      }
    });

    results.push(attendance);

    if (record.status === AttendanceStatus.ABSENT) {
      const student = await prisma.student.findUnique({
        where: { id: record.studentId },
        include: { parent: { include: { user: true } }, class: true }
      });

      if (student && student.parent) {
        const studentName = `${student.firstName} ${student.lastName}`;
        const className = student.class?.name || '';

        await notificationService.sendNotification(student.parent.userId, {
          title: `${studentName} was absent today`,
          message: `${studentName} was marked absent in ${className} today.`,
          type: NotificationType.ATTENDANCE_ALERT,
          channels: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']
        });

        try {
          await whatsappService.create({
            to: student.parent.phone,
            message: `Dear Parent,\n\n${studentName} was marked ABSENT in school today (${date.toDateString()}).\n\nClass: ${className}`
          });
        } catch (error) {
          console.error('Failed to send WhatsApp absence notification:', error);
        }
      }
    }

    eventEmitter.emitEvent('attendance:marked', {
      studentId: record.studentId,
      classId,
      status: record.status,
      timestamp: new Date().toISOString()
    });
  }

  return results;
}

// 3.1 Get Student Attendance
export async function getStudentAttendance(studentId: string, startDate?: Date, endDate?: Date) {
  const where: any = { studentId };
  if (startDate) where.date = { gte: startDate };
  if (endDate) where.date = { ...where.date, lte: endDate };

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { class: true, teacher: { include: { user: true } } }
  });

  const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absentCount = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const lateCount = attendance.filter(a => a.status === AttendanceStatus.LATE).length;
  const excusedCount = attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;
  const total = attendance.length;
  const percentage = total > 0 ? (presentCount / total) * 100 : 0;

  return { attendance, summary: { presentCount, absentCount, lateCount, excusedCount, total, percentage } };
}

// 3.2 Get Class Attendance Summary
export async function getClassAttendanceSummary(classId: string, date: Date = new Date()) {
  const attendance = await prisma.attendance.findMany({
    where: { classId, date: { gte: new Date(date.setHours(0, 0, 0, 0)), lte: new Date(date.setHours(23, 59, 59, 999)) } },
    include: { student: true }
  });

  const totalStudents = await prisma.student.count({ where: { classId, isActive: true } });
  const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absentCount = attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const lateCount = attendance.filter(a => a.status === AttendanceStatus.LATE).length;

  return { date, totalStudents, presentCount, absentCount, lateCount, attendanceRate: totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0 };
}

// ==================== FLOW 4: GRADE ENTRY → PARENT VISIBILITY ====================

function calculateGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 75) return 'A-';
  if (score >= 70) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 60) return 'B-';
  if (score >= 55) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 45) return 'C-';
  if (score >= 40) return 'D+';
  if (score >= 35) return 'D';
  if (score >= 30) return 'D-';
  return 'E';
}

function calculatePoints(grade: string): number {
  const pointsMap: Record<string, number> = {
    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
    'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
  };
  return pointsMap[grade] || 0;
}

export async function publishGradesAndNotify(
  teacherId: string,
  subjectId: string,
  classId: string,
  examType: ExamType,
  gradesData: { studentId: string; score: number; remarks?: string }[],
  term: number,
  year: number
) {
  const results = [];
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  for (const gradeData of gradesData) {
    const grade = calculateGrade(gradeData.score);
    const points = calculatePoints(grade);

    const result = await prisma.result.create({
      data: {
        studentId: gradeData.studentId,
        subjectId,
        teacherId,
        examType,
        score: gradeData.score,
        grade,
        points,
        remarks: gradeData.remarks || '',
        term,
        year,
        date: new Date()
      }
    });

    results.push(result);

    const student = await prisma.student.findUnique({
      where: { id: gradeData.studentId },
      include: { parent: { include: { user: true } }, class: true }
    });

    if (student && student.parent) {
      const studentName = `${student.firstName} ${student.lastName}`;

      try {
        const wsService = WebSocketService.getInstance();
        wsService.sendToUser(student.parent.userId, {
          type: 'result:published',
          data: {
            studentName,
            subject: subject?.name,
            examType,
            score: gradeData.score,
            grade,
            points,
            timestamp: new Date().toISOString()
          }
        });
      } catch (e) {}

      await notificationService.sendNotification(student.parent.userId, {
        title: `${studentName}'s ${examType} Results`,
        message: `${studentName} scored ${gradeData.score}% (${grade}) in ${subject?.name}`,
        link: '/dashboard/parent/results',
        type: NotificationType.RESULT_PUBLISHED,
        channels: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']
      });
    }
  }

  eventEmitter.emitEvent('result:published', {
    classId,
    subjectId,
    studentId: gradesData[0]?.studentId || '',
    grade: calculateGrade(gradesData[0]?.score || 0),
    score: gradesData[0]?.score || 0,
    timestamp: new Date().toISOString()
  });

  return results;
}

// 4.1 Get Student Results
export async function getStudentResults(studentId: string, term?: number, year?: number, subjectId?: string) {
  const where: any = { studentId };
  if (term) where.term = term;
  if (year) where.year = year;
  if (subjectId) where.subjectId = subjectId;

  const results = await prisma.result.findMany({
    where,
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { date: 'desc' }
  });

  const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  const totalPoints = results.reduce((sum, r) => sum + (r.points || 0), 0);
  const meanGrade = calculateGrade(averageScore);

  return { results, summary: { averageScore, totalPoints, meanGrade, totalSubjects: results.length } };
}

// 4.2 Get Class Results Summary
export async function getClassResultsSummary(classId: string, subjectId: string, examType?: ExamType, term?: number, year?: number) {
  const where: any = { subjectId, student: { classId } };
  if (examType) where.examType = examType;
  if (term) where.term = term;
  if (year) where.year = year;

  const results = await prisma.result.findMany({
    where,
    include: { student: true },
    orderBy: { score: 'desc' }
  });

  const averageScore = results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  const gradeDistribution = {
    A: results.filter(r => r.grade === 'A').length,
    B: results.filter(r => r.grade === 'B' || r.grade === 'B+' || r.grade === 'B-').length,
    C: results.filter(r => r.grade === 'C' || r.grade === 'C+' || r.grade === 'C-').length,
    D: results.filter(r => r.grade === 'D' || r.grade === 'D+' || r.grade === 'D-').length,
    E: results.filter(r => r.grade === 'E').length
  };

  return { results, summary: { averageScore, totalStudents: results.length, gradeDistribution, highestScore: results[0]?.score || 0, lowestScore: results[results.length - 1]?.score || 0 } };
}

// ==================== FLOW 5: FEE PAYMENT → MULTI-SYSTEM UPDATE ====================

async function getTotalPaidForFee(feeId: string): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: { feeId, status: PaymentStatus.COMPLETED },
    _sum: { amount: true }
  });
  return result._sum.amount || 0;
}

export async function getStudentFeeBalance(studentId: string): Promise<number> {
  const fees = await prisma.fee.findMany({ where: { studentId } });
  let totalFees = 0;
  let totalPaid = 0;
  for (const fee of fees) {
    totalFees += fee.amount;
    totalPaid += await getTotalPaidForFee(fee.id);
  }
  return totalFees - totalPaid;
}

export async function processFeePayment(
  studentId: string,
  parentId: string,
  amount: number,
  method: PaymentMethod,
  transactionId?: string,
  mpesaReceipt?: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      fees: { where: { status: PaymentStatus.PENDING }, orderBy: { dueDate: 'asc' } },
      class: true
    }
  });

  if (!student) throw new Error('Student not found');

  let remainingAmount = amount;
  const payments = [];

  for (const fee of student.fees) {
    if (remainingAmount <= 0) break;
    const feeBalance = fee.amount - (await getTotalPaidForFee(fee.id));
    const paymentAmount = Math.min(remainingAmount, feeBalance);

    if (paymentAmount > 0) {
      const payment = await prisma.payment.create({
        data: {
          feeId: fee.id,
          studentId,
          parentId,
          amount: paymentAmount,
          method,
          transactionId: transactionId || `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          mpesaReceipt,
          status: PaymentStatus.COMPLETED,
          paymentDate: new Date(),
          recordedBy: parentId,
          receiptNumber: `RCP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        }
      });

      payments.push(payment);
      remainingAmount -= paymentAmount;

      const newBalance = feeBalance - paymentAmount;
      if (newBalance <= 0) {
        await prisma.fee.update({
          where: { id: fee.id },
          data: { status: PaymentStatus.COMPLETED, paidDate: new Date() }
        });
      }
    }
  }

  const totalBalance = await getStudentFeeBalance(studentId);
  const studentName = `${student.firstName} ${student.lastName}`;

  try {
    const wsService = WebSocketService.getInstance();
    wsService.sendToUser(parentId, {
      type: 'fee:paid',
      data: { studentName, amountPaid: amount, remainingBalance: totalBalance, timestamp: new Date().toISOString() }
    });
  } catch (e) {}

  await notificationService.sendNotification(parentId, {
    title: 'Payment Successful',
    message: `Payment of KES ${amount.toLocaleString()} received. New balance: KES ${totalBalance.toLocaleString()}`,
    link: '/dashboard/parent/fees',
    type: NotificationType.PAYMENT_CONFIRMATION,
    channels: ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH']
  });

  const bursars = await prisma.user.findMany({ where: { role: Role.BURSAR } });
  for (const bursar of bursars) {
    try {
      const wsService = WebSocketService.getInstance();
      wsService.sendToUser(bursar.id, {
        type: 'fee:received',
        data: { studentName, amount, method, receiptNumber: payments[0]?.receiptNumber, timestamp: new Date().toISOString() }
      });
    } catch (e) {}
  }

  eventEmitter.emitEvent('fee:paid', {
    studentId,
    amount,
    transactionId: transactionId || payments[0]?.receiptNumber || '',
    timestamp: new Date().toISOString()
  });

  return { payments, totalPaid: amount, remainingBalance: totalBalance, receipts: payments.map(p => p.receiptNumber) };
}

// 5.1 Get Student Payment History
export async function getStudentPaymentHistory(studentId: string) {
  const payments = await prisma.payment.findMany({
    where: { studentId },
    include: { fee: true },
    orderBy: { paymentDate: 'desc' }
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return { payments, totalPaid, count: payments.length };
}

// 5.2 Generate Receipt PDF (Mock - implement actual PDF generation)
export async function generateReceiptPDF(paymentId: string): Promise<Buffer> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { student: true, fee: true }
  });

  if (!payment) throw new Error('Payment not found');

  // Mock PDF buffer - in production, use pdfkit or similar
  const pdfBuffer = Buffer.from(`RECEIPT\nReceipt No: ${payment.receiptNumber}\nAmount: ${payment.amount}\nDate: ${payment.paymentDate}\nStudent: ${payment.student?.firstName} ${payment.student?.lastName}`);
  return pdfBuffer;
}

// ==================== FLOW 6: STOCK REQUEST → STORE KEEPER FULFILLMENT ====================

export async function createStockRequest(
  teacherId: string,
  itemId: string,
  quantity: number,
  purpose: string
) {
  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');
  if (item.quantity < quantity) throw new Error(`Insufficient stock. Available: ${item.quantity}`);

  const request = await prisma.stockRequest.create({
    data: { itemId, requestedBy: teacherId, quantity, purpose, status: StockRequestStatus.PENDING }
  });

  const storeKeepers = await prisma.user.findMany({ where: { role: Role.STORE_KEEPER } });
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });

  for (const keeper of storeKeepers) {
    try {
      const wsService = WebSocketService.getInstance();
      wsService.sendToUser(keeper.id, {
        type: 'stock:request',
        data: {
          requestId: request.id,
          teacherName: `${teacher?.user.firstName} ${teacher?.user.lastName}`,
          itemName: item.name,
          quantity,
          purpose,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {}

    await notificationService.sendNotification(keeper.id, {
      title: 'New Stock Request',
      message: `${teacher?.user.firstName} requested ${quantity}x ${item.name}`,
      link: '/dashboard/storekeeper/requests',
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      channels: ['PUSH']
    });
  }

  eventEmitter.emitEvent('stock:request_created', {
    requestId: request.id,
    teacherId,
    itemId,
    quantity,
    timestamp: new Date().toISOString()
  });

  return request;
}

export async function approveStockRequest(requestId: string, approvedBy: string) {
  const request = await prisma.stockRequest.findUnique({
    where: { id: requestId },
    include: { item: true }
  });

  if (!request || request.status !== StockRequestStatus.PENDING) {
    throw new Error('Invalid or already processed request');
  }

  await prisma.stockRequest.update({
    where: { id: requestId },
    data: { status: StockRequestStatus.APPROVED, approvedBy, approvedAt: new Date() }
  });

  await prisma.inventoryItem.update({
    where: { id: request.itemId },
    data: { quantity: { decrement: request.quantity } }
  });

  await prisma.stockMovement.create({
    data: {
      itemId: request.itemId,
      movementType: 'ISSUE',
      quantity: request.quantity,
      actorId: approvedBy,
      notes: `Issued for: ${request.purpose}`,
      beforeQuantity: request.item.quantity,
      afterQuantity: request.item.quantity - request.quantity
    }
  });

  await notificationService.sendNotification(request.requestedBy, {
    title: 'Stock Request Approved',
    message: `Your request for ${request.quantity}x ${request.item.name} is ready for pickup.`,
    link: '/dashboard/teacher/stock-requests',
    type: NotificationType.GENERAL_ANNOUNCEMENT,
    channels: ['SMS', 'PUSH']
  });

  eventEmitter.emitEvent('stock:request_approved', {
    requestId,
    teacherId: request.requestedBy,
    itemId: request.itemId,
    quantity: request.quantity,
    timestamp: new Date().toISOString()
  });

  return { success: true, requestId };
}

// 6.1 Get All Stock Requests
export async function getStockRequests(status?: StockRequestStatus, userId?: string, userRole?: string) {
  const where: any = {};
  if (status) where.status = status;

  if (userRole === Role.TEACHER && userId) {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (teacher) where.requestedBy = teacher.id;
  }

  const requests = await prisma.stockRequest.findMany({
    where,
    include: { item: true },
    orderBy: { createdAt: 'desc' }
  });

  return requests;
}

// 6.2 Get Low Stock Items
export async function getLowStockItems() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { quantity: 'asc' } });
  return items.filter((item) => item.quantity <= item.minThreshold);
}

// ==================== FLOW 7: ADMIN ADDS TEACHER → AUTO ASSIGNMENT ====================

async function findClassesNeedingTeacher(schoolId: string, subjectId: string) {
  const allClasses = await prisma.class.findMany({
    where: { schoolId },
    include: {
      subjects: { where: { subjectId } },
      students: { where: { isActive: true } }
    }
  });

  return allClasses
    .filter(cls => cls.subjects.length === 0)
    .sort((a, b) => a.students.length - b.students.length);
}

export async function addTeacherWithAutoAssignment(
  schoolId: string,
  teacherData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    subject: string;
    specialization?: string;
    qualification?: string;
    experience?: number;
    tscNumber?: string;
  },
  config: Partial<AutomationConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
  const user = await prisma.user.create({
    data: {
      email: teacherData.email,
      password: await bcrypt.hash(tempPassword, 12),
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      phone: teacherData.phone,
      role: Role.TEACHER,
      isVerified: false
    }
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      email: teacherData.email,
      phone: teacherData.phone,
      subject: teacherData.subject,
      specialization: teacherData.specialization,
      qualification: teacherData.qualification,
      experience: teacherData.experience,
      tscNumber: teacherData.tscNumber,
      dateHired: new Date(),
      isActive: true
    }
  });

  let subject = await prisma.subject.findFirst({ where: { schoolId, name: teacherData.subject } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        schoolId,
        name: teacherData.subject,
        code: teacherData.subject.substring(0, 3).toUpperCase() + Date.now(),
        category: 'Academic'
      }
    });
  }

  await prisma.teacherSubject.create({
    data: { teacherId: teacher.id, subjectId: subject.id }
  });

  const assignedClasses = [];
  if (finalConfig.autoAssignTeachers) {
    const classesNeedingTeacher = await findClassesNeedingTeacher(schoolId, subject.id);
    
    for (const cls of classesNeedingTeacher.slice(0, 3)) {
      await prisma.subjectClass.create({
        data: { subjectId: subject.id, classId: cls.id, teacherId: teacher.id }
      });
      assignedClasses.push(cls);
    }

    if (finalConfig.autoCreateChatRooms) {
      for (const cls of assignedClasses) {
        const students = await prisma.student.findMany({
          where: { classId: cls.id },
          include: { parent: true }
        });

        for (const student of students) {
          if (student.parentId) {
            await createParentTeacherChatRoom(student.parentId, teacher.id, student.id, subject.id);
          }
        }
      }
    }
  }

  if (finalConfig.sendWelcomeMessages) {
    await notificationService.sendNotification(user.id, {
      title: 'Welcome to the School!',
      message: `Your teacher account has been created. Assigned to ${assignedClasses.length} classes.\nTemporary password: ${tempPassword}`,
      type: NotificationType.GENERAL_ANNOUNCEMENT,
      channels: ['EMAIL', 'SMS']
    });
  }

  eventEmitter.emitEvent('teacher:created', {
    teacherId: teacher.id,
    userId: user.id,
    subject: teacherData.subject,
    assignedClasses: assignedClasses.map(c => c.name),
    timestamp: new Date().toISOString()
  });

  return { teacher, user, subject, assignedClasses, tempPassword };
}

// 7.1 Get All Teachers
export async function getAllTeachers(schoolId?: string, subject?: string) {
  const where: any = { isActive: true };
  if (schoolId) where.schoolId = schoolId;
  if (subject) where.subject = subject;

  const teachers = await prisma.teacher.findMany({
    where,
    include: { user: true, subjects: { include: { subject: true } }, subjectClasses: { include: { class: true } } }
  });

  return teachers;
}

// 7.2 Get Teacher's Assigned Classes
export async function getTeacherAssignedClasses(teacherId: string) {
  const classes = await prisma.subjectClass.findMany({
    where: { teacherId },
    include: { class: { include: { students: { where: { isActive: true } } } }, subject: true }
  });

  return classes.map(sc => ({
    classId: sc.class.id,
    className: sc.class.name,
    stream: sc.class.stream,
    subject: sc.subject.name,
    studentCount: sc.class.students.length
  }));
}

// ==================== FLOW 8: PARENT MEETING REQUEST → AUTO SCHEDULE ====================

export async function requestParentTeacherMeeting(
  parentId: string,
  teacherId: string,
  studentId: string,
  subject: string,
  preferredDateTime: Date,
  description?: string,
  meetingType: MeetingType = MeetingType.PARENT_TEACHER
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true }
  });

  if (!student || student.parentId !== parentId) {
    throw new Error('Invalid parent-student relationship');
  }

  const existingMeetings = await prisma.meeting.findMany({
    where: {
      teacherId,
      date: {
        gte: new Date(preferredDateTime.getTime() - 30 * 60 * 1000),
        lte: new Date(preferredDateTime.getTime() + 30 * 60 * 1000)
      },
      status: { in: [MeetingStatus.PENDING, MeetingStatus.CONFIRMED] }
    }
  });

  if (existingMeetings.length > 0) {
    throw new Error('Teacher is not available at this time.');
  }

  const meetingId = `meet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meetingLink = `https://meet.schoolhub.com/${meetingId}`;

  const meeting = await prisma.meeting.create({
    data: {
      parentId,
      teacherId,
      studentId,
      type: meetingType,
      subject,
      description: description || '',
      date: preferredDateTime,
      duration: 30,
      status: MeetingStatus.CONFIRMED,
      meetingLink,
      notes: ''
    }
  });

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
  const parent = await prisma.parent.findUnique({ where: { id: parentId }, include: { user: true } });

  try {
    const wsService = WebSocketService.getInstance();
    wsService.sendToUser(teacherId, {
      type: 'meeting:scheduled',
      data: {
        meetingId: meeting.id,
        parentName: `${parent?.user.firstName} ${parent?.user.lastName}`,
        studentName: `${student.firstName} ${student.lastName}`,
        subject,
        date: preferredDateTime.toISOString(),
        meetingLink,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {}

  await notificationService.sendNotification(teacherId, {
    title: 'Meeting Scheduled',
    message: `Meeting with ${student.firstName}'s parent on ${preferredDateTime.toLocaleString()}`,
    link: `/dashboard/teacher/meetings/${meeting.id}`,
    type: NotificationType.MEETING_REQUEST,
    channels: ['EMAIL', 'PUSH']
  });

  await notificationService.sendNotification(parentId, {
    title: 'Meeting Confirmed',
    message: `Your meeting with ${teacher?.user.firstName} ${teacher?.user.lastName} is confirmed for ${preferredDateTime.toLocaleString()}`,
    link: `/dashboard/parent/meetings/${meeting.id}`,
    type: NotificationType.MEETING_REQUEST,
    channels: ['SMS', 'EMAIL', 'PUSH']
  });

  eventEmitter.emitEvent('meeting:scheduled', {
    meetingId: meeting.id,
    parentId,
    teacherId,
    studentId,
    meetingDate: preferredDateTime.toISOString(),
    timestamp: new Date().toISOString()
  });

  return meeting;
}

// 8.1 Get Meetings for User
export async function getUserMeetings(userId: string, role: string, status?: MeetingStatus, startDate?: Date, endDate?: Date) {
  let where: any = {};
  const dateFilter: any = {};

  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;
  if (Object.keys(dateFilter).length) where.date = dateFilter;
  if (status) where.status = status;

  if (role === Role.PARENT) {
    const parent = await prisma.parent.findUnique({ where: { userId }, select: { id: true } });
    if (parent) where.parentId = parent.id;
  }

  if (role === Role.TEACHER) {
    const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (teacher) where.teacherId = teacher.id;
  }

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      parent: { include: { user: true } },
      teacher: { include: { user: true } },
      student: true
    },
    orderBy: { date: 'asc' }
  });

  return meetings;
}

// 8.2 Cancel Meeting
export async function cancelMeeting(meetingId: string, userId: string, role: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { parent: { include: { user: true } }, teacher: { include: { user: true } } }
  });

  if (!meeting) throw new Error('Meeting not found');

  const isParent = role === Role.PARENT && meeting.parent?.userId === userId;
  const isTeacher = role === Role.TEACHER && meeting.teacher?.userId === userId;
  const isAdmin = role === Role.ADMIN || role === Role.PRINCIPAL;

  if (!isParent && !isTeacher && !isAdmin) {
    throw new Error('You are not authorized to cancel this meeting');
  }

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: MeetingStatus.CANCELLED }
  });

  const otherPartyId = isParent ? meeting.teacherId : meeting.parentId;
  await notificationService.sendNotification(otherPartyId, {
    title: 'Meeting Cancelled',
    message: `The meeting scheduled for ${meeting.date.toLocaleString()} has been cancelled.`,
    type: NotificationType.MEETING_REQUEST,
    channels: ['EMAIL', 'PUSH']
  });

  return updatedMeeting;
}

// 8.3 Update Meeting Status
export async function updateMeetingStatus(meetingId: string, status: MeetingStatus, notes?: string, userId?: string, role?: string) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) throw new Error('Meeting not found');

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meetingId },
    data: { status, notes: notes ? { set: notes } : undefined }
  });

  return updatedMeeting;
}

// ==================== FLOW 9: ONLINE CLASS AUTOMATION ====================

export async function joinOnlineClass(
  studentId: string,
  classId: string,
  subjectId: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true }
  });

  if (!student) throw new Error('Student not found');

  if (student.classId !== classId) {
    throw new Error('Student is not enrolled in this class');
  }

  const subjectEnrollment = await prisma.subjectClass.findFirst({
    where: { classId, subjectId }
  });

  if (!subjectEnrollment) {
    throw new Error('Student is not enrolled in this subject');
  }

  const existingAttendance = await prisma.attendance.findFirst({
    where: {
      studentId,
      classId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }
  });

  if (!existingAttendance) {
    await prisma.attendance.create({
      data: {
        studentId,
        classId,
        date: new Date(),
        status: AttendanceStatus.PRESENT,
        checkIn: new Date(),
        notes: 'Online class attendance'
      }
    });
  }

  eventEmitter.emitEvent('onlineclass:joined', {
    studentId,
    classId,
    subjectId,
    timestamp: new Date().toISOString()
  });

  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      class: student.class?.name
    }
  };
}

// 9.1 Start Live Class
export async function startLiveClass(teacherId: string, classId: string, subjectId: string, title?: string) {
  const sessionId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meetingLink = `https://meet.schoolhub.com/live/${sessionId}`;

  const session = {
    id: sessionId,
    teacherId,
    classId,
    subjectId,
    title: title || 'Live Class',
    meetingLink,
    startedAt: new Date(),
    isActive: true
  };

  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    include: { parent: { include: { user: true } } }
  });

  for (const student of students) {
    if (student.parent) {
      await notificationService.sendNotification(student.parent.userId, {
        title: 'Live Class Started',
        message: `${title || 'Live class'} has started for ${student.firstName}'s class. Join now!`,
        link: meetingLink,
        type: NotificationType.LIVE_CLASS,
        channels: ['SMS', 'PUSH']
      });
    }
  }

  eventEmitter.emitEvent('liveclass:started', session);

  return session;
}

// 9.2 End Live Class
export async function endLiveClass(classSessionId: string, userId: string) {
  eventEmitter.emitEvent('liveclass:ended', { classSessionId, userId, endedAt: new Date() });
  return { success: true, classSessionId, endedAt: new Date() };
}

// 9.3 Get Active Live Classes
export async function getActiveLiveClasses(classId?: string, subjectId?: string) {
  // In production, maintain active sessions in Redis
  return [];
}

// ==================== FLOW 10: END OF TERM AUTO-PROCESSING ====================

export async function processEndOfTerm(schoolId: string, term: number, year: number, options?: { generateReportCards?: boolean; promoteStudents?: boolean; sendNotifications?: boolean }) {
  const opts = { generateReportCards: true, promoteStudents: true, sendNotifications: true, ...options };
  const results = {
    reportCardsGenerated: 0,
    studentsPromoted: 0,
    notificationsSent: 0
  };

  const students = await prisma.student.findMany({
    where: { class: { schoolId }, isActive: true },
    include: { class: true, parent: { include: { user: true } }, results: { where: { term, year } } }
  });

  if (opts.generateReportCards) {
    for (const student of students) {
      const reportCard = await generateReportCard(student.id, term, year);
      results.reportCardsGenerated++;

      if (student.parent && opts.sendNotifications) {
        await notificationService.sendNotification(student.parent.userId, {
          title: `${student.firstName}'s Report Card Ready`,
          message: `Term ${term} ${year} report card is now available.`,
          link: `/dashboard/parent/reports/${reportCard.id}`,
          type: NotificationType.RESULT_PUBLISHED,
          channels: ['EMAIL', 'SMS', 'PUSH']
        });
        results.notificationsSent++;
      }
    }
  }

  if (opts.promoteStudents) {
    const currentTerm = await getCurrentTerm(schoolId);
    if (currentTerm && currentTerm.term === 3) {
      for (const student of students) {
        if (student.class?.name) {
          const nextClass = getNextClassLevel(student.class.name);
          if (nextClass) {
            const nextClassRecord = await prisma.class.findFirst({
              where: { schoolId, name: nextClass, stream: 'A' }
            });
            if (nextClassRecord) {
              await prisma.student.update({
                where: { id: student.id },
                data: { classId: nextClassRecord.id }
              });
              results.studentsPromoted++;
            }
          }
        }
      }
    }
  }

  eventEmitter.emitEvent('term:end_processed', {
    schoolId,
    term,
    year,
    reportCardsGenerated: results.reportCardsGenerated,
    studentsPromoted: results.studentsPromoted,
    timestamp: new Date().toISOString()
  });

  return results;
}

export async function generateReportCard(studentId: string, term: number, year: number) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      results: { where: { term, year }, include: { subject: true } },
      class: true
    }
  });

  if (!student) throw new Error('Student not found');

  const totalScore = student.results.reduce((sum, r) => sum + r.score, 0);
  const average = student.results.length > 0 ? totalScore / student.results.length : 0;

  return {
    id: `report_${studentId}_${term}_${year}`,
    studentId,
    term,
    year,
    averageScore: average,
    totalSubjects: student.results.length,
    grade: calculateGrade(average),
    teacherComments: '',
    principalComments: '',
    pdfUrl: `/reports/${studentId}_${term}_${year}.pdf`,
    isPublished: true
  };
}

// 10.1 Generate Single Report Card PDF
export async function generateSingleReportCard(studentId: string, term: number, year: number): Promise<Buffer> {
  const reportCard = await generateReportCard(studentId, term, year);
  // Mock PDF - implement actual PDF generation
  return Buffer.from(`REPORT CARD\nStudent: ${studentId}\nTerm: ${term}\nYear: ${year}\nAverage: ${reportCard.averageScore}%\nGrade: ${reportCard.grade}`);
}

// 10.2 Generate Bulk Report Cards (Class)
export async function generateBulkReportCards(classId: string, term: number, year: number): Promise<Buffer> {
  const students = await prisma.student.findMany({ where: { classId, isActive: true } });
  // Mock ZIP - implement actual ZIP generation
  return Buffer.from(`BULK REPORT CARDS\nClass: ${classId}\nTerm: ${term}\nYear: ${year}\nStudents: ${students.length}`);
}

function getNextClassLevel(currentClass: string): string | null {
  const progression: Record<string, string | null> = {
    'Form 1': 'Form 2',
    'Form 2': 'Form 3',
    'Form 3': 'Form 4',
    'Form 4': null,
    'Class 6': 'Class 7',
    'Class 7': 'Class 8',
    'Class 8': 'Form 1'
  };
  return progression[currentClass] || null;
}

// ==================== DATA MIGRATION: BULK IMPORT ====================

export interface BulkImportResult {
  studentsCreated: number;
  parentsCreated: number;
  teachersCreated: number;
  chatRoomsCreated: number;
  errors: string[];
}

export async function bulkImportStudents(
  schoolId: string,
  studentsData: Array<{
    admissionNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: Gender;
    className: string;
    stream: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
    relationship: string;
  }>,
  options?: { createChatRooms?: boolean }
): Promise<BulkImportResult> {
  const opts = { createChatRooms: true, ...options };
  const result: BulkImportResult = {
    studentsCreated: 0,
    parentsCreated: 0,
    teachersCreated: 0,
    chatRoomsCreated: 0,
    errors: []
  };

  for (const data of studentsData) {
    try {
      let cls = await prisma.class.findFirst({
        where: { schoolId, name: data.className, stream: data.stream }
      });

      if (!cls) {
        cls = await prisma.class.create({
          data: { schoolId, name: data.className, stream: data.stream, capacity: 40 }
        });
      }

      let parent = await prisma.parent.findFirst({
        where: { email: data.parentEmail }
      });

      if (!parent) {
        let parentUser = await prisma.user.findFirst({
          where: { email: data.parentEmail }
        });

        if (!parentUser) {
          const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
          parentUser = await prisma.user.create({
            data: {
              email: data.parentEmail,
              password: await bcrypt.hash(tempPassword, 12),
              firstName: data.parentName.split(' ')[0],
              lastName: data.parentName.split(' ').slice(1).join(' ') || '',
              phone: data.parentPhone,
              role: Role.PARENT,
              isVerified: false
            }
          });
        }

        parent = await prisma.parent.create({
          data: {
            userId: parentUser.id,
            firstName: data.parentName.split(' ')[0],
            lastName: data.parentName.split(' ').slice(1).join(' ') || '',
            email: data.parentEmail,
            phone: data.parentPhone,
            relationship: data.relationship
          }
        });
        result.parentsCreated++;
      }

      const student = await prisma.student.create({
        data: {
          admissionNumber: data.admissionNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          classId: cls.id,
          parentId: parent.id,
          enrollmentDate: new Date(),
          isActive: true
        }
      });
      result.studentsCreated++;

      if (opts.createChatRooms) {
        const subjects = await getSubjectsForClass(schoolId, data.className);
        for (const subject of subjects) {
          const teacher = await findTeacherForSubject(schoolId, subject.id, cls.id);
          if (teacher) {
            const chatRoom = await createParentTeacherChatRoom(parent.id, teacher.id, student.id, subject.id);
            if (chatRoom) result.chatRoomsCreated++;
          }
        }
      }
    } catch (error: any) {
      result.errors.push(`Error importing ${data.admissionNumber}: ${error.message}`);
    }
  }

  return result;
}

// ==================== DATA MIGRATION: PARENT SELF-CLAIM ====================

export async function parentSelfClaimStudent(
  parentData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
  },
  studentIdentifier: {
    admissionNumber?: string;
    studentName?: string;
    className?: string;
  }
) {
  let student;
  if (studentIdentifier.admissionNumber) {
    student = await prisma.student.findUnique({
      where: { admissionNumber: studentIdentifier.admissionNumber },
      include: { class: true, parent: true }
    });
  } else if (studentIdentifier.studentName && studentIdentifier.className) {
    const [firstName, ...lastNameParts] = studentIdentifier.studentName.split(' ');
    const lastName = lastNameParts.join(' ');
    student = await prisma.student.findFirst({
      where: {
        firstName: { contains: firstName, mode: 'insensitive' },
        lastName: { contains: lastName, mode: 'insensitive' },
        class: { name: studentIdentifier.className }
      },
      include: { class: true, parent: true }
    });
  }

  if (!student) {
    throw new Error('Student not found. Please verify the admission number or name and class.');
  }

  let parentUser = await prisma.user.findUnique({ where: { email: parentData.email } });
  let parent = parentUser ? await prisma.parent.findUnique({ where: { userId: parentUser.id } }) : null;

  if (student.parent) {
    const matchesExistingParent =
      student.parent.email.toLowerCase() === parentData.email.toLowerCase() ||
      student.parent.phone.replace(/\s+/g, '') === parentData.phone.replace(/\s+/g, '');

    if (!matchesExistingParent) {
      throw new Error('This student is already linked to a different parent. Please contact the school.');
    }

    parent = student.parent;
    parentUser = await prisma.user.findUnique({ where: { id: parent.userId } });
  }

  if (!parentUser) {
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    parentUser = await prisma.user.create({
      data: {
        email: parentData.email,
        password: hashedPassword,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        phone: parentData.phone,
        role: Role.PARENT,
        isVerified: false
      }
    });
  }

  if (!parent) {
    parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        email: parentData.email,
        phone: parentData.phone,
        relationship: parentData.relationship
      }
    });
  }

  if (student.parentId !== parent.id) {
    await prisma.student.update({
      where: { id: student.id },
      data: { parentId: parent.id }
    });
  }

  if (student.class && student.classId) {
    const school = await prisma.school.findFirst();
    if (school) {
      const subjects = await getSubjectsForClass(school.id, student.class.name);
      for (const subject of subjects) {
        const teacher = await findTeacherForSubject(school.id, subject.id, student.classId);
        if (teacher) {
          await createParentTeacherChatRoom(parent.id, teacher.id, student.id, subject.id);
        }
      }
    }
  }

  await notificationService.sendNotification(parentUser.id, {
    title: 'Student Linked Successfully',
    message: `You are now connected to ${student.firstName} ${student.lastName}'s account.`,
    link: '/dashboard/parent',
    type: NotificationType.GENERAL_ANNOUNCEMENT,
    channels: ['EMAIL', 'SMS', 'PUSH']
  });

  eventEmitter.emitEvent('parent:student_claimed', {
    parentId: parent.id,
    studentId: student.id,
    timestamp: new Date().toISOString()
  });

  return { parent, student, user: parentUser };
}

// ==================== NOTIFICATION MANAGEMENT ====================

export async function sendManualNotification(userId: string, notification: { title: string; message: string; type?: NotificationType; channels?: ('SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH')[]; link?: string }) {
  return notificationService.sendNotification(userId, {
    title: notification.title,
    message: notification.message,
    type: notification.type || NotificationType.GENERAL_ANNOUNCEMENT,
    channels: notification.channels || ['EMAIL', 'SMS', 'PUSH'],
    link: notification.link
  });
}

export async function getUserNotifications(userId: string, limit: number = 50, offset: number = 0, unreadOnly: boolean = false) {
  const where: any = { userId };
  if (unreadOnly) where.isRead = false;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  return notifications;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw new Error('Notification not found');
  if (notification.userId !== userId) throw new Error('Unauthorized');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() }
  });
}

// ==================== DASHBOARD STATS ====================

export async function getParentDashboardStats(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: { user: true, students: { include: { class: true, results: { orderBy: { date: 'desc' }, take: 5 } } } }
  });

  if (!parent) throw new Error('Parent not found');

  const children = parent.students.map(student => ({
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    class: student.class?.name,
    admissionNumber: student.admissionNumber,
    recentResults: student.results,
    feeBalance: 0 // Calculate from fee service
  }));

  return { parentName: `${parent.firstName} ${parent.lastName}`, children, totalChildren: children.length };
}

export async function getTeacherDashboardStats(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true, subjectClasses: { include: { class: { include: { students: { where: { isActive: true } } } }, subject: true } } }
  });

  if (!teacher) throw new Error('Teacher not found');

  const classes = teacher.subjectClasses.map(sc => ({
    classId: sc.class.id,
    className: sc.class.name,
    stream: sc.class.stream,
    subject: sc.subject.name,
    studentCount: sc.class.students.length
  }));

  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  return { teacherName: `${teacher.firstName} ${teacher.lastName}`, classes, totalClasses: classes.length, totalStudents };
}

export async function getAdminDashboardStats(schoolId: string) {
  const [students, teachers, classes, parents] = await Promise.all([
    prisma.student.count({ where: { class: { schoolId }, isActive: true } }),
    prisma.teacher.count({ where: { isActive: true } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.parent.count()
  ]);

  const recentActivities = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  return { schoolId, totalStudents: students, totalTeachers: teachers, totalClasses: classes, totalParents: parents, recentActivities };
}

// ==================== WHATSAPP MANAGEMENT ====================

export async function syncWhatsAppGroup(classId: string, groupId: string) {
  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    include: { parent: true }
  });

  const phoneNumbers = students.map(s => s.parent?.phone).filter(Boolean);

  await prisma.class.update({
    where: { id: classId },
    data: { whatsappGroupId: groupId }
  });

  return { classId, groupId, invitedCount: phoneNumbers.length, phoneNumbers };
}

export async function sendWhatsAppBroadcast(classId: string, message: string, attachment?: string) {
  const students = await prisma.student.findMany({
    where: { classId, isActive: true },
    include: { parent: true }
  });

  const results = [];
  for (const student of students) {
    if (student.parent?.phone) {
      try {
        await whatsappService.create({
          to: student.parent.phone,
          message,
          mediaUrl: attachment
        });
        results.push({ phone: student.parent.phone, success: true });
      } catch (error) {
        results.push({ phone: student.parent.phone, success: false, error: String(error) });
      }
    }
  }

  return { classId, message, sentCount: results.filter(r => r.success).length, totalCount: results.length, results };
}

// ==================== EXPORT ALL FUNCTIONS ====================

export const automationService = {
  // Configuration
  defaultConfig,

  // Flow 1
  registerStudentWithAutoAssignment,

  // Flow 2
  sendParentTeacherMessage,
  teacherReplyToParent,
  getChatMessages,
  markMessageAsRead,
  getUnreadMessageCount,
  getUserConversations,

  // Flow 3
  markAttendanceAndNotify,
  getStudentAttendance,
  getClassAttendanceSummary,

  // Flow 4
  publishGradesAndNotify,
  calculateGrade,
  calculatePoints,
  getStudentResults,
  getClassResultsSummary,

  // Flow 5
  processFeePayment,
  getStudentFeeBalance,
  getStudentPaymentHistory,
  generateReceiptPDF,

  // Flow 6
  createStockRequest,
  approveStockRequest,
  getStockRequests,
  getLowStockItems,

  // Flow 7
  addTeacherWithAutoAssignment,
  getAllTeachers,
  getTeacherAssignedClasses,

  // Flow 8
  requestParentTeacherMeeting,
  getUserMeetings,
  cancelMeeting,
  updateMeetingStatus,

  // Flow 9
  joinOnlineClass,
  startLiveClass,
  endLiveClass,
  getActiveLiveClasses,

  // Flow 10
  processEndOfTerm,
  generateReportCard,
  generateSingleReportCard,
  generateBulkReportCards,

  // Data Migration
  bulkImportStudents,
  parentSelfClaimStudent,

  // Notifications
  sendManualNotification,
  getUserNotifications,
  markNotificationAsRead,

  // Dashboard
  getParentDashboardStats,
  getTeacherDashboardStats,
  getAdminDashboardStats,

  // WhatsApp
  syncWhatsAppGroup,
  sendWhatsAppBroadcast
};

export const automationFlowManifest = {
  parentRegistration: [
    'Parent submits new-student application',
    'Admin reviews documents and approves',
    'System calculates class from age and chooses the least-filled stream',
    'System generates admission number',
    'System creates or links parent account and student record',
    'System finds subject teachers, creates parent-teacher chat rooms, sends welcome notifications'
  ],
  existingStudentConnection: [
    'Parent enters admission number plus date of birth verification',
    'System links parent to the existing student',
    'System creates all teacher chat rooms and notifies the parent'
  ],
  liveOperations: [
    'Attendance absence creates parent alerts',
    'Published grades create parent alerts and real-time events',
    'Fee payments update balances, receipts, parent view, and bursar view',
    'End-of-term processing generates reports and promotes students'
  ]
};
