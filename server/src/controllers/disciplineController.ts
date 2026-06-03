import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getTeacherFromUser = async (userId: string) => {
  return prisma.teacher.findUnique({
    where: { userId },
    include: {
      classTeacher: true,
      user: true
    }
  });
};

export const disciplineController = {
  getRecords: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { classId, studentId } = req.query;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const teacher = await getTeacherFromUser(userId);
      if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

      const classIds = teacher.classTeacher.map((klass: any) => klass.id);

      const where: any = {};
      if (classId && classIds.includes(classId as string)) {
        where.student = { classId: classId as string };
      } else if (studentId) {
        where.studentId = studentId as string;
      } else {
        where.student = { classId: { in: classIds } };
      }

      const records = await prisma.discipline.findMany({
        where,
        include: { student: true }
      });

      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Error loading discipline records:', error);
      res.status(500).json({ message: 'Unable to load discipline records' });
    }
  },

  recordMerit: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { studentId, category, description, points } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const record = await prisma.discipline.create({
        data: {
          studentId,
          category,
          description,
          points: Number(points) || 10,
          type: 'MERIT',
          recordedBy: userId,
          date: new Date()
        },
        include: { student: true }
      });

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error recording merit:', error);
      res.status(500).json({ message: 'Unable to record merit' });
    }
  },

  recordDemerit: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { studentId, category, description, points, action } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const record = await prisma.discipline.create({
        data: {
          studentId,
          category,
          description,
          points: Number(points) || 10,
          action,
          type: 'DEMERIT',
          recordedBy: userId,
          date: new Date()
        },
        include: { student: true }
      });

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error recording demerit:', error);
      res.status(500).json({ message: 'Unable to record demerit' });
    }
  },

  recordWarning: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { studentId, category, description, action } = req.body;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const record = await prisma.discipline.create({
        data: {
          studentId,
          category,
          description,
          action,
          type: 'WARNING',
          recordedBy: userId,
          date: new Date()
        },
        include: { student: true }
      });

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error recording warning:', error);
      res.status(500).json({ message: 'Unable to record warning' });
    }
  }
};
