import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const timetableController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { classId, teacherId, dayOfWeek, term, year } = req.query;
      const where: any = {};
      
      if (classId) where.classId = classId as string;
      if (teacherId) where.teacherId = teacherId as string;
      if (dayOfWeek) where.dayOfWeek = Number(dayOfWeek);
      if (term) where.term = Number(term);
      if (year) where.year = Number(year);

      const entries = await prisma.timetable.findMany({
        where,
        include: { class: true, subject: true, teacher: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
      });
      
      res.json({ success: true, data: entries });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load timetable' });
    }
  },

  getByClass: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const entries = await prisma.timetable.findMany({
        where: { classId },
        include: { subject: true, teacher: true },
        orderBy: { dayOfWeek: 'asc' }
      });
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const grouped = entries.reduce((acc: any, entry) => {
        const day = dayNames[entry.dayOfWeek] || 'Unknown';
        if (!acc[day]) acc[day] = [];
        acc[day].push({
          id: entry.id,
          period: entry.startTime,
          subject: (entry.subject as any)?.name,
          teacher: entry.teacher ? `${(entry.teacher as any).firstName} ${(entry.teacher as any).lastName}` : null,
          room: entry.room
        });
        return acc;
      }, {});

      res.json({ success: true, data: grouped });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load class timetable' });
    }
  },

  getByTeacher: async (req: Request, res: Response) => {
    try {
      const { teacherId } = req.params;
      const entries = await prisma.timetable.findMany({
        where: { teacherId },
        include: { class: true, subject: true },
        orderBy: { dayOfWeek: 'asc' }
      });
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const grouped = entries.reduce((acc: any, entry) => {
        const day = dayNames[entry.dayOfWeek] || 'Unknown';
        if (!acc[day]) acc[day] = [];
        acc[day].push({
          id: entry.id,
          period: entry.startTime,
          subject: (entry.subject as any)?.name,
          class: (entry.class as any)?.name,
          room: entry.room
        });
        return acc;
      }, {});

      res.json({ success: true, data: grouped });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load teacher timetable' });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room, term, year } = req.body;
      
      const entry = await prisma.timetable.create({
        data: {
          classId,
          subjectId,
          teacherId,
          dayOfWeek: Number(dayOfWeek),
          startTime: startTime || '08:00',
          endTime: endTime || '09:00',
          room: room || '',
          term: Number(term || 2),
          year: Number(year || new Date().getFullYear())
        }
      });
      
      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      res.status(500).json({ message: 'Unable to create timetable entry' });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;
      
      const entry = await prisma.timetable.update({
        where: { id },
        data: {
          classId,
          subjectId,
          teacherId,
          dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
          startTime,
          endTime,
          room
        }
      });
      
      res.json({ success: true, data: entry });
    } catch (error) {
      res.status(500).json({ message: 'Unable to update timetable entry' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.timetable.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Unable to delete timetable entry' });
    }
  },

  validateConflicts: async (req: Request, res: Response) => {
    try {
      const { classId, teacherId, dayOfWeek, startTime, endTime, excludeId } = req.body;
      
      const conflicts = [];
      
      if (classId) {
        const classConflicts = await prisma.timetable.findMany({
          where: {
            classId,
            dayOfWeek: Number(dayOfWeek),
            OR: [
              { startTime: { lte: startTime }, endTime: { gte: startTime } },
              { startTime: { lte: endTime }, endTime: { gte: endTime } }
            ],
            NOT: { id: excludeId }
          }
        });
        conflicts.push(...classConflicts.map((c: any) => ({ type: 'class', id: c.id })));
      }

      if (teacherId) {
        const teacherConflicts = await prisma.timetable.findMany({
          where: {
            teacherId,
            dayOfWeek: Number(dayOfWeek),
            OR: [
              { startTime: { lte: startTime }, endTime: { gte: startTime } },
              { startTime: { lte: endTime }, endTime: { gte: endTime } }
            ],
            NOT: { id: excludeId }
          }
        });
        conflicts.push(...teacherConflicts.map((c: any) => ({ type: 'teacher', id: c.id })));
      }

      res.json({ success: true, hasConflicts: conflicts.length > 0, conflicts });
    } catch (error) {
      res.status(500).json({ message: 'Unable to validate conflicts' });
    }
  }
};