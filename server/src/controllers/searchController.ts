import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function limit(value: unknown) {
  const parsed = Number(value || 8);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 25) : 8;
}

export const searchController = {
  global: async (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim();
    const take = limit(req.query.limit);

    if (q.length < 2) {
      return res.json({ query: q, data: [] });
    }

    const contains = { contains: q, mode: 'insensitive' as const };
    const [students, teachers, parents, staff, inventory, fees] = await Promise.all([
      prisma.student.findMany({
        where: { OR: [{ firstName: contains }, { lastName: contains }, { admissionNumber: contains }, { email: contains }] },
        take,
        select: { id: true, firstName: true, lastName: true, admissionNumber: true, classId: true }
      }),
      prisma.teacher.findMany({
        where: { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { subject: contains }] },
        take,
        select: { id: true, firstName: true, lastName: true, subject: true }
      }),
      prisma.parent.findMany({
        where: { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { phone: contains }] },
        take,
        select: { id: true, firstName: true, lastName: true, email: true }
      }),
      prisma.staff.findMany({
        where: { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }, { staffRole: contains }, { department: contains }] },
        take,
        select: { id: true, firstName: true, lastName: true, staffRole: true }
      }),
      prisma.inventoryItem.findMany({
        where: { OR: [{ name: contains }, { category: contains }, { supplier: contains }, { location: contains }] },
        take,
        select: { id: true, name: true, category: true, quantity: true }
      }),
      prisma.fee.findMany({
        where: { OR: [{ type: contains }, { reference: contains }] },
        take,
        select: { id: true, type: true, amount: true, status: true, studentId: true }
      })
    ]);

    res.json({
      query: q,
      data: [
        ...students.map((item) => ({ type: 'student', id: item.id, title: `${item.firstName} ${item.lastName}`, detail: item.admissionNumber, href: `/dashboard/admin/students/view?id=${item.id}` })),
        ...teachers.map((item) => ({ type: 'teacher', id: item.id, title: `${item.firstName} ${item.lastName}`, detail: item.subject, href: `/dashboard/admin/teachers/all` })),
        ...parents.map((item) => ({ type: 'parent', id: item.id, title: `${item.firstName} ${item.lastName}`, detail: item.email, href: `/dashboard/admin/parents/all` })),
        ...staff.map((item) => ({ type: 'staff', id: item.id, title: `${item.firstName} ${item.lastName}`, detail: item.staffRole, href: `/dashboard/admin/staff/all` })),
        ...inventory.map((item) => ({ type: 'inventory', id: item.id, title: item.name, detail: `${item.category} | ${item.quantity}`, href: `/dashboard/admin/inventory/stock-items` })),
        ...fees.map((item) => ({ type: 'fee', id: item.id, title: item.type, detail: `${item.status} | ${item.amount}`, href: `/dashboard/bursar/fees` }))
      ].slice(0, take * 3)
    });
  }
};
