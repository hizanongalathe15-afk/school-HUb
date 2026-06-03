import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reportController = {
  generateAcademicReport: async (req: Request, res: Response) => {
    try {
      const { studentId, term, year } = req.body;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { 
          class: true, 
          results: { include: { subject: true } },
          attendance: true,
          discipline: true
        }
      });
      
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const results = student.results.filter((r: any) => 
        (!term || r.term === Number(term)) && (!year || r.year === Number(year))
      );
      
      const report = {
        student: {
          name: `${student.firstName} ${student.lastName}`,
          admissionNumber: student.admissionNumber,
          class: student.class?.name
        },
        term: term || 'Current',
        year: year || new Date().getFullYear(),
        results,
        attendanceSummary: {
          total: student.attendance.length,
          present: student.attendance.length,
          absent: student.attendance.filter((a: any) => a.status === 'ABSENT').length
        },
        discipline: student.discipline.length
      };

      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ message: 'Unable to generate academic report' });
    }
  },

  generateFinancialReport: async (req: Request, res: Response) => {
    try {
      const { term, year } = req.query;
      const where: any = {};
      if (term) where.term = Number(term);
      if (year) where.year = Number(year);

      const payments = await prisma.payment.findMany({
        where,
        include: { student: true, fee: true }
      });
      
      const fees = await prisma.fee.findMany({ where });

      const report = {
        period: { term, year },
        summary: {
          totalCollected: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
          totalBilled: fees.reduce((sum: number, f: any) => sum + f.amount, 0),
          transactions: payments.length
        },
        payments
      };

      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ message: 'Unable to generate financial report' });
    }
  },

  generateAttendanceReport: async (req: Request, res: Response) => {
    try {
      const { classId, month, year } = req.query;
      const where: any = {};
      if (classId) where.classId = classId as string;
      if (month) where.date = { gte: new Date(Number(year || new Date().getFullYear()), Number(month) - 1, 1) };

      const attendance = await prisma.attendance.findMany({
        where,
        include: { student: true }
      });

      const report = {
        period: { classId, month, year },
        summary: {
          totalRecords: attendance.length,
          present: attendance.filter((a: any) => a.status === 'PRESENT').length,
          absent: attendance.filter((a: any) => a.status === 'ABSENT').length,
          late: attendance.filter((a: any) => a.status === 'LATE').length
        },
        records: attendance
      };

      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ message: 'Unable to generate attendance report' });
    }
  },

  generateInventoryReport: async (_req: Request, res: Response) => {
    try {
      const items = await prisma.inventoryItem.findMany();
      
      const report = {
        totalItems: items.length,
        totalValue: items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0),
        lowStock: items.filter((i: any) => i.quantity <= i.minThreshold),
        categories: [...new Set(items.map((i: any) => i.category))].map(cat => ({
          category: cat,
          count: items.filter((i: any) => i.category === cat).length,
          value: items.filter((i: any) => i.category === cat).reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0)
        }))
      };

      res.json({ success: true, data: report });
    } catch (error) {
      res.status(500).json({ message: 'Unable to generate inventory report' });
    }
  },

  exportToExcel: async (req: Request, res: Response) => {
    try {
      const { type, filters } = req.body;
      let data: any[] = [];

      switch (type) {
        case 'students':
          data = await prisma.student.findMany({ include: { class: true, parent: true } });
          break;
        case 'fees':
          data = await prisma.fee.findMany({ include: { student: true, payments: true } });
          break;
        case 'attendance':
          data = await prisma.attendance.findMany({ include: { student: true } });
          break;
        case 'inventory':
          data = await prisma.inventoryItem.findMany();
          break;
        default:
          return res.status(400).json({ message: 'Invalid export type' });
      }

      res.json({ success: true, data, filename: `${type}_export_${Date.now()}.xlsx` });
    } catch (error) {
      res.status(500).json({ message: 'Unable to export data' });
    }
  }
};