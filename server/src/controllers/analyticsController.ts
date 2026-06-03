import { Request, Response } from 'express';
import os from 'os';
import { prisma } from '../config/database.js';

type AnalyticsPeriod = 'today' | 'week' | 'month' | 'term' | 'year';

function canViewAnalytics(role?: string) {
  return role === 'ADMIN' || role === 'PRINCIPAL' || role === 'DEVELOPER';
}

function requireAnalyticsAccess(req: Request, res: Response) {
  const user = (req as any).user as { role?: string } | undefined;
  if (!canViewAnalytics(user?.role)) {
    res.status(403).json({ message: 'Only admin, principal, or developer can view analytics.' });
    return false;
  }
  return true;
}

function getPeriodStart(period: AnalyticsPeriod = 'month') {
  const now = new Date();
  const start = new Date(now);

  if (period === 'today') start.setHours(0, 0, 0, 0);
  else if (period === 'week') start.setDate(now.getDate() - 7);
  else if (period === 'term') start.setMonth(now.getMonth() - 3);
  else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
  else start.setMonth(now.getMonth() - 1);

  return start;
}

function getPeriod(req: Request): AnalyticsPeriod {
  const period = String(req.query.period || 'month') as AnalyticsPeriod;
  return ['today', 'week', 'month', 'term', 'year'].includes(period) ? period : 'month';
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export const analyticsController = {
  schools: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const schools = await prisma.school.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(schools);
  },

  system: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpu = Math.min(100, Math.round((os.loadavg()[0] / Math.max(1, os.cpus().length)) * 1000) / 10);
    const activeUsers = await prisma.session.count({ where: { expiresAt: { gt: new Date() } } });

    res.json({
      cpu,
      memory: pct(totalMemory - freeMemory, totalMemory),
      disk: 0,
      network: 0,
      activeUsers,
      requestsPerMinute: 0,
      avgResponseTime: 0,
      errorRate: 0,
      timestamp: new Date()
    });
  },

  systemHistory: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const period = getPeriod(req);
    const points = period === 'today' ? 12 : period === 'week' ? 7 : 10;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const cpu = Math.min(100, Math.round((os.loadavg()[0] / Math.max(1, os.cpus().length)) * 1000) / 10);
    const memory = pct(totalMemory - freeMemory, totalMemory);
    const activeUsers = await prisma.session.count({ where: { expiresAt: { gt: new Date() } } });

    res.json(Array.from({ length: points }, (_, index) => ({
      cpu,
      memory,
      disk: 0,
      network: 0,
      activeUsers,
      requestsPerMinute: 0,
      avgResponseTime: 0,
      errorRate: 0,
      timestamp: new Date(Date.now() - (points - index - 1) * 60_000)
    })));
  },

  students: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const period = getPeriod(req);
    const since = getPeriodStart(period);
    const [totalStudents, newEnrollments, graduates, inactive, genderGroups, classGroups] = await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.student.count({ where: { enrollmentDate: { gte: since } } }),
      prisma.student.count({ where: { graduationDate: { not: null } } }),
      prisma.student.count({ where: { isActive: false } }),
      prisma.student.groupBy({ by: ['gender'], _count: { _all: true } }),
      prisma.class.findMany({ select: { name: true, students: { where: { isActive: true }, select: { id: true } } }, orderBy: { name: 'asc' } })
    ]);

    res.json({
      totalStudents,
      newEnrollments,
      graduates,
      dropouts: inactive,
      genderRatio: {
        male: genderGroups.find((item) => item.gender === 'MALE')?._count._all || 0,
        female: genderGroups.find((item) => item.gender === 'FEMALE')?._count._all || 0
      },
      classDistribution: classGroups.map((item) => ({ className: item.name, count: item.students.length })),
      enrollmentTrend: [{ month: since.toLocaleDateString('en', { month: 'short' }), count: newEnrollments }]
    });
  },

  fees: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const since = getPeriodStart(getPeriod(req));
    const [expected, collected, overdueAccounts, classRows] = await Promise.all([
      prisma.fee.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'COMPLETED', paymentDate: { gte: since } }, _sum: { amount: true } }),
      prisma.fee.count({ where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: new Date() } } }),
      prisma.class.findMany({
        select: {
          name: true,
          students: {
            select: {
              fees: { select: { amount: true } },
              payments: { where: { status: 'COMPLETED' }, select: { amount: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const totalExpected = expected._sum.amount || 0;
    const totalCollected = collected._sum.amount || 0;
    res.json({
      totalExpected,
      totalCollected,
      pendingAmount: Math.max(0, totalExpected - totalCollected),
      collectionRate: pct(totalCollected, totalExpected),
      overdueAccounts,
      paymentTrend: [{ period: since.toLocaleDateString('en', { month: 'short' }), collected: totalCollected, expected: totalExpected }],
      classBreakdown: classRows.map((row) => ({
        className: row.name,
        expected: row.students.flatMap((student) => student.fees).reduce((sum, fee) => sum + fee.amount, 0),
        collected: row.students.flatMap((student) => student.payments).reduce((sum, payment) => sum + payment.amount, 0)
      }))
    });
  },

  attendance: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const since = getPeriodStart(getPeriod(req));
    const [present, absent, total, teachersPresent, teachersTotal, classRows] = await Promise.all([
      prisma.attendance.count({ where: { date: { gte: since }, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: { gte: since }, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { date: { gte: since } } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.teacher.count(),
      prisma.class.findMany({
        select: {
          name: true,
          attendance: { where: { date: { gte: since } }, select: { status: true } }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    res.json({
      averageDaily: pct(present, total),
      studentsPresent: present,
      studentsAbsent: absent,
      teachersPresent,
      teachersAbsent: Math.max(0, teachersTotal - teachersPresent),
      weeklyTrend: [{ day: since.toLocaleDateString('en', { weekday: 'short' }), students: pct(present, total), teachers: pct(teachersPresent, teachersTotal) }],
      classAttendance: classRows.map((row) => {
        const classPresent = row.attendance.filter((item) => item.status === 'PRESENT').length;
        return { className: row.name, percentage: pct(classPresent, row.attendance.length) };
      })
    });
  },

  performance: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const since = getPeriodStart(getPeriod(req));
    const [scoreAggregate, gradeGroups, topResults, subjectRows] = await Promise.all([
      prisma.result.aggregate({ where: { date: { gte: since } }, _avg: { score: true } }),
      prisma.result.groupBy({ by: ['grade'], where: { date: { gte: since } }, _count: { _all: true } }),
      prisma.result.findMany({
        where: { date: { gte: since } },
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { score: 'desc' },
        take: 5
      }),
      prisma.subject.findMany({
        select: { name: true, results: { where: { date: { gte: since } }, select: { score: true } } },
        orderBy: { name: 'asc' }
      })
    ]);
    const gradeTotal = gradeGroups.reduce((sum, item) => sum + item._count._all, 0);

    res.json({
      overallAverage: Math.round((scoreAggregate._avg.score || 0) * 10) / 10,
      gradeDistribution: gradeGroups.map((item) => ({ grade: item.grade || 'Ungraded', count: item._count._all, percentage: pct(item._count._all, gradeTotal) })),
      topPerformers: topResults.map((item) => ({ name: `${item.student.firstName} ${item.student.lastName}`, grade: item.grade || 'N/A', score: item.score })),
      subjectAverages: subjectRows.map((subject) => {
        const scores = subject.results.map((item) => item.score);
        const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
        return { subject: subject.name, average: Math.round(average * 10) / 10, topScore: scores.length ? Math.max(...scores) : 0 };
      }),
      trends: [{ term: since.toLocaleDateString('en', { month: 'short' }), average: Math.round((scoreAggregate._avg.score || 0) * 10) / 10 }]
    });
  },

  departments: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    const departments = await prisma.teacher.groupBy({
      by: ['subject'],
      where: { isActive: true },
      _count: { _all: true }
    });
    const students = await prisma.student.count({ where: { isActive: true } });

    res.json(departments.map((department) => ({
      name: department.subject || 'General',
      average: 0,
      students,
      teachers: department._count._all,
      passRate: 0,
      topStudent: 'N/A',
      improvement: 0
    })));
  },

  exportReport: async (req: Request, res: Response) => {
    if (!requireAnalyticsAccess(req, res)) return;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics-report.pdf"');
    res.send(Buffer.from(`Analytics report\nGenerated: ${new Date().toISOString()}\nPeriod: ${req.query.period || 'month'}\n`));
  }
};
