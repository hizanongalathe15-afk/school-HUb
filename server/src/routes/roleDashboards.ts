import { Router } from 'express';
import { auth } from '../middleware/auth.js';

const router = Router();
const now = new Date();
const iso = now.toISOString();
const demoChild = {
  id: 'demo-child-1',
  admissionNumber: 'ADM-001',
  firstName: 'Amani',
  lastName: 'Mwangi',
  classId: 'form-2',
  className: 'Form 2 North',
  dateOfBirth: '2011-04-12',
  gender: 'female',
  currentTermStats: {
    attendancePercentage: 94,
    averageGrade: 'B+',
    averageScore: 78,
    classPosition: 6,
    totalStudents: 42,
    meritsCount: 8,
    demeritsCount: 1,
  },
};

router.get('/parent/dashboard', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      children: [demoChild],
      pendingFees: [
        { studentId: 'demo-child-1', studentName: 'Amani Mwangi', balance: 18500, isOverdue: false },
      ],
      upcomingEvents: [
        { id: 'event-1', title: 'Parent-Teacher Meeting', date: iso, time: '2:00 PM', location: 'Main Hall', description: 'Academic progress review' },
      ],
      recentAnnouncements: [
        { id: 'ann-1', title: 'Mid-term exams begin next week', message: 'Timetables are available in the portal.', priority: 'normal', createdAt: iso },
      ],
      recentMessages: [],
      attendanceAlerts: [],
      pendingHomework: [],
      upcomingMeetings: [],
      recentNotifications: [],
      quickStats: {
        totalChildren: 1,
        totalFeesPending: 18500,
        unreadMessages: 0,
        upcomingEventsCount: 1,
        attendanceAlertsCount: 0,
        pendingHomeworkCount: 0,
      },
    },
  });
});

router.get('/parent/dashboard/stats', auth, (req, res) => {
  res.json({ success: true, data: { totalChildren: 1, totalFeesPending: 18500, unreadMessages: 0, upcomingEventsCount: 1, attendanceAlertsCount: 0, pendingHomeworkCount: 0 } });
});

router.get('/parent/children', auth, (req, res) => {
  res.json({ success: true, data: [demoChild] });
});

router.get('/parent/children/:childId/fee-balance', auth, (req, res) => {
  res.json({ success: true, data: { studentId: req.params.childId, studentName: 'Amani Mwangi', balance: 18500, isOverdue: false, totalFees: 62000, paidAmount: 43500 } });
});

router.get('/parent/children/:childId/payment-history', auth, (req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/bursar/dashboard', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      quickStats: {
        totalCollectedToday: 124000,
        totalCollectedThisMonth: 2847500,
        totalArrears: 680000,
        totalExpensesThisMonth: 412000,
        cashBalance: 980000,
        pendingPayments: 9,
        salaryDueDate: iso,
        budgetUtilization: 64,
      },
      recentPayments: [
        { id: 'pay-1', studentName: 'Amani Mwangi', className: 'Form 2 North', amount: 18500, paymentMethod: 'mpesa', paymentDate: iso },
        { id: 'pay-2', studentName: 'Brian Otieno', className: 'Form 3 East', amount: 22000, paymentMethod: 'bank', paymentDate: iso },
      ],
      pendingArrears: [
        { studentId: 'std-1', studentName: 'Kevin Maina', className: 'Form 4 West', totalBalance: 32000, overdueAmount: 12000, lastPaymentDate: iso },
      ],
      upcomingExpenses: [
        { id: 'exp-1', title: 'Lab equipment restock', amount: 45000, dueDate: iso, category: 'Academic', status: 'pending' },
      ],
      pendingSalaryAdvances: [],
      budgetAlerts: [
        { department: 'Transport', allocation: 200000, spent: 162000, percentage: 81, severity: 'warning' },
      ],
      mpesaReconciliation: {
        totalUnmatched: 3,
        totalMatched: 42,
        totalAmount: 318000,
        lastReconciledAt: iso,
      },
    },
  });
});

router.get('/bursar/notifications', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'bn-1', type: 'payment', title: 'Payment received', message: 'KES 18,500 received via MPESA.', isRead: false, createdAt: iso },
    ],
  });
});

router.get('/bursar/notifications/unread-count', auth, (req, res) => {
  res.json({ success: true, data: 1 });
});

router.get('/storekeeper/dashboard', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      quickStats: {
        totalItems: 438,
        totalValue: 1824000,
        lowStockCount: 7,
        outOfStockCount: 2,
        pendingRequestsCount: 5,
        expiringItemsCount: 3,
        overdueBorrowingsCount: 4,
        monthlyIssuesCount: 61,
        monthlyReturnsCount: 44,
      },
      lowStockItems: [
        { id: 'item-1', name: 'Exercise Books', category: 'Stationery', quantity: 12, reorderLevel: 50, unit: 'pcs', status: 'low_stock' },
      ],
      pendingRequests: [
        { id: 'req-1', requestNumber: 'REQ-001', requesterName: 'Math Department', requesterRole: 'Teacher', items: [{ itemId: 'item-1', quantity: 20 }], priority: 'high', status: 'pending', createdAt: iso },
      ],
      expiringItems: [
        { id: 'item-2', name: 'First Aid Supplies', category: 'Health', quantity: 8, reorderLevel: 5, unit: 'packs', expiryDate: iso, status: 'active' },
      ],
      overdueBorrowings: [],
      recentMovements: [
        { id: 'mov-1', itemName: 'Printer Paper', movementType: 'issue', quantity: 5, createdAt: iso },
      ],
      alerts: [],
    },
  });
});

