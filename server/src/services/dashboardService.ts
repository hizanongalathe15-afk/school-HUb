import { prisma } from '../config/database.js';

export interface DashboardModule {
  id: string;
  title: string;
  category: string;
  status: 'active' | 'attention' | 'draft';
  metrics: Array<{ label: string; value: string }>;
}

export const dashboardModules: DashboardModule[] = [
  { id: 'operations', title: 'Operations Center', category: 'Communication', status: 'active', metrics: [{ label: 'Dispatch channels', value: '4' }, { label: 'Bus routes', value: '5' }] },
  { id: 'rewards', title: 'Rewards Center', category: 'Gamification', status: 'active', metrics: [{ label: 'Badges', value: '82' }, { label: 'Coins', value: '14,200' }] },
  { id: 'security', title: 'Security Center', category: 'Security', status: 'active', metrics: [{ label: '2FA users', value: '12' }, { label: 'Blocked attempts', value: '31' }] },
  { id: 'analytics', title: 'Analytics Dashboard', category: 'Analytics', status: 'active', metrics: [{ label: 'Dashboards', value: '9' }, { label: 'Forecasts', value: '5 years' }] },
  { id: 'integrations', title: 'Integration Hub', category: 'Integrations', status: 'active', metrics: [{ label: 'Providers', value: '8' }, { label: 'M-PESA match', value: '98%' }] }
];

export interface DashboardModuleSnapshot {
  moduleId: string;
  generatedAt: string;
  metrics: Array<{ label: string; value: string; trend: string }>;
  workflows: Array<{ title: string; owner: string; status: string }>;
  records: string[];
}

export function getDashboardModules() {
  return dashboardModules;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-KE').format(value);
}

