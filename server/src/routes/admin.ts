import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth, roleCheck } from '../middleware/auth.js';
import { adminController } from '../controllers/adminController.js';

const router = Router();
const mediaUploadDir = path.resolve(process.cwd(), 'server/uploads/media');

fs.mkdirSync(mediaUploadDir, { recursive: true });

const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, mediaUploadDir),
    filename: (_req, file, cb) => {
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'media';
      cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = file.mimetype.startsWith('image/')
      || file.mimetype.startsWith('video/')
      || file.mimetype === 'application/pdf';
    if (allowed) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported media type'));
  },
});

const academicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// All admin routes require authentication and admin/principal/developer role
router.use(auth);
router.use(roleCheck(['ADMIN', 'PRINCIPAL', 'DEVELOPER']));

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard/metrics', adminController.getDashboardMetrics);
router.get('/dashboard/activity-logs', adminController.getActivityLogs);
router.get('/dashboard/alerts', adminController.getSystemAlerts);
router.patch('/dashboard/alerts/:alertId/acknowledge', adminController.acknowledgeAlert);
router.get('/dashboard/system-health', adminController.getSystemHealth);

// Generic backend storage for every admin/principal sidebar workspace that
// does not yet have a dedicated domain table/controller.
router.get('/workspaces', adminController.getWorkspaceRecords);
router.post('/workspaces/records', adminController.createWorkspaceRecord);
router.put('/workspaces/records/:recordId', adminController.updateWorkspaceRecord);
router.delete('/workspaces/records/:recordId', adminController.deleteWorkspaceRecord);

// ============================================
// SCHOOL MANAGEMENT
// ============================================
router.get('/school/profile', adminController.getSchoolProfile);
router.put('/school/profile', adminController.updateSchoolProfile);
router.patch('/school/branding', adminController.updateSchoolBranding);
router.patch('/school/academic-calendar', adminController.updateAcademicCalendar);
router.patch('/school/school-hours', adminController.updateSchoolHours);

// Branches
router.post('/school/branches', adminController.addBranch);
router.put('/school/branches/:branchId', adminController.updateBranch);
router.delete('/school/branches/:branchId', adminController.deleteBranch);

// ============================================
// LOCATION & ENVIRONMENT
// ============================================
router.get('/location', adminController.getLocationData);
router.put('/location', adminController.updateLocation);
router.patch('/location/gps', adminController.updateGPS);
router.patch('/location/soil', adminController.updateSoilInfo);
router.patch('/location/road-access', adminController.updateRoadAccess);
router.patch('/location/climate', adminController.updateClimateData);
router.post('/location/landmarks', adminController.addLandmark);
router.delete('/location/landmarks/:landmarkId', adminController.deleteLandmark);

// ============================================
// INFRASTRUCTURE MANAGEMENT
// ============================================
router.get('/infrastructure', adminController.getInfrastructure);

// Classrooms
router.post('/infrastructure/classrooms', adminController.addClassroom);
router.put('/infrastructure/classrooms/:classroomId', adminController.updateClassroom);
router.delete('/infrastructure/classrooms/:classroomId', adminController.deleteClassroom);

// Laboratories
router.post('/infrastructure/laboratories', adminController.addLaboratory);
router.put('/infrastructure/laboratories/:labId', adminController.updateLaboratory);
router.delete('/infrastructure/laboratories/:labId', adminController.deleteLaboratory);

// Maintenance
router.post('/infrastructure/maintenance', adminController.addMaintenanceLog);
router.put('/infrastructure/maintenance/:logId', adminController.updateMaintenanceLog);

// Assets
router.post('/infrastructure/assets', adminController.addAsset);
router.put('/infrastructure/assets/:assetId', adminController.updateAsset);
router.delete('/infrastructure/assets/:assetId', adminController.deleteAsset);

// ============================================
// MEDIA & GALLERY MANAGEMENT
// ============================================
router.get('/media', adminController.getAllMedia);
router.post('/media/upload', mediaUpload.single('file'), adminController.uploadMedia);
router.put('/media/:mediaId', adminController.updateMedia);
router.delete('/media/:mediaId', adminController.deleteMedia);
router.patch('/media/:mediaId/feature', adminController.featureMedia);
router.patch('/media/:mediaId/unfeature', adminController.unfeatureMedia);

