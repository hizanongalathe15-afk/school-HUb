import { Request, Response } from 'express';
import { ExamType, PrismaClient } from '@prisma/client';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';

const prisma = new PrismaClient();

function gradeFromScore(score: number) {
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
  return 'E';
}

export const resultController = {
  summary: async (_req: Request, res: Response) => {
    try {
      const rows = await prisma.result.findMany({ include: { student: true } });
      const grouped = rows.reduce<Record<string, { subject: string; total: number; count: number; mean: number; grade: string }>>((acc, row) => {
        acc[row.subjectId] ||= { subject: row.subjectId, total: 0, count: 0, mean: 0, grade: 'E' };
        acc[row.subjectId].total += row.score;
        acc[row.subjectId].count += 1;
        return acc;
      }, {});
      const data = Object.values(grouped).map((item) => ({
        subject: item.subject,
        mean: Math.round(item.total / item.count),
        grade: gradeFromScore(item.total / item.count)
      }));
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load result summary' });
    }
  },

  getByStudent: async (req: Request, res: Response) => {
    try {
      const results = await prisma.result.findMany({
        where: { studentId: req.params.studentId },
      });
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },

   enter: async (req: Request, res: Response) => {
     try {
       const { studentId, subjectId, examType, score, remarks, teacherId } = req.body;
       if (!studentId || !subjectId || !examType || score === undefined) {
         return res.status(400).json({ message: 'studentId, subjectId, examType, and score are required' });
       }

       const result = await prisma.result.create({
         data: {
           studentId,
           subjectId,
           examType,
           score: Number(score),
           grade: gradeFromScore(Number(score)),
           remarks,
           teacherId,
           term: Number(req.body.term || 2),
           year: Number(req.body.year || new Date().getFullYear()),
         },
       });

       // Emit event for real-time updates (when results are published)
       // In a real implementation, you might check if "auto-publish" is enabled
       eventEmitter.emitEvent('result:published', {
         classId: '', // We'd need to get this from the student's class
         subjectId,
         studentId,
         grade: gradeFromScore(Number(score)),
         score: Number(score),
         timestamp: new Date().toISOString()
       });

       // Audit log
       await auditLogger.logCreate(
         teacherId,
         'Result',
         result.id,
         {
           studentId,
           subjectId,
           examType,
           score: Number(score),
           grade: gradeFromScore(Number(score)),
           remarks,
           term: Number(req.body.term || 2),
           year: Number(req.body.year || new Date().getFullYear())
         },
         `Result entered for student ${studentId} in subject ${subjectId}: ${score}%`
       );

       res.status(201).json(result);
     } catch (error) {
       res.status(500).json({ message: 'Unable to save result' });
     }
   },

   bulkUpload: async (req: Request, res: Response) => {
     try {
       const rows = Array.isArray(req.body?.results) ? req.body.results : [];
       if (!rows.length) {
         return res.status(400).json({ message: 'results array is required' });
       }

       const created = await prisma.$transaction(rows.map((row: any) => prisma.result.create({
         data: {
           studentId: row.studentId,
           subjectId: row.subjectId,
           examType: row.examType,
           score: Number(row.score),
           grade: gradeFromScore(Number(row.score)),
           remarks: row.remarks,
           teacherId: row.teacherId,
           term: Number(row.term || 2),
           year: Number(row.year || new Date().getFullYear()),
         }
       })));

       // Emit events for each result published
       for (const result of created) {
         // Emit event for real-time updates (when results are published)
         eventEmitter.emitEvent('result:published', {
           classId: '', // We'd need to get this from the student's class
           subjectId: result.subjectId,
           studentId: result.studentId,
           grade: result.grade,
           score: result.score,
           timestamp: new Date().toISOString()
         });
       }

       // Audit log for bulk upload
       await auditLogger.logCreate(
         (req as any).user?.userId,
         'Result_Bulk',
         `bulk_${Date.now()}`,
         {
           count: created.length,
           results: created.map(r => ({
             studentId: r.studentId,
             subjectId: r.subjectId,
             score: r.score,
             grade: r.grade
           }))
         },
         `Bulk uploaded ${created.length} results`
       );

       res.status(201).json({ count: created.length, data: created });
     } catch (error) {
       res.status(500).json({ message: 'Unable to upload results' });
     }
   },

  getByClass: async (req: Request, res: Response) => {
    try {
      const students = await prisma.student.findMany({
        where: { classId: req.params.classId },
        include: { results: true }
      });
      const data = students.map((student) => {
        const total = student.results.reduce((sum, result) => sum + result.score, 0);
        const mean = student.results.length ? total / student.results.length : 0;
        return {
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          total,
          mean: Math.round(mean),
          grade: gradeFromScore(mean),
          subjects: student.results.length
        };
      }).sort((a, b) => b.mean - a.mean).map((row, index) => ({ ...row, position: index + 1 }));
      res.json({ data });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load class performance' });
    }
  },
};