function formatMoney(value: number) {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(value)}`;
}

async function safeCount(label: string, count: () => Promise<number>) {
  try {
    return { label, value: await count() };
  } catch {
    return { label, value: 0 };
  }
}

async function safeAggregate(label: string, aggregate: () => Promise<number>) {
  try {
    return { label, value: await aggregate() };
  } catch {
    return { label, value: 0 };
  }
}

function metric(label: string, value: number | string, trend: string) {
  return { label, value: typeof value === 'number' ? formatNumber(value) : value, trend };
}

function isFinanceModule(moduleId: string) {
  return /fee|payment|finance|budget|bursar|expense|payroll|scholarship|arrears|mpesa|salary/i.test(moduleId);
}

function isPeopleModule(moduleId: string) {
  return /student|parent|teacher|staff|class|admission|principal/i.test(moduleId);
}

function isAcademicModule(moduleId: string) {
  return /academic|result|exam|subject|syllabus|timetable|homework|lesson|performance|rank|kcse/i.test(moduleId);
}

function isAttendanceModule(moduleId: string) {
  return /attendance|leave|meeting/i.test(moduleId);
}

function isInventoryModule(moduleId: string) {
  return /inventory|stock|store|supplier|purchase|request/i.test(moduleId);
}

function isCommunicationModule(moduleId: string) {
  return /communication|message|sms|email|whatsapp|announcement|alert|chat|notification|circular/i.test(moduleId);
}

function isLibraryModule(moduleId: string) {
  return /library|book|borrow|ebook|fine/i.test(moduleId);
}

function isDisciplineModule(moduleId: string) {
  return /discipline|merit|demerit|punishment|suspension|streak|reward/i.test(moduleId);
}

function isInfrastructureModule(moduleId: string) {
  return /infrastructure|classroom|dorm|lab|facility|maintenance|location|map|road|climate|media|gallery|event/i.test(moduleId);
}

export async function getDashboardSnapshot(moduleId: string): Promise<DashboardModuleSnapshot> {
  const normalizedModuleId = moduleId.trim();
  const [
    students,
    activeStudents,
    parents,
    teachers,
    staff,
    classes,
    attendance,
    presentAttendance,
    results,
    homework,
    pendingHomework,
    fees,
    pendingFees,
    paymentTotal,
    expensesTotal,
    inventoryItems,
    lowStock,
    stockRequests,
    books,
    borrowedBooks,
    discipline,
    unresolvedDiscipline,
    messages,
    unreadMessages,
    announcements,
    events,
    admissions,
    auditLogs
  ] = await Promise.all([
    safeCount('Students', () => prisma.student.count()),
    safeCount('Active students', () => prisma.student.count({ where: { isActive: true } })),
    safeCount('Parents', () => prisma.parent.count()),
    safeCount('Teachers', () => prisma.teacher.count({ where: { isActive: true } })),
    safeCount('Staff', () => prisma.staff.count({ where: { isActive: true } })),
    safeCount('Classes', () => prisma.class.count()),
    safeCount('Attendance records', () => prisma.attendance.count()),
    safeCount('Present records', () => prisma.attendance.count({ where: { status: 'PRESENT' } })),
    safeCount('Results', () => prisma.result.count()),
    safeCount('Homework', () => prisma.homework.count()),
    safeCount('Pending homework', () => prisma.homework.count({ where: { status: 'PENDING' } })),
    safeCount('Fee invoices', () => prisma.fee.count()),
    safeCount('Pending fees', () => prisma.fee.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } })),
    safeAggregate('Payments received', async () => {
      const result = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } });
      return result._sum.amount || 0;
    }),
    safeAggregate('Expenses', async () => {
      const result = await prisma.expense.aggregate({ _sum: { amount: true } });
      return result._sum.amount || 0;
    }),
    safeCount('Inventory items', () => prisma.inventoryItem.count()),
    safeCount('Low stock', () => prisma.inventoryItem.count({ where: { quantity: { lte: 10 } } })),
    safeCount('Stock requests', () => prisma.stockRequest.count({ where: { status: 'PENDING' } })),
    safeCount('Books', () => prisma.book.count()),
    safeCount('Borrowed books', () => prisma.borrowing.count({ where: { returnedAt: null } })),
    safeCount('Discipline records', () => prisma.discipline.count()),
    safeCount('Open discipline', () => prisma.discipline.count({ where: { resolvedAt: null } })),
    safeCount('Messages', () => prisma.message.count()),
    safeCount('Unread messages', () => prisma.message.count({ where: { isRead: false } })),
    safeCount('Announcements', () => prisma.announcement.count()),
    safeCount('Events', () => prisma.event.count()),
    safeCount('Admissions', () => prisma.admissionApplication.count()),
    safeCount('Audit actions', () => prisma.auditLog.count({ where: { entityId: normalizedModuleId } }))
  ]);

  const attendanceRate = attendance.value > 0 ? Math.round((presentAttendance.value / attendance.value) * 1000) / 10 : 0;
  const feeClearance = fees.value > 0 ? Math.max(0, Math.round(((fees.value - pendingFees.value) / fees.value) * 1000) / 10) : 100;
  const homeworkCompletion = homework.value > 0 ? Math.max(0, Math.round(((homework.value - pendingHomework.value) / homework.value) * 1000) / 10) : 100;

  let metrics = [
    metric('Active students', activeStudents.value, `${students.value} total learner profiles`),
    metric('Attendance rate', `${attendanceRate}%`, `${presentAttendance.value} present records`),
    metric('Recent actions', auditLogs.value, 'Audited module operations')
  ];

  if (isFinanceModule(normalizedModuleId)) {
    metrics = [
      metric('Collected', formatMoney(paymentTotal.value), 'Completed payments in the ledger'),
      metric('Pending invoices', pendingFees.value, `${feeClearance}% fee clearance`),
      metric('Expenses', formatMoney(expensesTotal.value), 'Recorded operating spend')
    ];
  } else if (isInventoryModule(normalizedModuleId)) {
    metrics = [
      metric('Stock items', inventoryItems.value, 'Live inventory catalogue'),
      metric('Low stock', lowStock.value, 'Items at or below threshold watch'),
      metric('Pending requests', stockRequests.value, 'Awaiting approval or issue')
    ];
  } else if (isAcademicModule(normalizedModuleId)) {
    metrics = [
      metric('Results', results.value, 'Marks captured in the gradebook'),
      metric('Homework completion', `${homeworkCompletion}%`, `${pendingHomework.value} pending tasks`),
      metric('Classes', classes.value, 'Academic groups configured')
    ];
  } else if (isPeopleModule(normalizedModuleId)) {
    metrics = [
      metric('Students', activeStudents.value, `${students.value} total profiles`),
      metric('Teachers', teachers.value, 'Active teaching staff'),
      metric('Parents', parents.value, 'Linked guardian accounts')
    ];
  } else if (isAttendanceModule(normalizedModuleId)) {
    metrics = [
      metric('Attendance records', attendance.value, 'Saved roll-call entries'),
      metric('Attendance rate', `${attendanceRate}%`, `${presentAttendance.value} present entries`),
      metric('Teachers', teachers.value, 'Staff available for follow-up')
    ];
  } else if (isCommunicationModule(normalizedModuleId)) {
    metrics = [
      metric('Messages', messages.value, `${unreadMessages.value} unread`),
      metric('Announcements', announcements.value, 'Published school notices'),
      metric('Audited sends', auditLogs.value, 'Communication actions logged')
    ];
  } else if (isLibraryModule(normalizedModuleId)) {
    metrics = [
      metric('Books', books.value, 'Catalogued titles'),
      metric('Borrowed', borrowedBooks.value, 'Currently out'),
      metric('Students', activeStudents.value, 'Eligible borrowers')
    ];
  } else if (isDisciplineModule(normalizedModuleId)) {
    metrics = [
      metric('Discipline records', discipline.value, 'Merit and incident history'),
      metric('Open cases', unresolvedDiscipline.value, 'Awaiting resolution'),
      metric('Students', activeStudents.value, 'Learner population')
    ];
  } else if (isInfrastructureModule(normalizedModuleId)) {
    metrics = [
      metric('Events', events.value, 'Scheduled campus activities'),
      metric('Admissions', admissions.value, 'Applications in the system'),
      metric('Classes', classes.value, 'Learning spaces in use')
    ];
  }

  const workflows = [
    { title: `${normalizedModuleId} data sync`, owner: 'API service', status: 'Live' },
    { title: 'Audit trail', owner: 'Dashboard actions', status: `${auditLogs.value} saved` },
    { title: 'Permission check', owner: 'Role access middleware', status: 'Enforced' }
  ];

  const records = [
    `${students.label}: ${formatNumber(students.value)} | ${parents.label}: ${formatNumber(parents.value)} | ${teachers.label}: ${formatNumber(teachers.value)}`,
    `${fees.label}: ${formatNumber(fees.value)} | ${paymentTotal.label}: ${formatMoney(paymentTotal.value)} | ${expensesTotal.label}: ${formatMoney(expensesTotal.value)}`,
    `${inventoryItems.label}: ${formatNumber(inventoryItems.value)} | ${books.label}: ${formatNumber(books.value)} | ${messages.label}: ${formatNumber(messages.value)}`,
    `${attendance.label}: ${formatNumber(attendance.value)} | ${results.label}: ${formatNumber(results.value)} | ${discipline.label}: ${formatNumber(discipline.value)}`
  ];

  return {
    moduleId: normalizedModuleId,
    generatedAt: new Date().toISOString(),
    metrics,
    workflows,
    records
  };
}

export async function runDashboardAction(moduleId: string, action: string, userId: string, ipAddress?: string, userAgent?: string) {
  const normalizedModuleId = moduleId.trim();
  const normalizedAction = action.trim();

  if (!normalizedModuleId || !normalizedAction) {
    throw new Error('Module id and action are required');
  }

  const audit = await prisma.auditLog.create({
    data: {
      userId,
      action: normalizedAction,
      entity: 'DashboardModule',
      entityId: normalizedModuleId,
      newValues: {
        moduleId: normalizedModuleId,
        action: normalizedAction,
        source: 'dashboard-module-action',
        completedAt: new Date().toISOString()
      },
      ipAddress,
      userAgent
    }
  });

  const snapshot = await getDashboardSnapshot(normalizedModuleId);

  return {
    id: audit.id,
    moduleId: normalizedModuleId,
    action: normalizedAction,
    status: 'completed',
    auditMessage: `${normalizedAction} completed for ${normalizedModuleId}`,
    completedAt: audit.createdAt.toISOString(),
    snapshot
  };
}