// Albums
router.get('/media/albums', adminController.getAlbums);
router.post('/media/albums', adminController.createAlbum);
router.put('/media/albums/:albumId', adminController.updateAlbum);
router.delete('/media/albums/:albumId', adminController.deleteAlbum);
router.post('/media/batch-upload', adminController.batchUpload);

// ============================================
// COMMUNICATION MANAGEMENT
// ============================================
router.get('/communication/announcements', adminController.getAnnouncements);
router.post('/communication/announcements', mediaUpload.array('media', 20), adminController.createAnnouncement);
router.put('/communication/announcements/:announcementId', mediaUpload.array('media', 20), adminController.updateAnnouncement);
router.delete('/communication/announcements/:announcementId', adminController.deleteAnnouncement);

// ============================================
// USER MANAGEMENT
// ============================================
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);
router.post('/users/:userId/block', adminController.blockUser);
router.post('/users/:userId/unblock', adminController.unblockUser);
router.patch('/users/:userId/role', adminController.assignRole);

// Bulk operations
router.post('/users/bulk-import', adminController.bulkImportUsers);
router.get('/users/bulk-export', adminController.bulkExportUsers);

// Sessions
router.get('/users/:userId/sessions', adminController.getUserSessions);
router.delete('/users/:userId/sessions/:sessionId', adminController.revokeSession);
router.delete('/users/:userId/sessions', adminController.revokeAllSessions);

// ============================================
// ACADEMIC MANAGEMENT
// ============================================
router.get('/academic/structure', adminController.getAcademicStructure);

// Classes
router.get('/academic/classes', adminController.getClasses);
router.post('/academic/classes', adminController.createClass);
router.put('/academic/classes/:classId', adminController.updateClass);
router.delete('/academic/classes/:classId', adminController.deleteClass);

// Streams
router.post('/academic/streams', adminController.createStream);
router.put('/academic/streams/:streamId', adminController.updateStream);
router.delete('/academic/streams/:streamId', adminController.deleteStream);

// Subjects
router.get('/academic/subjects', adminController.getSubjects);
router.post('/academic/subjects', adminController.createSubject);
router.put('/academic/subjects/:subjectId', adminController.updateSubject);
router.delete('/academic/subjects/:subjectId', adminController.deleteSubject);

// Terms
router.get('/academic/terms', adminController.getTerms);
router.post('/academic/terms', adminController.createTerm);
router.put('/academic/terms/:termId', adminController.updateTerm);
router.post('/academic/terms/:termId/close', adminController.closeTerm);
router.post('/academic/terms/:termId/activate', adminController.activateTerm);

// Grading System
router.get('/academic/grading-systems/export', adminController.exportGradingSystems);
router.post('/academic/grading-systems/import', academicUpload.single('file'), adminController.importGradingSystems);
router.get('/academic/grading-systems', adminController.getGradingSystems);
router.post('/academic/grading-systems', adminController.createGradingSystem);
router.put('/academic/grading-systems/:gradingSystemId', adminController.updateGradingSystemById);
router.delete('/academic/grading-systems/:gradingSystemId', adminController.deleteGradingSystem);
router.get('/academic/grading-system', adminController.getGradingSystem);
router.put('/academic/grading-system', adminController.updateGradingSystem);

// Government exam integration
router.get('/academic/government-integration', adminController.getGovernmentIntegration);
router.post('/academic/government-integration/connect', adminController.connectGovernmentIntegration);
router.post('/academic/government-integration/sync', adminController.syncGovernmentResults);
router.patch('/academic/government-integration/applicants/:applicantId', adminController.updateGovernmentApplicantStatus);
router.post('/academic/government-integration/applicants/bulk-process', adminController.bulkProcessGovernmentApplicants);
router.post('/academic/government-integration/applicants/:applicantId/notify', adminController.notifyGovernmentApplicant);

// Timetable
router.get('/academic/timetable/:classId', adminController.getTimetable);
router.post('/academic/timetable/:classId', adminController.createTimetable);
router.put('/academic/timetable/:timetableId', adminController.updateTimetable);

// ============================================
// FINANCE MANAGEMENT
// ============================================
router.get('/finance/dashboard', adminController.getFinanceDashboard);

