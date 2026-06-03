import { Router } from 'express';
import { automationController } from '../controllers/automationController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.use(auth);

router.post('/students/register', automationController.registerStudent);

router.get('/messages/conversations', automationController.getConversations);
router.get('/messages/unread-count', automationController.getUnreadCount);
router.get('/messages/:parentId/:teacherId/:studentId', automationController.getChatMessages);
router.post('/messages/parent-to-teacher', automationController.sendMessageToTeacher);
router.post('/messages/teacher-reply', automationController.teacherReplyToParent);
router.patch('/messages/:messageId/read', automationController.markMessageAsRead);

router.post('/attendance/mark', automationController.markAttendance);
router.get('/attendance/student/:studentId', automationController.getStudentAttendance);
router.get('/attendance/class/:classId/summary', automationController.getClassAttendanceSummary);

router.post('/grades/publish', automationController.publishGrades);
router.get('/grades/student/:studentId', automationController.getStudentResults);
router.get('/grades/class/:classId/subject/:subjectId/summary', automationController.getClassResultsSummary);

router.post('/fees/payments', automationController.processPayment);
router.get('/fees/student/:studentId/balance', automationController.getFeeBalance);
router.get('/fees/student/:studentId/payments', automationController.getPaymentHistory);
router.get('/fees/payments/:paymentId/receipt', automationController.generateReceipt);

router.post('/stock/requests', automationController.createStockRequest);
router.get('/stock/requests', automationController.getStockRequests);
router.post('/stock/requests/:requestId/approve', automationController.approveStockRequest);
router.get('/stock/low', automationController.getLowStockItems);

router.post('/teachers', automationController.addTeacher);
router.get('/teachers', automationController.getAllTeachers);
router.get('/teachers/:teacherId/classes', automationController.getTeacherClasses);

router.post('/meetings', automationController.requestMeeting);
router.get('/meetings', automationController.getMyMeetings);
router.patch('/meetings/:meetingId/status', automationController.updateMeetingStatus);
router.delete('/meetings/:meetingId', automationController.cancelMeeting);

router.post('/online-classes/join', automationController.joinOnlineClass);
router.post('/online-classes/start', automationController.startLiveClass);
router.post('/online-classes/:classSessionId/end', automationController.endLiveClass);
router.get('/online-classes/active', automationController.getActiveLiveClasses);

router.post('/terms/end', automationController.processEndOfTerm);
router.get('/reports/student/:studentId/term/:term/year/:year', automationController.generateReportCard);
router.post('/reports/bulk', automationController.generateBulkReportCards);

router.post('/imports/students', automationController.bulkImportStudents);
router.post('/parents/self-claim', automationController.parentSelfClaim);

router.post('/notifications', automationController.sendManualNotification);
router.get('/notifications', automationController.getUserNotifications);
router.patch('/notifications/:notificationId/read', automationController.markNotificationAsRead);

router.get('/dashboards/parents/:parentId', automationController.getParentDashboardStats);
router.get('/dashboards/teachers/:teacherId', automationController.getTeacherDashboardStats);
router.get('/dashboards/admin/:schoolId', automationController.getAdminDashboardStats);

router.post('/whatsapp/sync-group', automationController.syncWhatsAppGroup);
router.post('/whatsapp/broadcast', automationController.sendWhatsAppBroadcast);

export default router;
