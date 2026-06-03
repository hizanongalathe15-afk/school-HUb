import { Router } from 'express';
import { teacherController } from '../controllers/teacherController.js';
import { auth } from '../middleware/auth.js';
import { disciplineController } from '../controllers/disciplineController.js';
import { attendanceController } from '../controllers/attendanceController.js';

const router = Router();

// Legacy routes (plural /teachers)
router.get('/', auth, teacherController.list);
router.get('/ranking', auth, teacherController.ranking);
router.get('/:id/classes', auth, teacherController.classes);

// Teacher dashboard and profile routes (singular /teacher)
router.get('/dashboard', auth, teacherController.getDashboard);
router.get('/dashboard/stats', auth, teacherController.dashboardStats);
router.get('/dashboard/today-classes', auth, teacherController.getTodayTimetable);
router.get('/dashboard/tasks', auth, teacherController.getDashboard);
router.get('/dashboard/alerts', auth, teacherController.getNotifications);
router.get('/profile', auth, teacherController.getProfile);
router.put('/profile', auth, teacherController.updateProfile);

// Classes routes
router.get('/classes', auth, teacherController.getClasses);
router.get('/classes/:id', auth, teacherController.getClassStudents);
router.get('/classes/:id/timetable', auth, teacherController.getClassTimetable);

// Students routes
router.get('/students', auth, teacherController.getMyStudents);
router.get('/students/:studentId', auth, teacherController.getStudentDetails);
router.get('/students/:studentId/academics', auth, teacherController.getStudentDetails);
router.get('/students/:studentId/attendance', auth, attendanceController.getByStudent);
router.get('/students/:studentId/discipline', auth, disciplineController.getRecords);
router.post('/students/:studentId/notes', auth, teacherController.addStudentNote);
router.post('/students/:studentId/flag', auth, teacherController.addStudentNote);

// Announcements routes
router.get('/announcements', auth, teacherController.getAnnouncements);
router.post('/announcements', auth, teacherController.createAnnouncement);
router.put('/announcements/:id', auth, teacherController.updateAnnouncement);
router.delete('/announcements/:id', auth, teacherController.deleteAnnouncement);

// Messages routes
router.get('/messages', auth, teacherController.getMessages);
router.post('/messages', auth, teacherController.sendMessage);
router.put('/messages/:id/read', auth, teacherController.markMessageAsRead);
router.post('/messages/bulk', auth, teacherController.sendBulkMessage);

// Meetings routes
router.get('/meetings', auth, teacherController.getMeetings);
router.post('/meetings', auth, teacherController.scheduleMeeting);
router.put('/meetings/:id', auth, teacherController.updateMeetingStatus);
router.put('/meetings/:id/respond', auth, teacherController.updateMeetingStatus);
router.put('/meetings/:id/notes', auth, teacherController.updateMeetingStatus);
router.delete('/meetings/:id', auth, teacherController.updateMeetingStatus);

// Discipline routes
router.get('/discipline', auth, disciplineController.getRecords);
router.post('/discipline/merit', auth, disciplineController.recordMerit);
router.post('/discipline/demerit', auth, disciplineController.recordDemerit);
router.post('/discipline/warning', auth, disciplineController.recordWarning);

// Notifications routes
router.get('/notifications', auth, teacherController.getNotifications);
router.put('/notifications/:id/read', auth, teacherController.markNotificationAsRead);
router.put('/notifications/read-all', auth, teacherController.markAllNotificationsAsRead);
router.get('/notifications/preferences', auth, teacherController.getNotificationPreferences);
router.put('/notifications/preferences', auth, teacherController.updateNotificationPreferences);

// Homework routes
router.get('/homework', auth, teacherController.getHomework);
router.post('/homework', auth, teacherController.createHomework);
router.put('/homework/:id', auth, teacherController.updateHomework);
router.delete('/homework/:id', auth, teacherController.deleteHomework);
router.get('/homework/:homeworkId/submissions', auth, teacherController.getHomeworkSubmissions);
router.put('/homework/submissions/:submissionId', auth, teacherController.gradeSubmission);

// Grades and reports
router.get('/grades', auth, teacherController.getGrades);
router.post('/grades/enter', auth, teacherController.enterGrades);
router.put('/grades/:gradeId', auth, teacherController.updateGrade);
router.get('/grades/summary/:classId', auth, teacherController.getGradeSummary);
router.get('/grades/report-card/:classId', auth, teacherController.generateReportCard);

// Lesson planning
router.get('/lessons', auth, teacherController.getLessonPlans);
router.post('/lessons', auth, teacherController.createLessonPlan);
router.put('/lessons/:lessonId', auth, teacherController.updateLessonPlan);
router.delete('/lessons/:lessonId', auth, teacherController.deleteLessonPlan);
router.post('/lessons/:lessonId/share', auth, teacherController.shareLessonPlan);

// Timetable routes
router.get('/timetable', auth, teacherController.getWeeklyTeacherTimetable);
router.get('/timetable/class/:classId', auth, teacherController.getClassTimetable);
router.post('/timetable/request-change', auth, teacherController.createTeacherRequest);
router.post('/timetable/substitution', auth, teacherController.createTeacherRequest);

// Attendance routes
router.post('/attendance/mark', auth, teacherController.markBulkAttendance);
router.post('/attendance/subject', auth, teacherController.markBulkAttendance);

// Exams, resources, professional development, support, and persistent workspace records
router.get('/exams/timetable', auth, teacherController.getExamTimetable);
router.get('/exams/invigilation', auth, teacherController.getInvigilationDuties);
router.post('/exams/irregularity', auth, teacherController.reportExamIrregularity);
router.get('/reports/class/:classId', auth, teacherController.generateClassReport);
router.get('/reports/student/:studentId', auth, teacherController.generateStudentReport);
router.get('/reports/subject/:subjectId', auth, teacherController.generateSubjectReport);
router.get('/reports/:reportId/export', auth, teacherController.exportReport);
router.post('/requests', auth, teacherController.createTeacherRequest);
router.get('/workspaces', auth, teacherController.listWorkspaceRecords);
router.post('/workspaces/records', auth, teacherController.createWorkspaceRecord);
router.put('/workspaces/records/:recordId', auth, teacherController.updateWorkspaceRecord);
router.delete('/workspaces/records/:recordId', auth, teacherController.deleteWorkspaceRecord);

export default router;
