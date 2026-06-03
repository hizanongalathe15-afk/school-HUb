import { Request, Response } from 'express';
import {
  AttendanceStatus,
  ExamType,
  NotificationType,
  Prisma,
  PrismaClient,
  TeacherRequestType,
  TeacherWorkflowStatus,
} from '@prisma/client';
import { markAttendanceAndNotify, publishGradesAndNotify } from '../services/automationService.js';

const prisma = new PrismaClient();

const getRequestUserId = (req: Request) => {
  const user = (req as any).user;
  return user?.userId || user?.id;
};

const getTeacherFromUser = async (userId: string) => {
  return prisma.teacher.findUnique({
    where: { userId },
    include: {
      user: true,
      classTeacher: true,
      subjectClasses: true,
      subjects: { include: { subject: true } }
    }
  });
};

const getTeacherClasses = async (teacherId: string) => {
  return prisma.class.findMany({
    where: {
      OR: [
        { classTeacherId: teacherId },
        { subjects: { some: { teacherId } } }
      ]
    },
    include: {
      subjects: { include: { subject: true, teacher: true } },
      timetable: { include: { subject: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      _count: { select: { students: true } }
    },
    orderBy: [{ name: 'asc' }, { stream: 'asc' }]
  });
};

const getAssignedClassIds = (teacher: Awaited<ReturnType<typeof getTeacherFromUser>>) => {
  if (!teacher) return [];
  return Array.from(new Set([
    ...teacher.classTeacher.map((klass) => klass.id),
    ...teacher.subjectClasses.map((subjectClass) => subjectClass.classId)
  ]));
};

const parseTerm = (term?: unknown) => {
  const normalized = String(term || '1').toLowerCase().replace('term', '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseYear = (year?: unknown) => {
  const parsed = Number(year || new Date().getFullYear());
  return Number.isFinite(parsed) ? parsed : new Date().getFullYear();
};

const examTypeFromString = (value?: unknown): ExamType => {
  const normalized = String(value || 'END_TERM').toUpperCase().replace(/[\s-]/g, '_');
  if (normalized === 'CAT_1') return ExamType.CAT1;
  if (normalized === 'CAT_2') return ExamType.CAT2;
  if (normalized === 'CAT_3') return ExamType.CAT3;
  if (normalized in ExamType) return ExamType[normalized as keyof typeof ExamType];
  return ExamType.END_TERM;
};

const gradeFromScore = (score: number) => {
  if (score >= 80) return { grade: 'A', points: 12 };
  if (score >= 75) return { grade: 'A-', points: 11 };
  if (score >= 70) return { grade: 'B+', points: 10 };
  if (score >= 65) return { grade: 'B', points: 9 };
  if (score >= 60) return { grade: 'B-', points: 8 };
  if (score >= 55) return { grade: 'C+', points: 7 };
  if (score >= 50) return { grade: 'C', points: 6 };
  if (score >= 45) return { grade: 'C-', points: 5 };
  if (score >= 40) return { grade: 'D+', points: 4 };
  if (score >= 35) return { grade: 'D', points: 3 };
  if (score >= 30) return { grade: 'D-', points: 2 };
  return { grade: 'E', points: 1 };
};

const ensureAssignedClass = async (teacherId: string, classId?: string) => {
  if (!classId) return false;
  const klass = await prisma.class.findFirst({
    where: {
      id: classId,
      OR: [{ classTeacherId: teacherId }, { subjects: { some: { teacherId } } }]
    },
    select: { id: true }
  });
  return Boolean(klass);
};

const mapResult = (result: any) => ({
  id: result.id,
  studentId: result.studentId,
  studentName: result.student ? `${result.student.firstName} ${result.student.lastName}` : '',
  subjectId: result.subjectId,
  subjectName: result.subject?.name || '',
  classId: result.student?.classId || '',
  className: result.student?.class?.name || '',
  term: `term${result.term}`,
  academicYear: String(result.year),
  examScore: result.score,
  totalScore: result.score,
  grade: result.grade || gradeFromScore(result.score).grade,
  points: result.points || gradeFromScore(result.score).points,
  comment: result.remarks,
  enteredBy: result.teacherId || '',
  enteredByName: result.teacher ? `${result.teacher.firstName} ${result.teacher.lastName}` : '',
  enteredAt: result.createdAt
});

export const teacherController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      res.json({
        success: true,
        data: {
          id: teacher.id,
          userId: teacher.userId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.user?.email,
          phone: teacher.phone,
          photo: teacher.photo,
          avatar: teacher.photo || teacher.user?.avatar || null,
          subject: teacher.subject,
          specialization: teacher.specialization,
          qualification: teacher.qualification,
          experience: teacher.experience,
          classIds: teacher.classTeacher.map((klass) => klass.id),
          subjects: teacher.subjects.map((ts) => ts.subject.name)
        }
      });
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      res.status(500).json({ message: 'Unable to load teacher profile' });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const { phone, specialization, qualification, experience, photo } = req.body;
      const updated = await prisma.teacher.update({
        where: { id: teacher.id },
        data: { phone, specialization, qualification, experience, photo }
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      res.status(500).json({ message: 'Unable to update profile' });
    }
  },

  getClasses: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const classes = await getTeacherClasses(teacher.id);
      res.json({
        success: true,
        data: classes.map((klass) => ({
          id: klass.id,
          name: klass.name,
          stream: klass.stream,
          capacity: klass.capacity,
          studentCount: klass._count.students,
          classTeacherId: klass.classTeacherId,
          room: klass.timetable[0]?.room,
          subjects: klass.subjects.map((subjectClass) => ({
            id: subjectClass.subject.id,
            name: subjectClass.subject.name,
            code: subjectClass.subject.code,
            teacherId: subjectClass.teacherId || '',
            teacherName: subjectClass.teacher
              ? `${subjectClass.teacher.firstName} ${subjectClass.teacher.lastName}`
              : '',
            isClassTeacher: klass.classTeacherId === teacher.id
          })),
          timetable: klass.timetable.map((slot) => ({
            day: String(slot.dayOfWeek),
            period: 0,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject.name,
            room: slot.room
          }))
        }))
      });
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      res.status(500).json({ message: 'Unable to load classes' });
    }
  },

  getMyStudents: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const classIds = getAssignedClassIds(teacher);

      const where: any = {};
      if (classId) {
        if (!classIds.includes(classId as string)) return res.status(403).json({ message: 'Access denied to this class' });
        where.classId = classId as string;
      } else {
        where.classId = { in: classIds };
      }

      const students = await prisma.student.findMany({
        where,
        include: {
          user: true,
          class: true,
          parent: true,
          discipline: true,
          attendance: true,
          results: true,
          healthRecords: true
        },
        orderBy: { firstName: 'asc' }
      });

      res.json({
        success: true,
        data: students.map((student) => ({
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          name: `${student.firstName} ${student.lastName}`,
          classId: student.classId,
          className: student.class?.name,
          stream: student.stream || student.class?.stream,
          middleName: student.middleName,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          photo: student.photo,
          photoUrl: student.photo,
          email: student.user?.email,
          guardianName: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : '',
          guardianPhone: student.parent?.phone || '',
          guardianEmail: student.parent?.email,
          parentName: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : undefined,
          parentPhone: student.parent?.phone,
          parentEmail: student.parent?.email,
          hasMedicalAlerts: (student.healthRecords?.length || 0) > 0,
          hasDisciplineRecords: (student.discipline?.length || 0) > 0,
          medicalConditions: Array.isArray(student.medicalConditions) ? student.medicalConditions : [],
          medicalAlerts: [
            ...student.allergies,
            ...(Array.isArray(student.medicalConditions) ? student.medicalConditions.map(String) : [])
          ],
          attendanceSummary: {
            totalDays: student.attendance.length,
            presentDays: student.attendance.filter((item) => item.status === 'PRESENT').length,
            absentDays: student.attendance.filter((item) => item.status === 'ABSENT').length,
            lateDays: student.attendance.filter((item) => item.status === 'LATE').length,
            percentage: student.attendance.length
              ? Math.round((student.attendance.filter((item) => item.status === 'PRESENT').length / student.attendance.length) * 100)
              : 0
          },
          disciplineSummary: {
            merits: student.discipline.filter((item) => item.type === 'MERIT').length,
            demerits: student.discipline.filter((item) => item.type === 'DEMERIT').length,
            streaks: 0,
            warnings: student.discipline.filter((item) => item.type === 'WARNING').length
          },
          academicHistory: student.results
        }))
      });
    } catch (error) {
      console.error('Error loading teacher students:', error);
      res.status(500).json({ message: 'Unable to load students' });
    }
  },

  getClassStudents: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });

      const students = await prisma.student.findMany({
        where: { classId },
        include: {
          user: true,
          parent: true,
          discipline: true,
          healthRecords: true
        },
        orderBy: { firstName: 'asc' }
      });

      res.json({
        success: true,
        data: students.map((student) => ({
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          photo: student.photo,
          email: student.user?.email,
          parentName: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : undefined,
          parentPhone: student.parent?.phone,
          parentEmail: student.parent?.email,
          hasMedicalAlerts: (student.healthRecords?.length || 0) > 0,
          hasDisciplineRecords: (student.discipline?.length || 0) > 0,
          medicalConditions: Array.isArray(student.medicalConditions) ? student.medicalConditions : []
        }))
      });
    } catch (error) {
      console.error('Error loading class students:', error);
      res.status(500).json({ message: 'Unable to load students' });
    }
  },

  getStudentDetails: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { studentId } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          parent: true,
          class: true,
          results: { include: { subject: true }, orderBy: { createdAt: 'desc' } },
          attendance: { orderBy: { date: 'desc' }, take: 30 },
          discipline: true,
          healthRecords: true
        }
      });
      if (!student) return res.status(404).json({ message: 'Student not found' });

      if (!student.classId) return res.status(403).json({ message: 'Access denied' });

      const isTeacherStudent = await prisma.class.findFirst({
        where: { id: student.classId, classTeacherId: teacher.id }
      });
      if (!isTeacherStudent) return res.status(403).json({ message: 'Access denied' });

      res.json({
        success: true,
        data: {
          id: student.id,
          admissionNumber: student.admissionNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          photo: student.photo,
          email: student.user?.email,
          currentClass: student.class?.name,
          parent: student.parent
            ? {
                name: `${student.parent.firstName} ${student.parent.lastName}`,
                phone: student.parent.phone,
                email: student.parent.email
              }
            : undefined,
          results: student.results,
          attendance: student.attendance,
          discipline: student.discipline,
          medical: student.healthRecords
        }
      });
    } catch (error) {
      console.error('Error loading student details:', error);
      res.status(500).json({ message: 'Unable to load student details' });
    }
  },

  addStudentNote: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { studentId } = req.params;
      const { note, type } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const noteData = await prisma.studentNote.create({
        data: {
          studentId,
          teacherId: teacher.id,
          note,
          type: type || 'academic'
        }
      });

      res.json({ success: true, data: noteData });
    } catch (error) {
      console.error('Error adding student note:', error);
      res.status(500).json({ message: 'Unable to add note' });
    }
  },

  list: async (_req: Request, res: Response) => {
    try {
      const teachers = await prisma.teacher.findMany({
        include: {
          user: true,
          classTeacher: true,
          subjects: { include: { subject: true } }
        }
      });
      res.json({ data: teachers });
    } catch (error) {
      console.error('Error loading teachers:', error);
      res.status(500).json({ message: 'Unable to load teachers' });
    }
  },

  ranking: async (_req: Request, res: Response) => {
    try {
      const teachers = await prisma.teacher.findMany({ include: { results: true } });
      const data = teachers
        .map((teacher) => {
          const mean = teacher.results.length
            ? teacher.results.reduce((sum, result) => sum + result.score, 0) / teacher.results.length
            : 0;
          return {
            id: teacher.id,
            name: `${teacher.firstName} ${teacher.lastName}`,
            subject: teacher.subject,
            mean: Math.round(mean),
            resultEntries: teacher.results.length
          };
        })
        .sort((a, b) => b.mean - a.mean)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
      res.json({ data });
    } catch (error) {
      console.error('Error loading teacher ranking:', error);
      res.status(500).json({ message: 'Unable to load teacher ranking' });
    }
  },

  classes: async (req: Request, res: Response) => {
    try {
      const teacher = await prisma.teacher.findUnique({
        where: { id: req.params.id },
        include: { user: true, classTeacher: true }
      });
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

      const classList = teacher.classTeacher.map((klass) => ({
        id: klass.id,
        name: klass.name,
        stream: klass.stream,
        capacity: klass.capacity,
        classTeacherId: klass.classTeacherId
      }));

      res.json({
        teacher: {
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          subject: teacher.subject,
          email: teacher.user?.email
        },
        classes: classList
      });
    } catch (error) {
      console.error('Error loading teacher classes:', error);
      res.status(500).json({ message: 'Unable to load teacher classes' });
    }
  },

  dashboardStats: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const classIds = teacher.classTeacher.map((klass) => klass.id);
      const classesCount = classIds.length;
      const totalStudents = await prisma.student.count({ where: { classId: { in: classIds } } });
      const pendingHomework = await prisma.homework.count({ where: { teacherId: teacher.id, dueDate: { gte: today } } });
      const ungradedCount = await prisma.homeworkSubmission.count({ where: { homework: { teacherId: teacher.id }, grade: null } });
      const attendanceToMark = await prisma.attendance.count({
        where: {
          teacherId: teacher.id,
          date: today,
          status: 'ABSENT'
        }
      });
      const unreadMessages = await prisma.message.count({ where: { receiverId: userId, isRead: false } });
      const upcomingMeetings = await prisma.meeting.count({ where: { teacherId: teacher.id, date: { gte: today }, status: 'PENDING' } });
      const newNotifications = await prisma.notification.count({ where: { userId, isRead: false } });

      res.json({
        success: true,
        data: {
          classesCount,
          totalStudents,
          pendingHomework,
          ungradedAssignments: ungradedCount,
          attendanceToMark,
          unreadMessages,
          upcomingMeetings,
          newNotifications
        }
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      res.status(500).json({ message: 'Unable to load dashboard stats' });
    }
  },

  getTodayTimetable: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const today = new Date();
      const dayOfWeek = today.getDay();
      const entries = await prisma.timetable.findMany({
        where: { teacherId: teacher.id, dayOfWeek },
        include: { class: true, subject: true },
        orderBy: { startTime: 'asc' }
      });

      res.json({
        success: true,
        data: entries.map((entry) => ({
          id: entry.id,
          classId: entry.classId,
          subject: entry.subject?.name,
          className: entry.class?.name,
          room: entry.room,
          startTime: entry.startTime,
          endTime: entry.endTime,
          term: entry.term,
          year: entry.year
        }))
      });
    } catch (error) {
      console.error('Error loading today timetable:', error);
      res.status(500).json({ message: 'Unable to load timetable' });
    }
  },

  getWeeklyTimetable: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const schedule: Record<number, any[]> = {};
      for (let day = 0; day < 7; day += 1) {
        const entries = await prisma.timetable.findMany({
          where: { teacherId: teacher.id, dayOfWeek: day },
          include: { class: true, subject: true },
          orderBy: { startTime: 'asc' }
        });
        schedule[day] = entries.map((entry) => ({
          id: entry.id,
          classId: entry.classId,
          subject: entry.subject?.name,
          className: entry.class?.name,
          room: entry.room,
          startTime: entry.startTime,
          endTime: entry.endTime,
          term: entry.term,
          year: entry.year
        }));
      }

      res.json({ success: true, data: schedule });
    } catch (error) {
      console.error('Error loading weekly timetable:', error);
      res.status(500).json({ message: 'Unable to load weekly timetable' });
    }
  },

  getHomework: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const homework = await prisma.homework.findMany({
        where: { teacherId: teacher.id },
        include: { class: true, subject: true, submissions: { include: { student: true } } },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: homework.map((hw) => ({
          id: hw.id,
          title: hw.title,
          description: hw.description,
          subject: hw.subject?.name,
          className: hw.class?.name,
          dueDate: hw.dueDate,
          attachments: hw.attachments,
          status: hw.status,
          submissionCount: hw.submissions.length
        }))
      });
    } catch (error) {
      console.error('Error loading homework:', error);
      res.status(500).json({ message: 'Unable to load homework' });
    }
  },

  createHomework: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { title, description, classId, subjectId, dueDate, attachments } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const homework = await prisma.homework.create({
        data: {
          title,
          description,
          teacherId: teacher.id,
          classId,
          subjectId,
          dueDate: new Date(dueDate),
          attachments: Array.isArray(attachments) ? attachments : []
        },
        include: { class: true, subject: true }
      });

      res.json({ success: true, data: homework });
    } catch (error) {
      console.error('Error creating homework:', error);
      res.status(500).json({ message: 'Unable to create homework' });
    }
  },

  updateHomework: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { id } = req.params;
      const { title, description, dueDate, attachments } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const homework = await prisma.homework.findUnique({ where: { id } });
      if (!homework || homework.teacherId !== teacher.id) return res.status(404).json({ message: 'Homework not found' });

      const updated = await prisma.homework.update({
        where: { id },
        data: {
          title,
          description,
          dueDate: new Date(dueDate),
          attachments: Array.isArray(attachments) ? attachments : []
        },
        include: { class: true, subject: true }
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating homework:', error);
      res.status(500).json({ message: 'Unable to update homework' });
    }
  },

  deleteHomework: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { id } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const homework = await prisma.homework.findUnique({ where: { id } });
      if (!homework || homework.teacherId !== teacher.id) return res.status(404).json({ message: 'Homework not found' });

      await prisma.homework.delete({ where: { id } });
      res.json({ success: true, message: 'Homework deleted' });
    } catch (error) {
      console.error('Error deleting homework:', error);
      res.status(500).json({ message: 'Unable to delete homework' });
    }
  },

  getHomeworkSubmissions: async (req: Request, res: Response) => {
    try {
      const { homeworkId } = req.params;
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const homework = await prisma.homework.findUnique({
        where: { id: homeworkId },
        include: { submissions: { include: { student: true } } }
      });
      if (!homework || homework.teacherId !== teacher.id) return res.status(404).json({ message: 'Homework not found' });

      res.json({ success: true, data: homework.submissions });
    } catch (error) {
      console.error('Error loading submissions:', error);
      res.status(500).json({ message: 'Unable to load submissions' });
    }
  },

  gradeSubmission: async (req: Request, res: Response) => {
    try {
      const { submissionId } = req.params;
      const { grade, feedback } = req.body;
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const submission = await prisma.homeworkSubmission.findUnique({
        where: { id: submissionId },
        include: { homework: true }
      });
      if (!submission || submission.homework.teacherId !== teacher.id) return res.status(404).json({ message: 'Submission not found' });

      const updated = await prisma.homeworkSubmission.update({
        where: { id: submissionId },
        data: { grade: Number(grade), feedback, gradedAt: new Date() },
        include: { student: true, homework: true }
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error grading submission:', error);
      res.status(500).json({ message: 'Unable to grade submission' });
    }
  },

  getAnnouncements: async (_req: Request, res: Response) => {
    try {
      const announcements = await prisma.announcement.findMany({
        where: { OR: [{ audience: 'all' }, { audience: 'teachers' }] },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: announcements });
    } catch (error) {
      console.error('Error loading announcements:', error);
      res.status(500).json({ message: 'Unable to load announcements' });
    }
  },

  createAnnouncement: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { schoolId, title, content, audience, publishedAt, expiresAt } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      if (!schoolId) return res.status(400).json({ message: 'schoolId is required' });

      const announcement = await prisma.announcement.create({
        data: {
          schoolId,
          title,
          content,
          audience: audience || 'teachers',
          isUrgent: false,
          sendWhatsApp: false,
          sendSMS: false,
          sendEmail: false,
          sendPush: false,
          whatsappGroupId: null,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: userId
        }
      });

      res.json({ success: true, data: announcement });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Unable to create announcement' });
    }
  },

  getMessages: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const type = String(req.query.type || 'inbox');
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const messages = await prisma.message.findMany({
        where: type === 'sent' ? { senderId: userId } : { receiverId: userId },
        include: { sender: true, receiver: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Error loading messages:', error);
      res.status(500).json({ message: 'Unable to load messages' });
    }
  },

  sendMessage: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { receiverId, message, attachment } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const sent = await prisma.message.create({
        data: {
          senderId: userId,
          receiverId,
          message: String(message || ''),
          attachment: attachment ? String(attachment) : null,
          status: 'SENT'
        },
        include: { sender: true, receiver: true }
      });

      res.json({ success: true, data: sent });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Unable to send message' });
    }
  },

  markMessageAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await prisma.message.update({
        where: { id },
        data: { isRead: true }
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Unable to mark message as read' });
    }
  },

  getMeetings: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const type = String(req.query.type || 'all');
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const meetings = await prisma.meeting.findMany({
        where: type === 'scheduled' ? { teacherId: teacher.id, status: 'PENDING' } : { teacherId: teacher.id },
        include: { parent: true, student: true },
        orderBy: { date: 'desc' }
      });

      res.json({ success: true, data: meetings });
    } catch (error) {
      console.error('Error loading meetings:', error);
      res.status(500).json({ message: 'Unable to load meetings' });
    }
  },

  scheduleMeeting: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { parentId, studentId, date, duration, subject, description, location, notes } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const meeting = await prisma.meeting.create({
        data: {
          teacherId: teacher.id,
          parentId,
          studentId,
          subject: subject || 'Parent teacher meeting',
          description,
          date: new Date(date),
          duration: Number(duration) || 30,
          status: 'PENDING',
          location,
          notes
        },
        include: { parent: true, student: true }
      });

      res.json({ success: true, data: meeting });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      res.status(500).json({ message: 'Unable to schedule meeting' });
    }
  },

  updateMeetingStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const updated = await prisma.meeting.update({
        where: { id },
        data: { status, notes }
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({ message: 'Unable to update meeting' });
    }
  },

  getNotifications: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const unreadOnly = String(req.query.unreadOnly || 'false') === 'true';
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const notifications = await prisma.notification.findMany({
        where: unreadOnly ? { userId, isRead: false } : { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.json({ success: true, data: notifications });
    } catch (error) {
      console.error('Error loading notifications:', error);
      res.status(500).json({ message: 'Unable to load notifications' });
    }
  },

  markNotificationAsRead: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Unable to mark notification as read' });
    }
  },

  markAllNotificationsAsRead: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Unable to mark notifications as read' });
    }
  },

  updateAnnouncement: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { id } = req.params;
      const { title, content, audience, expiresAt } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const updated = await prisma.announcement.update({
        where: { id },
        data: { title, content, audience, expiresAt: expiresAt ? new Date(expiresAt) : undefined }
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Unable to update announcement' });
    }
  },

  deleteAnnouncement: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { id } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      await prisma.announcement.delete({ where: { id } });
      res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Unable to delete announcement' });
    }
  },

  sendBulkMessage: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId, parentIds, subject, message } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const classIds = teacher.classTeacher.map((klass: any) => klass.id);
      const targetClassId = classId || classIds[0];

      const parents = parentIds
        ? await prisma.parent.findMany({ where: { id: { in: parentIds } } })
        : await prisma.parent.findMany({
            where: { students: { some: { classId: targetClassId } } }
          });

      const messages = await Promise.all(
        parents.map((parent) =>
          prisma.message.create({
            data: {
              senderId: userId,
              receiverId: parent.userId,
              message: String(subject || ''),
              status: 'SENT'
            }
          })
        )
      );

      res.json({ success: true, data: { count: messages.length } });
    } catch (error) {
      console.error('Error sending bulk message:', error);
      res.status(500).json({ message: 'Unable to send bulk message' });
    }
  },

  getDashboard: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const classIds = getAssignedClassIds(teacher);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const [classesCount, totalStudents, pendingHomework, unmarkedTests, presentToday, attendanceToday, upcomingMeetings, todayClasses, tasks, alerts, recentMessages, announcements] = await Promise.all([
        prisma.class.count({ where: { id: { in: classIds } } }),
        prisma.student.count({ where: { classId: { in: classIds } } }),
        prisma.homework.count({ where: { teacherId: teacher.id, dueDate: { gte: today } } }),
        prisma.homeworkSubmission.count({ where: { homework: { teacherId: teacher.id }, grade: null } }),
        prisma.attendance.count({ where: { teacherId: teacher.id, date: { gte: today, lt: tomorrow }, status: AttendanceStatus.PRESENT } }),
        prisma.attendance.count({ where: { teacherId: teacher.id, date: { gte: today, lt: tomorrow } } }),
        prisma.meeting.count({ where: { teacherId: teacher.id, date: { gte: today }, status: { in: ['PENDING', 'CONFIRMED'] } } }),
        prisma.timetable.findMany({
          where: { teacherId: teacher.id, dayOfWeek: new Date().getDay() },
          include: { class: { include: { _count: { select: { students: true } } } }, subject: true },
          orderBy: { startTime: 'asc' }
        }),
        prisma.homework.findMany({
          where: { teacherId: teacher.id, dueDate: { gte: today } },
          include: { submissions: true, class: true },
          orderBy: { dueDate: 'asc' },
          take: 8
        }),
        prisma.notification.findMany({ where: { userId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 8 }),
        prisma.message.findMany({ where: { receiverId: userId }, include: { sender: true, receiver: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
        prisma.announcement.findMany({ where: { OR: [{ audience: 'all' }, { audience: 'teachers' }] }, orderBy: { createdAt: 'desc' }, take: 5 })
      ]);

      const quickStats = {
        totalClasses: classesCount,
        totalStudents,
        pendingHomework,
        unmarkedTests,
        todayAttendance: attendanceToday ? Math.round((presentToday / attendanceToday) * 100) : 0,
        upcomingMeetings
      };

      res.json({
        success: true,
        data: {
          quickStats,
          todayClasses: todayClasses.map((entry) => ({
            subject: entry.subject.name,
            className: entry.class.name,
            stream: entry.class.stream || '',
            time: `${entry.startTime} - ${entry.endTime}`,
            room: entry.room,
            studentCount: entry.class._count.students
          })),
          pendingTasks: tasks.map((task) => ({
            id: task.id,
            type: 'homework',
            title: task.title,
            dueDate: task.dueDate,
            priority: task.dueDate < tomorrow ? 'high' : 'normal',
            count: task.submissions.length
          })),
          alerts: alerts.map((alert) => ({
            id: alert.id,
            type: String(alert.type).toLowerCase(),
            title: alert.title,
            message: alert.message,
            isRead: alert.isRead,
            createdAt: alert.createdAt
          })),
          recentMessages,
          announcements
        }
      });
    } catch (error) {
      console.error('Error loading teacher dashboard:', error);
      res.status(500).json({ message: 'Unable to load teacher dashboard' });
    }
  },

   markBulkAttendance: async (req: Request, res: Response) => {
     try {
       const userId = getRequestUserId(req);
       const { classId, date, records } = req.body;
       if (!userId) return res.status(401).json({ message: 'Unauthorized' });
       const teacher = await getTeacherFromUser(userId);
       if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
       if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });
       if (!Array.isArray(records)) return res.status(400).json({ message: 'records must be an array' });

       const attendanceDate = date ? new Date(date) : new Date();
       
       // Convert records to the format expected by automation service
       const attendanceData = records.map((record: any) => ({
         studentId: record.studentId,
         status: String(record.status || 'PRESENT').toUpperCase() as AttendanceStatus,
         notes: record.notes
       }));

       // Use automation service for automatic notifications and processing
       const results = await markAttendanceAndNotify(
         classId,
         teacher.id,
         attendanceData,
         attendanceDate
       );

       res.json({ success: true, data: results });
     } catch (error) {
       console.error('Error marking bulk attendance:', error);
       res.status(500).json({ message: 'Unable to mark attendance' });
     }
   },

  getGrades: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId, subjectId, term, year } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (classId && !(await ensureAssignedClass(teacher.id, String(classId)))) return res.status(403).json({ message: 'Access denied to this class' });

      const results = await prisma.result.findMany({
        where: {
          teacherId: teacher.id,
          ...(subjectId ? { subjectId: String(subjectId) } : {}),
          ...(term ? { term: parseTerm(term) } : {}),
          ...(year ? { year: parseYear(year) } : {}),
          ...(classId ? { student: { classId: String(classId) } } : {})
        },
        include: { student: { include: { class: true } }, subject: true, teacher: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: results.map(mapResult) });
    } catch (error) {
      console.error('Error loading grades:', error);
      res.status(500).json({ message: 'Unable to load grades' });
    }
  },

   enterGrades: async (req: Request, res: Response) => {
     try {
       const userId = getRequestUserId(req);
       const { classId, subjectId, term, year, examType, grades } = req.body;
       if (!userId) return res.status(401).json({ message: 'Unauthorized' });
       const teacher = await getTeacherFromUser(userId);
       if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
       if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });
       if (!Array.isArray(grades)) return res.status(400).json({ message: 'grades must be an array' });

       // Convert grades to the format expected by automation service
       const gradesData = grades.map((entry: any) => {
         // Handle different possible field names for scores
         const rawScore = [
           entry.cat1,
           entry.cat1Score,
           entry.cat2,
           entry.cat2Score,
           entry.cat3,
           entry.cat3Score,
           entry.exam,
           entry.examScore,
           entry.score
         ].find((value) => value !== undefined && value !== null && value !== '');
         const score = Number(rawScore);
         
         return {
           studentId: entry.studentId,
           score: isNaN(score) ? 0 : score,
           remarks: entry.comment
         };
       }).filter(entry => !isNaN(entry.score) && entry.score !== null);

       // Use automation service for automatic notifications and processing
       const results = await publishGradesAndNotify(
         teacher.id,
         subjectId,
         classId,
         examTypeFromString(examType || 'END_TERM'),
         gradesData,
         parseTerm(term),
         parseYear(year)
       );

       res.json({ success: true, data: results.map(mapResult) });
     } catch (error) {
       console.error('Error entering grades:', error);
       res.status(500).json({ message: 'Unable to enter grades' });
     }
   },

  updateGrade: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { gradeId } = req.params;
      const score = Number(req.body.exam ?? req.body.examScore ?? req.body.score);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const result = await prisma.result.findUnique({ where: { id: gradeId } });
      if (!result || result.teacherId !== teacher.id) return res.status(404).json({ message: 'Grade not found' });
      const grade = gradeFromScore(score);
      const updated = await prisma.result.update({
        where: { id: gradeId },
        data: { score, grade: grade.grade, points: grade.points, remarks: req.body.comment ?? req.body.remarks },
        include: { student: { include: { class: true } }, subject: true, teacher: true }
      });
      res.json({ success: true, data: mapResult(updated) });
    } catch (error) {
      console.error('Error updating grade:', error);
      res.status(500).json({ message: 'Unable to update grade' });
    }
  },

  getGradeSummary: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId } = req.params;
      const { subjectId, term, year } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });

      const results = await prisma.result.findMany({
        where: {
          teacherId: teacher.id,
          ...(subjectId ? { subjectId: String(subjectId) } : {}),
          term: parseTerm(term),
          year: parseYear(year),
          student: { classId }
        },
        include: { student: true, subject: true }
      });
      const distribution: Record<string, number> = { A: 0, Aminus: 0, Bplus: 0, B: 0, Bminus: 0, Cplus: 0, C: 0, Cminus: 0, Dplus: 0, D: 0, Dminus: 0, E: 0 };
      results.forEach((result) => {
        const key = (result.grade || 'E').replace('+', 'plus').replace('-', 'minus');
        distribution[key] = (distribution[key] || 0) + 1;
      });
      const top = results.slice().sort((a, b) => b.score - a.score)[0];
      res.json({
        success: true,
        data: {
          subject: results[0]?.subject?.name || 'Subject',
          class: classId,
          term: `Term ${parseTerm(term)}`,
          year: String(parseYear(year)),
          totalStudents: new Set(results.map((result) => result.studentId)).size,
          meanScore: results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 0,
          gradeDistribution: distribution,
          topScorer: top ? { studentId: top.studentId, studentName: `${top.student.firstName} ${top.student.lastName}`, score: top.score } : undefined
        }
      });
    } catch (error) {
      console.error('Error loading grade summary:', error);
      res.status(500).json({ message: 'Unable to load grade summary' });
    }
  },

  generateReportCard: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId } = req.params;
      const { term, year } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });

      const students = await prisma.student.findMany({
        where: { classId },
        include: { results: { where: { term: parseTerm(term), year: parseYear(year) }, include: { subject: true } }, parent: true }
      });
      const cards = students.map((student) => ({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        parentName: student.parent ? `${student.parent.firstName} ${student.parent.lastName}` : '',
        results: student.results.map(mapResult),
        meanScore: student.results.length ? Math.round(student.results.reduce((sum, result) => sum + result.score, 0) / student.results.length) : 0
      }));
      res.json({ success: true, data: { classId, term: parseTerm(term), year: parseYear(year), cards } });
    } catch (error) {
      console.error('Error generating report cards:', error);
      res.status(500).json({ message: 'Unable to generate report cards' });
    }
  },

  getLessonPlans: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { subjectId, classId } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const lessons = await prisma.teacherLessonPlan.findMany({
        where: { teacherId: teacher.id, ...(subjectId ? { subjectId: String(subjectId) } : {}), ...(classId ? { classId: String(classId) } : {}) },
        include: { class: true, subject: true, teacher: true },
        orderBy: { date: 'desc' }
      });
      res.json({ success: true, data: lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        subjectId: lesson.subjectId,
        subjectName: lesson.subject.name,
        classId: lesson.classId,
        className: lesson.class.name,
        date: lesson.date,
        duration: lesson.duration,
        objectives: lesson.objectives,
        materials: lesson.materials,
        activities: lesson.activities,
        assessment: lesson.assessment,
        resources: lesson.resources,
        reflections: lesson.reflections,
        sharedWithHOD: lesson.sharedWithHOD,
        sharedWithStudents: lesson.sharedWithStudents,
        status: String(lesson.status).toLowerCase(),
        createdBy: lesson.teacherId,
        createdByName: `${lesson.teacher.firstName} ${lesson.teacher.lastName}`,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt
      })) });
    } catch (error) {
      console.error('Error loading lesson plans:', error);
      res.status(500).json({ message: 'Unable to load lesson plans' });
    }
  },

  createLessonPlan: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (!(await ensureAssignedClass(teacher.id, req.body.classId))) return res.status(403).json({ message: 'Access denied to this class' });

      const lesson = await prisma.teacherLessonPlan.create({
        data: {
          teacherId: teacher.id,
          classId: req.body.classId,
          subjectId: req.body.subjectId,
          title: req.body.title,
          date: new Date(req.body.date),
          duration: Number(req.body.duration) || 40,
          objectives: Array.isArray(req.body.objectives) ? req.body.objectives : [],
          materials: Array.isArray(req.body.materials) ? req.body.materials : [],
          activities: req.body.activities || [],
          assessment: req.body.assessment,
          resources: Array.isArray(req.body.resources) ? req.body.resources : []
        }
      });
      res.json({ success: true, data: lesson });
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      res.status(500).json({ message: 'Unable to create lesson plan' });
    }
  },

  updateLessonPlan: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { lessonId } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const existing = await prisma.teacherLessonPlan.findUnique({ where: { id: lessonId } });
      if (!existing || existing.teacherId !== teacher.id) return res.status(404).json({ message: 'Lesson plan not found' });
      const updated = await prisma.teacherLessonPlan.update({
        where: { id: lessonId },
        data: {
          title: req.body.title,
          date: req.body.date ? new Date(req.body.date) : undefined,
          duration: req.body.duration ? Number(req.body.duration) : undefined,
          objectives: Array.isArray(req.body.objectives) ? req.body.objectives : undefined,
          materials: Array.isArray(req.body.materials) ? req.body.materials : undefined,
          activities: req.body.activities,
          assessment: req.body.assessment,
          resources: Array.isArray(req.body.resources) ? req.body.resources : undefined,
          reflections: req.body.reflections,
          status: req.body.status ? String(req.body.status).toUpperCase() as TeacherWorkflowStatus : undefined
        }
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating lesson plan:', error);
      res.status(500).json({ message: 'Unable to update lesson plan' });
    }
  },

  deleteLessonPlan: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { lessonId } = req.params;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const existing = await prisma.teacherLessonPlan.findUnique({ where: { id: lessonId } });
      if (!existing || existing.teacherId !== teacher.id) return res.status(404).json({ message: 'Lesson plan not found' });
      await prisma.teacherLessonPlan.delete({ where: { id: lessonId } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting lesson plan:', error);
      res.status(500).json({ message: 'Unable to delete lesson plan' });
    }
  },

  shareLessonPlan: async (req: Request, res: Response) => {
    try {
      const { lessonId } = req.params;
      const updated = await prisma.teacherLessonPlan.update({
        where: { id: lessonId },
        data: { sharedWithHOD: Boolean(req.body.shareWithHOD), sharedWithStudents: Boolean(req.body.shareWithStudents), status: TeacherWorkflowStatus.PUBLISHED }
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error sharing lesson plan:', error);
      res.status(500).json({ message: 'Unable to share lesson plan' });
    }
  },

  getClassTimetable: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const classId = req.params.classId || req.params.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });
      const timetable = await prisma.timetable.findMany({ where: { classId }, include: { subject: true, teacher: true, class: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
      res.json({ success: true, data: timetable });
    } catch (error) {
      console.error('Error loading class timetable:', error);
      res.status(500).json({ message: 'Unable to load class timetable' });
    }
  },

  getWeeklyTeacherTimetable: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const slots = await prisma.timetable.findMany({ where: { teacherId: teacher.id }, include: { subject: true, class: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
      res.json({
        success: true,
        data: {
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          week: Number(req.query.week || 1),
          year: parseYear(req.query.year),
          slots: slots.map((slot) => ({
            day: String(slot.dayOfWeek),
            period: 0,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject: slot.subject.name,
            class: slot.class.name,
            room: slot.room
          }))
        }
      });
    } catch (error) {
      console.error('Error loading teacher timetable:', error);
      res.status(500).json({ message: 'Unable to load teacher timetable' });
    }
  },

  createTeacherRequest: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (req.body.classId && !(await ensureAssignedClass(teacher.id, req.body.classId))) return res.status(403).json({ message: 'Access denied to this class' });
      const request = await prisma.teacherRequest.create({
        data: {
          teacherId: teacher.id,
          type: (String(req.body.type || 'SUPPORT').toUpperCase() in TeacherRequestType ? String(req.body.type || 'SUPPORT').toUpperCase() : 'SUPPORT') as TeacherRequestType,
          title: req.body.title || req.body.reason || 'Teacher request',
          description: req.body.description || req.body.reason || '',
          classId: req.body.classId,
          subjectId: req.body.subjectId,
          scheduledAt: req.body.date || req.body.requestedDate ? new Date(req.body.date || req.body.requestedDate) : undefined,
          payload: req.body as Prisma.InputJsonObject
        }
      });
      res.json({ success: true, data: request });
    } catch (error) {
      console.error('Error creating teacher request:', error);
      res.status(500).json({ message: 'Unable to create teacher request' });
    }
  },

  getNotificationPreferences: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const preferences = await prisma.teacherNotificationPreference.upsert({
        where: { teacherId: teacher.id },
        create: { teacherId: teacher.id },
        update: {}
      });
      res.json({ success: true, data: preferences });
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      res.status(500).json({ message: 'Unable to load notification preferences' });
    }
  },

  updateNotificationPreferences: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const updated = await prisma.teacherNotificationPreference.upsert({
        where: { teacherId: teacher.id },
        create: { teacherId: teacher.id, ...req.body },
        update: req.body
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ message: 'Unable to update notification preferences' });
    }
  },

  generateClassReport: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      const { classId } = req.params;
      const { type, term, year } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      if (!(await ensureAssignedClass(teacher.id, classId))) return res.status(403).json({ message: 'Access denied to this class' });
      const [students, results, attendance, discipline, homework] = await Promise.all([
        prisma.student.findMany({ where: { classId } }),
        prisma.result.findMany({ where: { student: { classId }, term: parseTerm(term), year: parseYear(year) }, include: { student: true, subject: true } }),
        prisma.attendance.findMany({ where: { classId } }),
        prisma.discipline.findMany({ where: { student: { classId } }, include: { student: true } }),
        prisma.homework.findMany({ where: { classId, teacherId: teacher.id }, include: { submissions: true } })
      ]);
      const reportData = { students, results: results.map(mapResult), attendance, discipline, homework };
      const summary = {
        totalStudents: students.length,
        meanScore: results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 0,
        attendanceRate: attendance.length ? Math.round((attendance.filter((item) => item.status === 'PRESENT').length / attendance.length) * 100) : 0
      };
      const archive = await prisma.teacherReportArchive.create({
        data: {
          teacherId: teacher.id,
          name: `${String(type || 'class_performance')} report`,
          type: String(type || 'class_performance'),
          filters: { classId, term, year } as Prisma.InputJsonObject,
          data: reportData as Prisma.InputJsonObject,
          summary: summary as Prisma.InputJsonObject
        }
      });
      res.json({ success: true, data: { id: archive.id, name: archive.name, type: archive.type, filters: archive.filters, data: reportData, summary, generatedBy: teacher.id, generatedAt: archive.generatedAt } });
    } catch (error) {
      console.error('Error generating class report:', error);
      res.status(500).json({ message: 'Unable to generate class report' });
    }
  },

  generateStudentReport: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const student = await prisma.student.findUnique({ where: { id: studentId }, include: { results: { include: { subject: true, student: true } }, attendance: true, discipline: true } });
      if (!student) return res.status(404).json({ message: 'Student not found' });
      res.json({ success: true, data: student });
    } catch (error) {
      console.error('Error generating student report:', error);
      res.status(500).json({ message: 'Unable to generate student report' });
    }
  },

  generateSubjectReport: async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const results = await prisma.result.findMany({ where: { subjectId }, include: { student: true, subject: true } });
      res.json({ success: true, data: { subjectId, results: results.map(mapResult), count: results.length } });
    } catch (error) {
      console.error('Error generating subject report:', error);
      res.status(500).json({ message: 'Unable to generate subject report' });
    }
  },

  exportReport: async (req: Request, res: Response) => {
    try {
      const report = await prisma.teacherReportArchive.findUnique({ where: { id: req.params.reportId } });
      if (!report) return res.status(404).json({ message: 'Report not found' });
      res.json({ success: true, data: { url: `/api/teacher/reports/${report.id}/download?format=${req.query.format || 'pdf'}`, report } });
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ message: 'Unable to export report' });
    }
  },

  getExamTimetable: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const slots = await prisma.timetable.findMany({ where: { teacherId: teacher.id }, include: { subject: true, class: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] });
      res.json({ success: true, data: { id: 'teacher-exam-schedule', name: 'Teacher Exam Schedule', exams: slots.map((slot) => ({
        id: slot.id,
        examId: `exam-${slot.term}-${slot.year}`,
        subjectId: slot.subjectId,
        subjectName: slot.subject.name,
        classId: slot.classId,
        className: slot.class.name,
        date: new Date().toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        invigilators: [`${teacher.firstName} ${teacher.lastName}`]
      })) } });
    } catch (error) {
      console.error('Error loading exam timetable:', error);
      res.status(500).json({ message: 'Unable to load exam timetable' });
    }
  },

  getInvigilationDuties: async (req: Request, res: Response) => {
    return teacherController.getExamTimetable(req, res);
  },

  reportExamIrregularity: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const incident = await prisma.teacherExamIncident.create({
        data: {
          teacherId: teacher.id,
          examId: req.body.examId,
          studentId: req.body.studentId,
          classId: req.body.classId,
          subjectId: req.body.subjectId,
          type: req.body.type || 'irregularity',
          description: req.body.description,
          action: req.body.action
        }
      });
      res.json({ success: true, data: incident });
    } catch (error) {
      console.error('Error reporting exam irregularity:', error);
      res.status(500).json({ message: 'Unable to report exam irregularity' });
    }
  },

  listWorkspaceRecords: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const records = await prisma.teacherWorkspaceRecord.findMany({
        where: { teacherId: teacher.id, ...(req.query.section ? { section: String(req.query.section) } : {}) },
        orderBy: { updatedAt: 'desc' }
      });
      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Error loading teacher workspace records:', error);
      res.status(500).json({ message: 'Unable to load records' });
    }
  },

  createWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const userId = getRequestUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });
      const record = await prisma.teacherWorkspaceRecord.create({
        data: {
          teacherId: teacher.id,
          section: req.body.section,
          item: req.body.item || req.body.section,
          title: req.body.title,
          content: req.body.content,
          payload: (req.body.payload || {}) as Prisma.InputJsonObject,
          status: req.body.status ? String(req.body.status).toUpperCase() as TeacherWorkflowStatus : TeacherWorkflowStatus.PENDING
        }
      });
      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error creating teacher workspace record:', error);
      res.status(500).json({ message: 'Unable to create record' });
    }
  },

  updateWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const record = await prisma.teacherWorkspaceRecord.update({
        where: { id: req.params.recordId },
        data: {
          title: req.body.title,
          content: req.body.content,
          payload: req.body.payload as Prisma.InputJsonObject,
          status: req.body.status ? String(req.body.status).toUpperCase() as TeacherWorkflowStatus : undefined
        }
      });
      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error updating teacher workspace record:', error);
      res.status(500).json({ message: 'Unable to update record' });
    }
  },

  deleteWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      await prisma.teacherWorkspaceRecord.delete({ where: { id: req.params.recordId } });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting teacher workspace record:', error);
      res.status(500).json({ message: 'Unable to delete record' });
    }
  },
};
