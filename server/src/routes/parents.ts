import { Router } from 'express';
import { parentController } from '../controllers/parentController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Dashboard & Profile
router.get('/', parentController.list);
router.get('/dashboard', auth, parentController.dashboard);
router.get('/profile', auth, parentController.getProfile);
router.put('/profile', auth, parentController.updateProfile);

// Children
router.get('/children', auth, parentController.getMyChildren);
router.post('/children/link-existing', auth, parentController.linkExistingStudent);
router.post('/children/link', auth, parentController.linkExistingStudent); // Alias for compatibility
router.put('/children/:childId/rename', auth, parentController.renameChild); // Rename child display name
router.delete('/children/:childId/unlink', auth, parentController.unlinkChild); // Unlink child from parent
router.get('/:id/students', parentController.students);

// Timetable
router.get('/children/:childId/timetable', auth, parentController.getChildTimetable);
router.get('/children/:childId/exam-timetable', auth, parentController.getExamTimetable);
router.get('/children/:childId/timetable/download', auth, parentController.downloadTimetable);

// Fees
router.get('/children/:childId/fees/balance', auth, parentController.getChildFeeBalance);
router.get('/fees/balances', auth, parentController.getParentFeeBalances);
router.get('/fees/payments', auth, parentController.getParentPaymentHistory);
router.post('/fees/pay/mpesa', auth, parentController.makeMPESAPayment);
router.post('/fees/pay/card', auth, parentController.makeCardPayment);
router.get('/fees/receipts/:paymentId/download', auth, parentController.downloadReceipt);

// Academic
router.get('/children/:childId/results', auth, parentController.getChildResults);
router.get('/children/:childId/performance-trend', auth, parentController.getChildPerformanceTrend);
router.get('/children/:childId/report-card', auth, parentController.getChildReportCard);

// Attendance
router.get('/children/:childId/attendance', auth, parentController.getChildAttendance);
router.get('/children/:childId/attendance/summary', auth, parentController.getChildAttendanceSummary);

// Homework
router.get('/children/:childId/homework', auth, parentController.getChildHomework);
router.get('/children/:childId/teachers', auth, parentController.getChildTeacherContacts);

// Discipline
router.get('/children/:childId/discipline', auth, parentController.getChildDiscipline);

// Communication
router.get('/messages', auth, parentController.getMessages);
router.post('/messages', auth, parentController.sendMessage);
router.get('/announcements', auth, parentController.getParentAnnouncements);

// Notifications
router.get('/notifications', auth, parentController.getNotifications);

// Complaints
router.post('/complaints', auth, parentController.submitComplaint);
router.get('/complaints', auth, parentController.getMyComplaints);

export default router;
