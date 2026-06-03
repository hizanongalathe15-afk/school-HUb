import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const studentController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, search } = req.query as any;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { admissionNumber: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where,
          skip,
          take: Number(limit),
          include: { parent: true, class: true, fees: true },
        }),
        prisma.student.count({ where })
      ]);

      res.json({
        success: true,
        data: students,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id: req.params.id },
        include: { parent: true, fees: true, results: true, class: true },
      });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json({ success: true, data: student });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, middleName, dateOfBirth, gender, classId, parentId, photo, phone, admissionNumber } = req.body;
      const student = await prisma.student.create({
        data: {
          firstName,
          lastName,
          middleName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
          gender,
          classId,
          parentId,
          photo,
          phone,
          admissionNumber: admissionNumber || `ADM-${Date.now()}`
        },
      });
      res.status(201).json({ success: true, data: student });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, middleName, dateOfBirth, gender, classId, parentId, photo, phone } = req.body;
      const student = await prisma.student.update({
        where: { id: req.params.id },
        data: {
          firstName,
          lastName,
          middleName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          classId,
          parentId,
          photo,
          phone
        },
      });
      res.json({ success: true, data: student });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await prisma.student.update({
        where: { id: req.params.id },
        data: { isActive: false }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  search: async (req: Request, res: Response) => {
    try {
      const { q } = req.query as any;
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { admissionNumber: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 20
      });
      res.json({ success: true, data: students });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getByClass: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const students = await prisma.student.findMany({
        where: { classId, isActive: true },
        include: { parent: true }
      });
      res.json({ success: true, data: students });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  bulkImport: async (req: Request, res: Response) => {
    try {
      const { students } = req.body as { students: any[] };
      const created = await prisma.student.createMany({
        data: students.map((s) => ({
          ...s,
          dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : new Date(),
          enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate) : new Date(),
        })),
        skipDuplicates: true
      });
      res.status(201).json({ success: true, count: created.count });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getResults: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { termId } = req.query;
      
      const where: any = { studentId };
      if (termId) where.term = Number(termId);

      const results = await prisma.result.findMany({
        where,
        include: { subject: true }
      });
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getAttendance: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { month, year } = req.query as { month?: string; year?: string };
      
      const where: any = { studentId };
      const monthNum = Number(month);
      const yearNum = Number(year || new Date().getFullYear());
      if (monthNum) where.date = { gte: new Date(yearNum, monthNum - 1, 1) };

      const attendance = await prisma.attendance.findMany({ where });
      res.json({ success: true, data: attendance });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getFeeBalance: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { fees: true }
      });
      
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const fees = student.fees;
      const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);
      const paidAmount = fees.filter(f => f.status === 'COMPLETED').reduce((sum, f) => sum + f.amount, 0);

      res.json({
        success: true,
        data: {
          studentId,
          totalFee,
          paidAmount,
          balance: totalFee - paidAmount
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getDiscipline: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const discipline = await prisma.discipline.findMany({
        where: { studentId }
      });
      res.json({ success: true, data: discipline });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getParents: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { parent: true }
      });
      res.json({ success: true, data: student?.parent || null });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  linkParent: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { parentId } = req.body;
      
      const student = await prisma.student.update({
        where: { id: studentId },
        data: { parentId }
      });
      res.json({ success: true, data: student });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

  getTimetable: async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true }
      });

      if (!student || !student.classId) {
        return res.status(404).json({ message: 'Student or class not found' });
      }

      const dayNames: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[] = 
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      const entries = await prisma.timetable.findMany({
        where: { classId: student.classId },
        include: { subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });

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
          entries: mappedEntries,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};