router.get('/storekeeper/notifications', auth, (req, res) => {
  res.json({ success: true, data: [] });
});

router.get('/storekeeper/notifications/unread-count', auth, (req, res) => {
  res.json({ success: true, data: 0 });
});

// ============================================
// TEACHER DASHBOARD
// ============================================
router.get('/teacher/dashboard', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      quickStats: {
        totalClasses: 6,
        totalStudents: 185,
        pendingHomework: 3,
        unmarkedTests: 12,
        todayAttendance: 92,
        upcomingMeetings: 2,
      },
      todayClasses: [
        { subject: 'Mathematics', className: 'Form 1 North', stream: 'North', time: '8:00 AM - 8:40 AM', room: 'Room 101', studentCount: 35 },
        { subject: 'Physics', className: 'Form 2 South', stream: 'South', time: '9:00 AM - 9:40 AM', room: 'Lab 1', studentCount: 30 },
      ],
      pendingTasks: [
        { id: '1', type: 'grading', title: 'Grade Form 2 Physics Tests', dueDate: iso, priority: 'high', count: 30 },
        { id: '2', type: 'homework', title: 'Review Form 3 Essays', dueDate: iso, priority: 'medium', count: 25 },
      ],
      alerts: [],
      recentMessages: [],
      announcements: [],
    },
  });
});

router.get('/teacher/dashboard/stats', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalClasses: 6,
      totalStudents: 185,
      pendingHomework: 3,
      unmarkedTests: 12,
      todayAttendance: 92,
      upcomingMeetings: 2,
    },
  });
});

router.get('/teacher/dashboard/today-classes', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      { subject: 'Mathematics', className: 'Form 1 North', stream: 'North', time: '8:00 AM - 8:40 AM', room: 'Room 101', studentCount: 35 },
      { subject: 'Physics', className: 'Form 2 South', stream: 'South', time: '9:00 AM - 9:40 AM', room: 'Lab 1', studentCount: 30 },
    ],
  });
});

router.get('/teacher/dashboard/tasks', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '1', type: 'grading', title: 'Grade Form 2 Physics Tests', dueDate: iso, priority: 'high', count: 30 },
      { id: '2', type: 'homework', title: 'Review Form 3 Essays', dueDate: iso, priority: 'medium', count: 25 },
    ],
  });
});

router.get('/teacher/dashboard/alerts', auth, (req, res) => {
  res.json({ success: true, data: [] });
});

// ============================================
// ADMIN DASHBOARD
// ============================================
router.get('/admin/dashboard', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers: 1247,
        totalStudents: 856,
        totalTeachers: 64,
        totalParents: 892,
        totalStaff: 45,
        schoolHealth: 92,
        dataIntegrity: 98,
        systemUptime: 99.8,
      },
      alerts: [
        { id: 'alert-1', severity: 'warning', title: 'Low disk space', message: 'Server storage is 85% full', timestamp: iso },
      ],
      recentActivity: [
        { id: 'act-1', user: 'System', action: 'Database backup', timestamp: iso },
      ],
      systemMetrics: {
        cpuUsage: 42,
        memoryUsage: 58,
        diskUsage: 73,
        activeConnections: 23,
      },
    },
  });
});

router.get('/admin/dashboard/metrics', auth, (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 1247,
      totalStudents: 856,
      totalTeachers: 64,
      totalParents: 892,
      totalStaff: 45,
      schoolHealth: 92,
      dataIntegrity: 98,
      systemUptime: 99.8,
    },
  });
});

router.get('/admin/dashboard/activity-logs', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'act-1', user: 'System', action: 'Database backup', timestamp: iso },
    ],
  });
});

router.get('/admin/dashboard/alerts', auth, (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'alert-1', severity: 'warning', title: 'Low disk space', message: 'Server storage is 85% full', timestamp: iso },
    ],
  });
});

// ============================================
// CATCH-ALL FALLBACK ROUTES
// ============================================
const emptyRoleResponse = (req: any, res: any) => {
  res.json({ success: true, data: [] });
};

router.get('/parent/*', auth, emptyRoleResponse);
router.post('/parent/*', auth, emptyRoleResponse);
router.put('/parent/*', auth, emptyRoleResponse);
router.patch('/parent/*', auth, emptyRoleResponse);
router.delete('/parent/*', auth, emptyRoleResponse);

router.get('/bursar/*', auth, emptyRoleResponse);
router.post('/bursar/*', auth, emptyRoleResponse);
router.put('/bursar/*', auth, emptyRoleResponse);
router.patch('/bursar/*', auth, emptyRoleResponse);
router.delete('/bursar/*', auth, emptyRoleResponse);

router.get('/storekeeper/*', auth, emptyRoleResponse);
router.post('/storekeeper/*', auth, emptyRoleResponse);
router.put('/storekeeper/*', auth, emptyRoleResponse);
router.patch('/storekeeper/*', auth, emptyRoleResponse);
router.delete('/storekeeper/*', auth, emptyRoleResponse);

export default router;