// Fee Structure
router.get('/finance/fee-structure/:classId', adminController.getFeeStructure);
router.post('/finance/fee-structure', adminController.createFeeStructure);
router.put('/finance/fee-structure/:feeStructureId', adminController.updateFeeStructure);

// Transactions
router.get('/finance/transactions', adminController.getTransactions);
router.post('/finance/transactions', adminController.recordTransaction);
router.delete('/finance/transactions/:transactionId', adminController.deleteTransaction);

// Bursaries
router.get('/finance/bursaries', adminController.getBursaries);
router.post('/finance/bursaries', adminController.createBursary);
router.post('/finance/bursaries/:bursaryId/allocate', adminController.allocateBursary);

// Scholarships
router.get('/finance/scholarships', adminController.getScholarships);
router.post('/finance/scholarships', adminController.createScholarship);

// Reports
router.get('/finance/reports', adminController.generateFinancialReport);

// ============================================
// REPORTS CENTER
// ============================================
router.get('/reports/configs', adminController.getReportConfigs);
router.post('/reports/configs', adminController.createReportConfig);
router.put('/reports/configs/:configId', adminController.updateReportConfig);
router.delete('/reports/configs/:configId', adminController.deleteReportConfig);
router.post('/reports/generate/:configId', adminController.generateReport);

// Pre-built reports
router.get('/reports/academic', adminController.generateAcademicReport);
router.get('/reports/attendance', adminController.generateAttendanceReport);
router.get('/reports/discipline', adminController.generateDisciplineReport);
router.get('/reports/kcse/:year/summary', adminController.getKcseExamSummary);
router.get('/reports/kcse/:year/export', adminController.exportKcseExamResults);
router.get('/reports/kcse/:year', adminController.generateKCSEAnalysis);

// Attendance Management
router.get('/attendance/date/:date', adminController.getAttendanceByDate);
router.post('/attendance/bulk-mark', adminController.bulkMarkAttendance);
router.get('/attendance/export/:date', adminController.exportAttendanceByDate);
router.post('/attendance/import/:date', academicUpload.single('file'), adminController.importAttendanceByDate);

// ============================================
// SYSTEM SETTINGS
// ============================================
router.get('/settings', adminController.getSystemSettings);
router.patch('/settings/general', adminController.updateGeneralSettings);
router.patch('/settings/security', adminController.updateSecuritySettings);
router.patch('/settings/email', adminController.updateEmailSettings);
router.patch('/settings/sms', adminController.updateSMSSettings);
router.patch('/settings/mpesa', adminController.updateMPESASEttings);
router.patch('/settings/backup', adminController.updateBackupSettings);
router.patch('/settings/notifications', adminController.updateNotificationSettings);

// Backup & Restore
router.post('/settings/backup/create', adminController.createBackup);
router.post('/settings/backup/restore', adminController.restoreBackup);
router.post('/settings/backup/restore-file', academicUpload.single('file'), adminController.importAttendanceByDate);
router.get('/settings/backup/list', adminController.listBackups);
router.get('/settings/backups', adminController.listBackups);
router.get('/settings/health', adminController.getBackupSystemHealth);
router.get('/settings/backup/schedule', adminController.getBackupSchedule);
router.put('/settings/backup/schedule', adminController.saveBackupSchedule);
router.get('/settings/backup/cloud', adminController.getCloudConfig);
router.put('/settings/backup/cloud', adminController.saveCloudConfig);
router.post('/settings/backup/sync-cloud', adminController.syncBackupsToCloud);
router.get('/settings/backup/:backupId/download', adminController.downloadBackup);
router.delete('/settings/backup/:backupId', adminController.deleteBackup);

// System Operations
router.post('/settings/cache/clear', adminController.clearCache);
router.get('/settings/health-check', adminController.runHealthCheck);

// Activity Logs
router.get('/settings/activity-logs', adminController.getActivityLogs);
router.get('/settings/activity-logs/export', adminController.exportActivityLogs);

// ============================================
// PERMISSIONS MANAGEMENT
// ============================================
router.get('/permissions', adminController.getAllPermissions);
router.get('/permissions/role/:role', adminController.getRolePermissions);
router.put('/permissions/role/:role', adminController.updateRolePermissions);

export default router;
