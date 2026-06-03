import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';

const prisma = new PrismaClient();

export const attendanceController = {
  summary: async (_req: Request, res: Response) => {
    try {
      const rows = await prisma.attendance.groupBy({
        by: ['classId', 'status'],
        _count: { id: true }
      });

      const grouped = rows.reduce<Record<string, { className: string; present: number; absent: number; late: number; total: number; attendanceRate: number }>>((acc, row) => {
        const key = row.classId || 'Unassigned';
        acc[key] ||= { className: key, present: 0, absent: 0, late: 0, total: 0, attendanceRate: 0 };
        const count = row._count.id;
        acc[key].total += count;
        if (row.status.toUpperCase() === 'PRESENT') acc[key].present += count;
        if (row.status.toUpperCase() === 'ABSENT') acc[key].absent += count;
        if (row.status.toUpperCase() === 'LATE') acc[key].late += count;
        return acc;
      }, {});

      const data = Object.values(grouped).map((item) => ({
        ...item,
        attendanceRate: item.total ? Math.round((item.present / item.total) * 100) : 0
      }));

      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load attendance summary' });
    }
  },

  getByStudent: async (req: Request, res: Response) => {
    try {
      const attendance = await prisma.attendance.findMany({
        where: { studentId: req.params.studentId },
      });
      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error loading student attendance:', error);
      res.status(500).json({ message: 'Unable to load attendance' });
    }
  },

   mark: async (req: Request, res: Response) => {
     try {
       const { studentId, status, notes, classId, date } = req.body;
       if (!studentId || !status || !classId) {
         return res.status(400).json({ message: 'studentId, classId, and status are required' });
       }

       const attendance = await prisma.attendance.upsert({
         where: {
           id: req.body.id || `attendance_${studentId}_${classId}_${new Date(date || Date.now()).toISOString().slice(0, 10)}`
         },
         create: {
           id: req.body.id || `attendance_${studentId}_${classId}_${new Date(date || Date.now()).toISOString().slice(0, 10)}`,
           studentId,
           status,
           notes,
           classId,
           date: date ? new Date(date) : new Date()
         },
         update: {
           status,
           notes,
           classId,
           date: date ? new Date(date) : new Date()
         }
       });

       // Emit event for real-time updates
       eventEmitter.emitEvent('attendance:marked', {
         studentId,
         classId,
         status,
         timestamp: new Date().toISOString()
       });

       // Audit log
       await auditLogger.logCreate(
         (req as any).user?.userId,
         'Attendance',
         attendance.id,
         {
           studentId,
           status,
           classId,
           notes,
           date: date ? new Date(date) : new Date()
         },
         `Attendance marked for student ${studentId}: ${status}`
       );

       res.status(201).json(attendance);
     } catch (error) {
       res.status(500).json({ message: 'Unable to mark attendance' });
     }
   },
};
