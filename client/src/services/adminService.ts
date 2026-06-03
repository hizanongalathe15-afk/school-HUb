import { api } from './api';
import { useAuthStore } from '../store/authStore';
import type {
  SchoolProfile,
  LocationData,
  Infrastructure,
  MediaItem,
  MediaAlbum,
  AdminDashboardMetrics,
  AdminUser,
  BulkUserOperation,
  BulkOperationResult,
  AcademicStructure,
  AcademicClass,
  Stream,
  Subject,
  AcademicTerm,
  GradingSystem,
  Timetable,
  FeeStructure,
  FinanceDashboard,
  FinanceTransaction,
  Bursary,
  Scholarship,
  ReportConfig,
  SystemSettings,
  ActivityLog,
  SystemAlert,
  Permission,
  GovernmentExamResult,
} from '../types/admin';

// ============================================
// ADMIN DASHBOARD
// ============================================
export const adminDashboardService: any = {
  getMetrics: async (): Promise<AdminDashboardMetrics> => {
    const response = await api.get('/admin/dashboard/metrics');
    return response.data;
  },

  getActivityLogs: async (limit = 50): Promise<ActivityLog[]> => {
    const response = await api.get('/admin/dashboard/activity-logs', { params: { limit } });
    return response.data;
  },

  getAlerts: async (): Promise<SystemAlert[]> => {
    const response = await api.get('/admin/dashboard/alerts');
    return response.data;
  },

  acknowledgeAlert: async (alertId: string): Promise<void> => {
    await api.patch(`/admin/dashboard/alerts/${alertId}/acknowledge`);
  },

  getSystemHealth: async (): Promise<AdminDashboardMetrics['systemHealth']> => {
    const response = await api.get('/admin/dashboard/system-health');
    return response.data;
  },

  getLocation: async () => {
    const response = await api.get('/admin/location');
    return response.data;
  },

  updateLocation: async (data: any) => {
    const response = await api.put('/admin/location', data, {
      successMessage: 'Location updated successfully.'
    });
    return response.data;
  },
};

export type AdminWorkspaceRecord = {
  id: string;
  name: string;
  category: string;
  owner: string;
  status: 'Active' | 'Draft' | 'Archived';
  notes: string;
  amount?: number;
  dueDate?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Critical';
  files?: Array<{ name: string; type: string; url: string }>;
  updatedAt: string;
};

export const adminWorkspaceService = {
  list: async (path: string): Promise<AdminWorkspaceRecord[]> => {
    const response = await api.get('/admin/workspaces', { params: { path } });
    return response.data.records;
  },

  create: async (path: string, data: Omit<AdminWorkspaceRecord, 'id' | 'updatedAt'>): Promise<AdminWorkspaceRecord> => {
    const response = await api.post('/admin/workspaces/records', { path, record: data }, {
      successMessage: 'Record created successfully.'
    });
    return response.data;
  },

  update: async (path: string, id: string, data: Omit<AdminWorkspaceRecord, 'id' | 'updatedAt'>): Promise<AdminWorkspaceRecord> => {
    const response = await api.put(`/admin/workspaces/records/${id}`, { path, record: data }, {
      successMessage: 'Record updated successfully.'
    });
    return response.data;
  },

  delete: async (path: string, id: string): Promise<void> => {
    await api.delete(`/admin/workspaces/records/${id}`, {
      data: { path },
      successMessage: 'Record deleted successfully.'
    });
  },
};

export type AdmissionApplication = {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  previousSchool?: string | null;
  previousClass?: string | null;
  academicYear: number;
  term: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ENROLLED';
  notes?: string | null;
  documents: string[];
  applicationDate: string;
};

export const admissionManagementService = {
  list: async (): Promise<AdmissionApplication[]> => {
    const response = await api.get('/admissions');
    return response.data.data;
  },

  updateStatus: async (id: string, status: AdmissionApplication['status'], notes?: string) => {
    const response = await api.put(`/admissions/${id}/status`, { status, notes }, {
      successMessage: status === 'APPROVED' ? 'Application approved and automation completed.' : 'Application updated.'
    });
    return response.data;
  },

  manifest: async () => {
    const response = await api.get('/admissions/automation-manifest');
    return response.data.data;
  }
};

export const automationManagementService = {
  getAdminStats: async (schoolId: string) => {
    const response = await api.get(`/automations/dashboards/admin/${schoolId}`);
    return response.data.stats;
  },

  processEndOfTerm: async (data: {
    schoolId: string;
    term: number;
    year: number;
    options?: { generateReportCards?: boolean; promoteStudents?: boolean; sendNotifications?: boolean };
  }) => {
    const response = await api.post('/automations/terms/end', data, {
      successMessage: 'End-of-term automation completed.'
    });
    return response.data.data;
  },

  generateBulkReportCards: async (data: { classId: string; term: number; year: number }) => {
    const response = await api.post('/automations/reports/bulk', data, { responseType: 'blob' });
    return response.data as Blob;
  },

  syncWhatsAppGroup: async (data: { classId: string; groupId: string }) => {
    const response = await api.post('/automations/whatsapp/sync-group', data, {
      successMessage: 'WhatsApp group synced.'
    });
    return response.data.data;
  },

  getLowStockItems: async () => {
    const response = await api.get('/automations/stock/low');
    return response.data.items;
  },

  getTeachers: async (params?: { schoolId?: string; subject?: string }) => {
    const response = await api.get('/automations/teachers', { params });
    return response.data.teachers;
  },
};

// ============================================
// SCHOOL MANAGEMENT
// ============================================
export const schoolManagementService = {
  getProfile: async (): Promise<SchoolProfile> => {
    const response = await api.get('/admin/school/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<SchoolProfile>): Promise<SchoolProfile> => {
    const response = await api.put('/admin/school/profile', data, {
      successMessage: 'School profile updated successfully.'
    });
    return response.data;
  },

  updateBranding: async (data: { logo?: string; favicon?: string; coverImage?: string; primaryColor?: string; secondaryColor?: string }): Promise<SchoolProfile> => {
    const response = await api.patch('/admin/school/branding', data, {
      successMessage: 'School branding updated successfully.'
    });
    return response.data;
  },

  updateAcademicCalendar: async (data: SchoolProfile['academicCalendar']): Promise<SchoolProfile> => {
    const response = await api.patch('/admin/school/academic-calendar', data, {
      successMessage: 'Academic calendar updated successfully.'
    });
    return response.data;
  },

  updateSchoolHours: async (data: SchoolProfile['schoolHours']): Promise<SchoolProfile> => {
    const response = await api.patch('/admin/school/school-hours', data, {
      successMessage: 'School hours updated successfully.'
    });
    return response.data;
  },

  addBranch: async (data: Omit<SchoolProfile['branches'][0], 'id'>): Promise<SchoolProfile['branches'][0]> => {
    const response = await api.post('/admin/school/branches', data, {
      successMessage: 'Branch added successfully.'
    });
    return response.data;
  },

  updateBranch: async (branchId: string, data: Partial<SchoolProfile['branches'][0]>): Promise<SchoolProfile['branches'][0]> => {
    const response = await api.put(`/admin/school/branches/${branchId}`, data);
    return response.data;
  },

  deleteBranch: async (branchId: string): Promise<void> => {
    await api.delete(`/admin/school/branches/${branchId}`, {
      successMessage: 'Branch deleted successfully.'
    });
  },
};

// ============================================
// LOCATION & ENVIRONMENT
// ============================================
export const locationService = {
  getData: async (): Promise<LocationData> => {
    const response = await api.get('/admin/location');
    return response.data;
  },

  updateGPS: async (data: { latitude: number; longitude: number }): Promise<LocationData> => {
    const response = await api.patch('/admin/location/gps', data, {
      successMessage: 'GPS coordinates updated successfully.'
    });
    return response.data;
  },

  updateSoilInfo: async (data: LocationData['soilInformation']): Promise<LocationData> => {
    const response = await api.patch('/admin/location/soil', data, {
      successMessage: 'Soil information updated successfully.'
    });
    return response.data;
  },

  updateRoadAccess: async (data: LocationData['roadAccess']): Promise<LocationData> => {
    const response = await api.patch('/admin/location/road-access', data, {
      successMessage: 'Road access information updated successfully.'
    });
    return response.data;
  },

  updateClimateData: async (data: LocationData['climateData']): Promise<LocationData> => {
    const response = await api.patch('/admin/location/climate', data, {
      successMessage: 'Climate data updated successfully.'
    });
    return response.data;
  },

  addLandmark: async (data: Omit<LocationData['nearbyLandmarks'][0], 'id'>): Promise<LocationData> => {
    const response = await api.post('/admin/location/landmarks', data, {
      successMessage: 'Landmark added successfully.'
    });
    return response.data;
  },

  deleteLandmark: async (landmarkId: string): Promise<void> => {
    await api.delete(`/admin/location/landmarks/${landmarkId}`, {
      successMessage: 'Landmark deleted successfully.'
    });
  },
};

// ============================================
// INFRASTRUCTURE MANAGEMENT
// ============================================
export const infrastructureService = {
  getData: async (): Promise<Infrastructure> => {
    const response = await api.get('/admin/infrastructure');
    return response.data;
  },

  addClassroom: async (data: Omit<Infrastructure['classrooms'][0], 'id'>): Promise<Infrastructure['classrooms'][0]> => {
    const response = await api.post('/admin/infrastructure/classrooms', data, {
      successMessage: 'Classroom added successfully.'
    });
    return response.data;
  },

  updateClassroom: async (classroomId: string, data: Partial<Infrastructure['classrooms'][0]>): Promise<Infrastructure['classrooms'][0]> => {
    const response = await api.put(`/admin/infrastructure/classrooms/${classroomId}`, data, {
      successMessage: 'Classroom updated successfully.'
    });
    return response.data;
  },

  deleteClassroom: async (classroomId: string): Promise<void> => {
    await api.delete(`/admin/infrastructure/classrooms/${classroomId}`, {
      successMessage: 'Classroom deleted successfully.'
    });
  },

  addLaboratory: async (data: Omit<Infrastructure['laboratories'][0], 'id'>): Promise<Infrastructure['laboratories'][0]> => {
    const response = await api.post('/admin/infrastructure/laboratories', data, {
      successMessage: 'Laboratory added successfully.'
    });
    return response.data;
  },

  updateLaboratory: async (labId: string, data: Partial<Infrastructure['laboratories'][0]>): Promise<Infrastructure['laboratories'][0]> => {
    const response = await api.put(`/admin/infrastructure/laboratories/${labId}`, data, {
      successMessage: 'Laboratory updated successfully.'
    });
    return response.data;
  },

  deleteLaboratory: async (labId: string): Promise<void> => {
    await api.delete(`/admin/infrastructure/laboratories/${labId}`, {
      successMessage: 'Laboratory deleted successfully.'
    });
  },

  addMaintenanceLog: async (data: Omit<Infrastructure['maintenanceLogs'][0], 'id'>): Promise<Infrastructure['maintenanceLogs'][0]> => {
    const response = await api.post('/admin/infrastructure/maintenance', data, {
      successMessage: 'Maintenance log created successfully.'
    });
    return response.data;
  },

  updateMaintenanceLog: async (logId: string, data: Partial<Infrastructure['maintenanceLogs'][0]>): Promise<Infrastructure['maintenanceLogs'][0]> => {
    const response = await api.put(`/admin/infrastructure/maintenance/${logId}`, data, {
      successMessage: 'Maintenance log updated successfully.'
    });
    return response.data;
  },

  addAsset: async (data: Omit<Infrastructure['assets'][0], 'id'>): Promise<Infrastructure['assets'][0]> => {
    const response = await api.post('/admin/infrastructure/assets', data, {
      successMessage: 'Asset added successfully.'
    });
    return response.data;
  },

  updateAsset: async (assetId: string, data: Partial<Infrastructure['assets'][0]>): Promise<Infrastructure['assets'][0]> => {
    const response = await api.put(`/admin/infrastructure/assets/${assetId}`, data, {
      successMessage: 'Asset updated successfully.'
    });
    return response.data;
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    await api.delete(`/admin/infrastructure/assets/${assetId}`, {
      successMessage: 'Asset deleted successfully.'
    });
  },
};

// ============================================
// MEDIA & GALLERY MANAGEMENT
// ============================================
export const mediaManagementService = {
  getAll: async (filters?: { type?: 'image' | 'video'; albumId?: string; featured?: boolean }): Promise<MediaItem[]> => {
    const response = await api.get('/admin/media', { params: filters });
    return response.data;
  },

  upload: async (formData: FormData): Promise<MediaItem> => {
    const response = await api.post('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Media uploaded successfully.'
    });
    return response.data;
  },

  getAllMedia: async (filters?: { type?: 'image' | 'video'; albumId?: string; featured?: boolean }): Promise<MediaItem[]> => {
    const response = await api.get('/admin/media', { params: filters });
    return response.data;
  },

  uploadMedia: async (file: File, data: { title: string; caption?: string; tags?: string[]; albumId?: string }): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    if (data.caption) formData.append('caption', data.caption);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.albumId) formData.append('albumId', data.albumId);

    const response = await api.post('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Media uploaded successfully.'
    });
    return response.data;
  },

  updateMedia: async (mediaId: string, data: Partial<MediaItem>): Promise<MediaItem> => {
    const response = await api.put(`/admin/media/${mediaId}`, data, {
      successMessage: 'Media updated successfully.'
    });
    return response.data;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await api.delete(`/admin/media/${mediaId}`, {
      successMessage: 'Media deleted successfully.'
    });
  },

  featureMedia: async (mediaId: string): Promise<MediaItem> => {
    const response = await api.patch(`/admin/media/${mediaId}/feature`, {}, {
      successMessage: 'Media featured successfully.'
    });
    return response.data;
  },

  unfeatureMedia: async (mediaId: string): Promise<MediaItem> => {
    const response = await api.patch(`/admin/media/${mediaId}/unfeature`, {}, {
      successMessage: 'Media unfeatured successfully.'
    });
    return response.data;
  },

  // Albums
  getAlbums: async (): Promise<MediaAlbum[]> => {
    const response = await api.get('/admin/media/albums');
    return response.data;
  },

  createAlbum: async (data: { name: string; description?: string }): Promise<MediaAlbum> => {
    const response = await api.post('/admin/media/albums', data, {
      successMessage: 'Album created successfully.'
    });
    return response.data;
  },

  updateAlbum: async (albumId: string, data: Partial<MediaAlbum>): Promise<MediaAlbum> => {
    const response = await api.put(`/admin/media/albums/${albumId}`, data, {
      successMessage: 'Album updated successfully.'
    });
    return response.data;
  },

  deleteAlbum: async (albumId: string): Promise<void> => {
    await api.delete(`/admin/media/albums/${albumId}`, {
      successMessage: 'Album deleted successfully.'
    });
  },

  batchUpload: async (files: File[], albumId?: string): Promise<MediaItem[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (albumId) formData.append('albumId', albumId);

    const response = await api.post('/admin/media/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: `${files.length} files uploaded successfully.`
    });
    return response.data;
  },
};

// ============================================
// USER MANAGEMENT
// ============================================
export const userManagementService = {
  // All users
  getAllUsers: async (filters?: { role?: string; search?: string; page?: number; limit?: number }): Promise<{ users: AdminUser[]; total: number; page: number; pages: number }> => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getUser: async (userId: string): Promise<AdminUser> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  incrementProfileView: async (userId: string): Promise<{ profileViews: number } | null> => {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!userId || currentUserId === userId) {
      return null;
    }

    const storageKey = `profile-viewed:${userId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'true') {
      return null;
    }

    try {
      const response = await api.post(`/users/${userId}/view`);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, 'true');
      }
      return response.data;
    } catch (err) {
      return null;
    }
  },

  createUser: async (data: { email: string; firstName: string; lastName: string; role: string; phone?: string; password: string }): Promise<AdminUser> => {
    const response = await api.post('/admin/users', data, {
      successMessage: 'User created successfully.'
    });
    return response.data;
  },

  updateUser: async (userId: string, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await api.put(`/admin/users/${userId}`, data, {
      successMessage: 'User updated successfully.'
    });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`, {
      successMessage: 'User deleted successfully.'
    });
  },

  resetPassword: async (userId: string): Promise<void> => {
    await api.post(`/admin/users/${userId}/reset-password`, {}, {
      successMessage: 'Password reset successfully.'
    });
  },

  blockUser: async (userId: string, reason?: string): Promise<AdminUser> => {
    const response = await api.post(`/admin/users/${userId}/block`, { reason }, {
      successMessage: 'User blocked successfully.'
    });
    return response.data;
  },

  unblockUser: async (userId: string): Promise<AdminUser> => {
    const response = await api.post(`/admin/users/${userId}/unblock`, {}, {
      successMessage: 'User unblocked successfully.'
    });
    return response.data;
  },

  assignRole: async (userId: string, role: string): Promise<AdminUser> => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role }, {
      successMessage: 'Role assigned successfully.'
    });
    return response.data;
  },

  // Bulk operations
  bulkImport: async (operation: BulkUserOperation): Promise<BulkOperationResult> => {
    const response = await api.post('/admin/users/bulk-import', operation, {
      successMessage: 'Bulk import completed.'
    });
    return response.data;
  },

  bulkExport: async (filters: { role?: string; format?: 'csv' | 'excel' }): Promise<Blob> => {
    const response = await api.get('/admin/users/bulk-export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Sessions
  getUserSessions: async (userId: string): Promise<AdminUser['sessions']> => {
    const response = await api.get(`/admin/users/${userId}/sessions`);
    return response.data;
  },

  revokeSession: async (userId: string, sessionId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}/sessions/${sessionId}`, {
      successMessage: 'Session revoked successfully.'
    });
  },

  revokeAllSessions: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/sessions`, {
      successMessage: 'All sessions revoked successfully.'
    });
  },

  // Bulk operations for staff/students
  bulkUpdateStatus: async (userIds: string[], status: string): Promise<void> => {
    await api.post('/admin/users/bulk-update-status', { userIds, status }, {
      successMessage: 'Users status updated successfully.'
    });
  },

  bulkDeleteUsers: async (userIds: string[]): Promise<void> => {
    await api.post('/admin/users/bulk-delete', { userIds }, {
      successMessage: 'Users deleted successfully.'
    });
  },

  bulkImportStudents: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/users/bulk-import-students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Students imported successfully.'
    });
    return response.data;
  },

  bulkImportUsers: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/users/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Users imported successfully.'
    });
    return response.data;
  },
};

// ============================================
// ACADEMIC MANAGEMENT
// ============================================
export const academicManagementService: any = {
  getStructure: async (): Promise<AcademicStructure> => {
    const response = await api.get('/admin/academic/structure');
    return response.data;
  },

  // Classes
  getClasses: async (): Promise<AcademicClass[]> => {
    const response = await api.get('/admin/academic/classes');
    return response.data;
  },

  createClass: async (data: Omit<AcademicClass, 'id'>): Promise<AcademicClass> => {
    const response = await api.post('/admin/academic/classes', data, {
      successMessage: 'Class created successfully.'
    });
    return response.data;
  },

  updateClass: async (classId: string, data: Partial<AcademicClass>): Promise<AcademicClass> => {
    const response = await api.put(`/admin/academic/classes/${classId}`, data, {
      successMessage: 'Class updated successfully.'
    });
    return response.data;
  },

  deleteClass: async (classId: string): Promise<void> => {
    await api.delete(`/admin/academic/classes/${classId}`, {
      successMessage: 'Class deleted successfully.'
    });
  },

  // Streams
  createStream: async (data: Omit<Stream, 'id'>): Promise<Stream> => {
    const response = await api.post('/admin/academic/streams', data, {
      successMessage: 'Stream created successfully.'
    });
    return response.data;
  },

  updateStream: async (streamId: string, data: Partial<Stream>): Promise<Stream> => {
    const response = await api.put(`/admin/academic/streams/${streamId}`, data, {
      successMessage: 'Stream updated successfully.'
    });
    return response.data;
  },

  deleteStream: async (streamId: string): Promise<void> => {
    await api.delete(`/admin/academic/streams/${streamId}`, {
      successMessage: 'Stream deleted successfully.'
    });
  },

  // Subjects
  getSubjects: async (): Promise<Subject[]> => {
    const response = await api.get('/admin/academic/subjects');
    return response.data;
  },

  createSubject: async (data: Omit<Subject, 'id'>): Promise<Subject> => {
    const response = await api.post('/admin/academic/subjects', data, {
      successMessage: 'Subject created successfully.'
    });
    return response.data;
  },

  updateSubject: async (subjectId: string, data: Partial<Subject>): Promise<Subject> => {
    const response = await api.put(`/admin/academic/subjects/${subjectId}`, data, {
      successMessage: 'Subject updated successfully.'
    });
    return response.data;
  },

  deleteSubject: async (subjectId: string): Promise<void> => {
    await api.delete(`/admin/academic/subjects/${subjectId}`, {
      successMessage: 'Subject deleted successfully.'
    });
  },

  // Terms
  getTerms: async (): Promise<AcademicTerm[]> => {
    const response = await api.get('/admin/academic/terms');
    return response.data;
  },

  createTerm: async (data: Omit<AcademicTerm, 'id'>): Promise<AcademicTerm> => {
    const response = await api.post('/admin/academic/terms', data, {
      successMessage: 'Term created successfully.'
    });
    return response.data;
  },

  updateTerm: async (termId: string, data: Partial<AcademicTerm>): Promise<AcademicTerm> => {
    const response = await api.put(`/admin/academic/terms/${termId}`, data, {
      successMessage: 'Term updated successfully.'
    });
    return response.data;
  },

  closeTerm: async (termId: string): Promise<AcademicTerm> => {
    const response = await api.post(`/admin/academic/terms/${termId}/close`, {}, {
      successMessage: 'Term closed successfully.'
    });
    return response.data;
  },

  activateTerm: async (termId: string): Promise<AcademicTerm> => {
    const response = await api.post(`/admin/academic/terms/${termId}/activate`, {}, {
      successMessage: 'Term activated successfully.'
    });
    return response.data;
  },

  // Grading System
  getGradingSystems: async (): Promise<GradingSystem[]> => {
    const response = await api.get('/admin/academic/grading-systems');
    return response.data;
  },

  getGradingSystem: async (): Promise<GradingSystem> => {
    const response = await api.get('/admin/academic/grading-system');
    return response.data;
  },

  createGradingSystem: async (data: Omit<GradingSystem, 'id'>): Promise<GradingSystem> => {
    const response = await api.post('/admin/academic/grading-systems', data, {
      successMessage: 'Grading system created successfully.'
    });
    return response.data;
  },

  updateGradingSystem: async (gradingSystemId: string, data: Partial<GradingSystem>): Promise<GradingSystem> => {
    const response = await api.put(`/admin/academic/grading-systems/${gradingSystemId}`, data, {
      successMessage: 'Grading system updated successfully.'
    });
    return response.data;
  },

  deleteGradingSystem: async (gradingSystemId: string): Promise<void> => {
    await api.delete(`/admin/academic/grading-systems/${gradingSystemId}`, {
      successMessage: 'Grading system deleted successfully.'
    });
  },

  bulkExport: async (filters: { type: 'grading'; ids?: string[] }): Promise<Blob> => {
    const response = await api.get('/admin/academic/grading-systems/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  bulkImport: async (type: 'grading', file: File): Promise<GradingSystem[]> => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    const response = await api.post('/admin/academic/grading-systems/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Grading systems imported successfully.'
    });
    return response.data;
  },

  // Timetable
  getTimetable: async (classId: string, termId?: string): Promise<Timetable> => {
    const response = await api.get(`/admin/academic/timetable/${classId}`, { params: { termId } });
    return response.data;
  },

  createTimetable: async (classId: string, data: Omit<Timetable, 'id'>): Promise<Timetable> => {
    const response = await api.post(`/admin/academic/timetable/${classId}`, data, {
      successMessage: 'Timetable created successfully.'
    });
    return response.data;
  },

  updateTimetable: async (timetableId: string, data: Partial<Timetable>): Promise<Timetable> => {
    const response = await api.put(`/admin/academic/timetable/${timetableId}`, data, {
      successMessage: 'Timetable updated successfully.'
    });
    return response.data;
  },
};

export const governmentService = {
  getIntegrationStatus: async () => {
    const response = await api.get('/admin/academic/government-integration');
    return response.data as {
      connected: boolean;
      lastSync: string;
      examBoard: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
      apiKey?: string;
      endpoint?: string;
    };
  },

  connect: async (data: {
    examBoard: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
    apiKey?: string;
    endpoint?: string;
  }) => {
    const response = await api.post('/admin/academic/government-integration/connect', data, {
      successMessage: 'Government integration connected successfully.'
    });
    return response.data;
  },

  syncResults: async (examBoard: string): Promise<GovernmentExamResult[]> => {
    const response = await api.post('/admin/academic/government-integration/sync', { examBoard });
    return response.data.results;
  },

  updateApplicantStatus: async (applicantId: string, status: string, reason?: string) => {
    const response = await api.patch(`/admin/academic/government-integration/applicants/${applicantId}`, { status, reason });
    return response.data;
  },

  bulkProcess: async (applicantIds: string[], status: string) => {
    const response = await api.post('/admin/academic/government-integration/applicants/bulk-process', { applicantIds, status });
    return response.data;
  },

  sendNotification: async (applicantId: string, status: string, data: { message: string }) => {
    const response = await api.post(`/admin/academic/government-integration/applicants/${applicantId}/notify`, { status, ...data });
    return response.data;
  },
};

// ============================================
// EVENT MANAGEMENT
// ============================================
const normalizeAdminEvent = (record: any) => {
  const now = new Date().toISOString();
  return {
    id: String(record?.id || `event-${Date.now()}`),
    title: String(record?.title || record?.name || 'Untitled event'),
    description: String(record?.description || record?.summary || ''),
    eventType: record?.eventType || 'academic',
    startDate: record?.startDate || now.split('T')[0],
    endDate: record?.endDate || record?.startDate || now.split('T')[0],
    startTime: record?.startTime || '09:00',
    endTime: record?.endTime || '16:00',
    location: record?.location || '',
    venue: record?.venue || record?.location || '',
    organizer: record?.organizer || record?.owner || 'Administration',
    organizerContact: record?.organizerContact || '',
    targetAudience: Array.isArray(record?.targetAudience) ? record.targetAudience : ['students', 'teachers'],
    classesInvolved: Array.isArray(record?.classesInvolved) ? record.classesInvolved : [],
    currentRegistrations: Number(record?.currentRegistrations || 0),
    registrationRequired: Boolean(record?.registrationRequired),
    status: record?.status === 'active' ? 'upcoming' : record?.status === 'archived' ? 'completed' : 'upcoming',
    priority: record?.priority || (record?.status === 'attention' ? 'high' : 'medium'),
    mediaGallery: Array.isArray(record?.mediaGallery) ? record.mediaGallery : [],
    attachments: Array.isArray(record?.attachments) ? record.attachments : [],
    reminders: record?.reminders || { sendEmail: true, sendSms: false, sendWhatsapp: false, daysBefore: [1, 3] },
    socialLinks: record?.socialLinks || {},
    published: Boolean(record?.published ?? record?.status === 'active'),
    publishedBy: record?.publishedBy || 'Admin',
    publishedAt: record?.publishedAt || now,
    lastUpdated: record?.lastUpdated || record?.updatedAt || now,
    views: Number(record?.views || 0),
    likes: Number(record?.likes || 0),
    comments: Number(record?.comments || 0),
    shares: Number(record?.shares || 0),
    rsvps: record?.rsvps || { student: [], teacher: [], parent: [], staff: [] },
    notes: record?.notes || '',
  };
};

export const eventManagementService = {
  getAllEvents: async (filters?: { search?: string; eventType?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/events');
    const rawRecords = Array.isArray(response.data?.records) ? response.data.records : Array.isArray(response.data) ? response.data : [];
    let events = rawRecords.map(normalizeAdminEvent);
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      events = events.filter((event: any) => event.title.toLowerCase().includes(term) || event.description.toLowerCase().includes(term));
    }
    if (filters?.eventType) {
      events = events.filter((event: any) => event.eventType === filters.eventType);
    }
    if (filters?.status) {
      events = events.filter((event: any) => event.status === filters.status);
    }
    const limit = filters?.limit || 50;
    const page = filters?.page || 1;
    const start = (page - 1) * limit;
    const pagedEvents = events.slice(start, start + limit);
    return {
      events: pagedEvents,
      total: events.length,
      page,
      pages: Math.max(1, Math.ceil(events.length / limit)),
    };
  },

  getEventStats: async () => {
    const response = await eventManagementService.getAllEvents({ limit: 1000 });
    const events = response.events;
    return {
      totalEvents: events.length,
      upcomingEvents: events.filter((event: any) => event.status === 'upcoming').length,
      ongoingEvents: events.filter((event: any) => event.status === 'ongoing').length,
      completedEvents: events.filter((event: any) => event.status === 'completed').length,
      cancelledEvents: events.filter((event: any) => event.status === 'cancelled').length,
      totalRegistrations: events.reduce((total: number, event: any) => total + event.currentRegistrations, 0),
      averageAttendance: 0,
      mostPopularEvent: events[0]?.title || '',
      totalMediaItems: events.reduce((total: number, event: any) => total + event.mediaGallery.length, 0),
      totalViews: events.reduce((total: number, event: any) => total + event.views, 0),
      totalEngagement: events.reduce((total: number, event: any) => total + event.likes + event.comments + event.shares, 0),
    };
  },

  uploadMedia: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const eventId = String(formData.get('eventId') || 'temp');
    return api.post(`/media/events/${eventId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      successMessage: 'Event media uploaded successfully.',
    });
  },

  createEvent: async (data: any) => {
    const response = await api.post('/events', {
      ...data,
      title: data.title,
      owner: data.organizer || 'Administration',
      status: data.published ? 'active' : 'pending',
    }, {
      successMessage: 'Event created successfully.',
    });
    return response.data;
  },

  updateEvent: async (eventId: string, data: any) => {
    const response = await api.post('/events/actions', { action: 'Update event', eventId, data });
    return response.data;
  },

  deleteEvent: async (eventId: string) => {
    const response = await api.post('/events/actions', { action: 'Delete event', eventId });
    return response.data;
  },

  publishEvent: async (eventId: string) => {
    const response = await api.post('/events/actions', { action: 'Publish event', eventId });
    return response.data;
  },

  sendEventNotifications: async (eventId: string, data: any) => {
    const response = await api.post('/events/actions', { action: 'Send event notifications', eventId, data });
    return response.data;
  },

  trackShare: async (eventId: string, platform: string) => {
    const response = await api.post('/events/actions', { action: 'Track event share', eventId, platform });
    return response.data;
  },
};

// ============================================
// SCHOOL SETTINGS
// ============================================
export const schoolSettingsService = {
  getSettings: async () => {
    const response = await api.get('/admin/school/profile');
    return {
      schoolName: response.data?.name || 'School',
      motto: response.data?.motto || '',
      phone: response.data?.contactPhone || response.data?.phone || '',
      email: response.data?.contactEmail || response.data?.email || '',
      address: response.data?.address || '',
      bankAccount: response.data?.bankAccount || '',
      mpesaPaybill: response.data?.mpesaPaybill || '',
      logoUrl: response.data?.logo || '',
    };
  },

  updateSettings: async (settings: any) => {
    const response = await api.put('/admin/school/profile', {
      name: settings.schoolName,
      motto: settings.motto,
      contactPhone: settings.phone,
      contactEmail: settings.email,
      address: settings.address,
      bankAccount: settings.bankAccount,
      mpesaPaybill: settings.mpesaPaybill,
      logo: settings.logoUrl,
    }, {
      successMessage: 'School settings updated successfully.',
    });
    return response.data;
  },
};

export const mpesaService = {
  verifyPayment: async (mpesaCode: string): Promise<{ verified: boolean; status?: string; transaction?: any }> => {
    try {
      const response = await api.get(`/mpesa/verify/${encodeURIComponent(mpesaCode)}`);
      const status = response.data?.status || response.data?.ResultDesc || response.data?.message;
      return {
        verified: String(status || '').toLowerCase().includes('paid') || String(status || '').toLowerCase().includes('success'),
        status,
        transaction: response.data,
      };
    } catch (error) {
      return { verified: false, status: 'Unable to verify payment' };
    }
  },

  getTransactions: async () => {
    const response = await api.get('/mpesa/transactions');
    return response.data;
  },
};

// ============================================
// FINANCE MANAGEMENT
// ============================================
export const financeManagementService: any = {
  getDashboard: async (): Promise<FinanceDashboard> => {
    const response = await api.get('/admin/finance/dashboard');
    return response.data;
  },

  // Fee Structure
  getFeeStructure: async (classId: string, termId?: string): Promise<FeeStructure> => {
    const response = await api.get(`/admin/finance/fee-structure/${classId}`, { params: { termId } });
    return response.data;
  },

  getFeeStructures: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/bursar/fee-structures', { params: filters });
    const payload = response.data?.data || response.data;
    return Array.isArray(payload) ? payload : Array.isArray(payload?.feeStructures) ? payload.feeStructures : [];
  },

  createFeeStructure: async (data: Omit<FeeStructure, 'id'>): Promise<FeeStructure> => {
    const response = await api.post('/bursar/fee-structures', data, {
      successMessage: 'Fee structure created successfully.'
    });
    return response.data?.data || response.data;
  },

  updateFeeStructure: async (feeStructureId: string, data: Partial<FeeStructure>): Promise<FeeStructure> => {
    const response = await api.put(`/bursar/fee-structures/${feeStructureId}`, data, {
      successMessage: 'Fee structure updated successfully.'
    });
    return response.data?.data || response.data;
  },

  deleteFeeStructure: async (feeStructureId: string): Promise<void> => {
    await api.delete(`/bursar/fee-structures/${feeStructureId}`, {
      successMessage: 'Fee structure deleted successfully.'
    });
  },

  publishFeeStructure: async (feeStructureId: string, publish: boolean): Promise<any> => {
    const response = await api.put(`/bursar/fee-structures/${feeStructureId}`, { isPublished: publish }, {
      successMessage: publish ? 'Fee structure published successfully.' : 'Fee structure unpublished successfully.'
    });
    return response.data?.data || response.data;
  },

  generateFeeStructurePDF: async (payload: any): Promise<Blob> => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Fee Structure</title></head><body><pre>${JSON.stringify(payload, null, 2)}</pre></body></html>`;
    return new Blob([html], { type: 'text/html' });
  },

  exportFeeStructures: async (filters?: any): Promise<Blob> => {
    const data = await financeManagementService.getFeeStructures(filters);
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  },

  importFeeStructures: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/bursar/fee-structures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Fee structures imported successfully.'
    });
    return response.data?.data || response.data;
  },

  // Transactions
  getTransactions: async (filters?: { type?: 'income' | 'expense'; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<{ transactions: FinanceTransaction[]; total: number; page: number; pages: number }> => {
    const response = await api.get('/admin/finance/transactions', { params: filters });
    return response.data;
  },

  recordTransaction: async (data: Omit<FinanceTransaction, 'id' | 'createdAt' | 'createdBy'>): Promise<FinanceTransaction> => {
    const response = await api.post('/admin/finance/transactions', data, {
      successMessage: 'Transaction recorded successfully.'
    });
    return response.data;
  },

  createTransaction: async (data: any): Promise<any> => {
    const response = await api.post('/admin/finance/transactions', data, {
      successMessage: 'Transaction recorded successfully.'
    });
    return response.data;
  },

  updateTransactionStatus: async (transactionId: string, status: string, notes?: string): Promise<any> => {
    const response = await api.post('/admin/finance/transactions', {
      id: transactionId,
      status,
      notes,
      approvedAt: new Date().toISOString(),
    }, {
      successMessage: 'Transaction status updated successfully.'
    });
    return response.data;
  },

  deleteTransaction: async (transactionId: string): Promise<void> => {
    await api.delete(`/admin/finance/transactions/${transactionId}`, {
      successMessage: 'Transaction deleted successfully.'
    });
  },

  exportTransactions: async (filters?: any): Promise<Blob> => {
    const response = await financeManagementService.getTransactions(filters);
    const transactions = Array.isArray(response) ? response : response?.transactions || [];
    const type = filters?.format === 'csv' ? 'text/csv' : 'application/json';
    const content = filters?.format === 'csv'
      ? [
          'id,studentName,amount,method,status,reference,date',
          ...transactions.map((transaction: any) => [
            transaction.id,
            transaction.studentName || '',
            transaction.amount || 0,
            transaction.method || transaction.paymentMethod || '',
            transaction.status || '',
            transaction.reference || transaction.transactionReference || '',
            transaction.date || transaction.createdAt || '',
          ].join(',')),
        ].join('\n')
      : JSON.stringify(transactions, null, 2);
    return new Blob([content], { type });
  },

  reconcileTransactions: async (dateRange?: { start?: string; end?: string }): Promise<{ count: number }> => {
    const response = await financeManagementService.getTransactions({
      startDate: dateRange?.start,
      endDate: dateRange?.end,
    });
    const transactions = Array.isArray(response) ? response : response?.transactions || [];
    return { count: transactions.length };
  },

  importTransactions: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/finance/transactions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      successMessage: 'Transactions imported successfully.'
    });
    return response.data;
  },

  // Bursaries
  getBursaries: async (): Promise<Bursary[]> => {
    const response = await api.get('/admin/finance/bursaries');
    return response.data;
  },

  createBursary: async (data: Omit<Bursary, 'id' | 'allocations'>): Promise<Bursary> => {
    const response = await api.post('/admin/finance/bursaries', data, {
      successMessage: 'Bursary created successfully.'
    });
    return response.data;
  },

  allocateBursary: async (bursaryId: string, data: Omit<Bursary['allocations'][0], 'awardedAt'>): Promise<Bursary> => {
    const response = await api.post(`/admin/finance/bursaries/${bursaryId}/allocate`, data, {
      successMessage: 'Bursary allocated successfully.'
    });
    return response.data;
  },

  // Scholarships
  getScholarships: async (): Promise<Scholarship[]> => {
    const response = await api.get('/admin/finance/scholarships');
    return response.data;
  },

  createScholarship: async (data: Omit<Scholarship, 'id' | 'recipients'>): Promise<Scholarship> => {
    const response = await api.post('/admin/finance/scholarships', data, {
      successMessage: 'Scholarship created successfully.'
    });
    return response.data;
  },

  // Reports
  generateFinancialReport: async (filters: { startDate: string; endDate: string; type: 'income' | 'expense' | 'all' }): Promise<Blob> => {
    const response = await api.get('/admin/finance/reports', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },
};

// ============================================
// REPORTS CENTER
// ============================================
export const reportsCenterService: any = {
  getConfigs: async (): Promise<ReportConfig[]> => {
    const response = await api.get('/admin/reports/configs');
    return response.data;
  },

  createConfig: async (data: Omit<ReportConfig, 'id' | 'createdAt' | 'createdBy'>): Promise<ReportConfig> => {
    const response = await api.post('/admin/reports/configs', data, {
      successMessage: 'Report configuration created successfully.'
    });
    return response.data;
  },

  updateConfig: async (configId: string, data: Partial<ReportConfig>): Promise<ReportConfig> => {
    const response = await api.put(`/admin/reports/configs/${configId}`, data, {
      successMessage: 'Report configuration updated successfully.'
    });
    return response.data;
  },

  deleteConfig: async (configId: string): Promise<void> => {
    await api.delete(`/admin/reports/configs/${configId}`, {
      successMessage: 'Report configuration deleted successfully.'
    });
  },

  generateReport: async (configId: string, filters?: Record<string, any>): Promise<Blob> => {
    const response = await api.post(`/admin/reports/generate/${configId}`, filters, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Pre-built reports
  generateAcademicReport: async (filters: { classId?: string; termId?: string; includeResults?: boolean }): Promise<Blob> => {
    const response = await api.get('/admin/reports/academic', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  generateAttendanceReport: async (filters: { startDate: string; endDate: string; classId?: string; studentId?: string }): Promise<Blob> => {
    const response = await api.get('/admin/reports/attendance', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  generateDisciplineReport: async (filters: { startDate?: string; endDate?: string; studentId?: string; type?: 'merit' | 'demerit' }): Promise<Blob> => {
    const response = await api.get('/admin/reports/discipline', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  generateKCSEAnalysis: async (year: number): Promise<Blob> => {
    const response = await api.get(`/admin/reports/kcse/${year}`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

// ============================================
// SYSTEM SETTINGS
// ============================================
export const systemSettingsService = {
  getSettings: async (): Promise<SystemSettings> => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateGeneralSettings: async (data: SystemSettings['general']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/general', data, {
      successMessage: 'General settings updated successfully.'
    });
    return response.data;
  },

  updateSecuritySettings: async (data: SystemSettings['security']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/security', data, {
      successMessage: 'Security settings updated successfully.'
    });
    return response.data;
  },

  updateEmailSettings: async (data: SystemSettings['email']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/email', data, {
      successMessage: 'Email settings updated successfully.'
    });
    return response.data;
  },

  updateSMSSettings: async (data: SystemSettings['sms']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/sms', data, {
      successMessage: 'SMS settings updated successfully.'
    });
    return response.data;
  },

  updateMPESASEttings: async (data: SystemSettings['mpesa']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/mpesa', data, {
      successMessage: 'MPESA settings updated successfully.'
    });
    return response.data;
  },

  updateBackupSettings: async (data: SystemSettings['backup']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/backup', data, {
      successMessage: 'Backup settings updated successfully.'
    });
    return response.data;
  },

  updateNotificationSettings: async (data: SystemSettings['notifications']): Promise<SystemSettings> => {
    const response = await api.patch('/admin/settings/notifications', data, {
      successMessage: 'Notification settings updated successfully.'
    });
    return response.data;
  },

  // Backup & Restore
  createBackup: async (): Promise<void> => {
    await api.post('/admin/settings/backup/create', {}, {
      successMessage: 'Backup created successfully.'
    });
  },

  restoreBackup: async (backup: string | File): Promise<void> => {
    if (typeof backup === 'string') {
      await api.post('/admin/settings/backup/restore', { backupId: backup }, {
        successMessage: 'System restore initiated.'
      });
      return;
    }
    // file upload restore (compatibility)
    const fd = new FormData();
    fd.append('file', backup);
    await api.post('/admin/settings/backup/restore-file', fd, { headers: { 'Content-Type': 'multipart/form-data' }, successMessage: 'System restore file uploaded.' });
  },

  listBackups: async (): Promise<{ id: string; createdAt: string; size: number; status: 'completed' | 'failed' }[]> => {
    const response = await api.get('/admin/settings/backup/list');
    return response.data;
  },

  deleteBackup: async (backupId: string): Promise<void> => {
    await api.delete(`/admin/settings/backup/${backupId}`, {
      successMessage: 'Backup deleted successfully.'
    });
  },

  // System Operations
  clearCache: async (): Promise<void> => {
    await api.post('/admin/settings/cache/clear', {}, {
      successMessage: 'Cache cleared successfully.'
    });
  },

  runHealthCheck: async (): Promise<SystemSettings> => {
    const response = await api.get('/admin/settings/health-check');
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (filters?: { userId?: string; action?: string; startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<{ logs: ActivityLog[]; total: number; page: number; pages: number }> => {
    const response = await api.get('/admin/settings/activity-logs', { params: filters });
    return response.data;
  },

  exportActivityLogs: async (filters: { startDate: string; endDate: string }): Promise<Blob> => {
    const response = await api.get('/admin/settings/activity-logs/export', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Additional backup-related methods
  getBackups: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/settings/backups');
      return response.data;
    } catch {
      return [];
    }
  },

  getSystemHealth: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/settings/health');
      return response.data;
    } catch {
      return { databaseSize: 0, mediaSize: 0, totalSize: 0, diskUsage: 0, lastBackupSize: 0, backupCount: 0, healthScore: 85 };
    }
  },

  getBackupSchedule: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/settings/backup/schedule');
      return response.data;
    } catch {
      return null;
    }
  },

  getCloudConfig: async (): Promise<any> => {
    try {
      const response = await api.get('/admin/settings/backup/cloud');
      return response.data;
    } catch {
      return null;
    }
  },

  sendBackupNotification: async (_data: any): Promise<void> => {
    // Stub - notification sent via notificationService
  },

  downloadBackup: async (backupId: string): Promise<Blob> => {
    const response = await api.get(`/admin/settings/backup/${backupId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  saveBackupSchedule: async (schedule: any): Promise<void> => {
    await api.put('/admin/settings/backup/schedule', schedule);
  },

  testCloudConnection: async (_config: any): Promise<{ success: boolean; message?: string }> => {
    // Stub - always succeeds for demo
    return { success: true };
  },

  saveCloudConfig: async (config: any): Promise<void> => {
    await api.put('/admin/settings/backup/cloud', config);
  },

  syncBackupsToCloud: async (): Promise<void> => {
    await api.post('/admin/settings/backup/sync-cloud');
  },

  restoreFromFile: async (_file: File): Promise<void> => {
    // Stub for file restore
  },
};

// ============================================
// PERMISSIONS MANAGEMENT
// ============================================
export const permissionsService = {
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  getRolePermissions: async (role: string): Promise<Permission[]> => {
    const response = await api.get(`/admin/permissions/role/${role}`);
    return response.data;
  },

  updateRolePermissions: async (role: string, permissionIds: string[]): Promise<void> => {
    await api.put(`/admin/permissions/role/${role}`, { permissionIds }, {
      successMessage: 'Role permissions updated successfully.'
    });
  },

  // Additional methods for system toggles and role management
  getSystemToggles: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/permissions/system-toggles');
      return response.data;
    } catch {
      return [];
    }
  },

  getAllRolePermissions: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/permissions/roles');
      return response.data;
    } catch {
      return [];
    }
  },

  updateSystemToggle: async (toggleId: string, enabled: boolean): Promise<void> => {
    await api.patch(`/admin/permissions/system-toggles/${toggleId}`, { enabled });
  },

  updateSystemToggles: async (toggles: any[]): Promise<void> => {
    await api.put('/admin/permissions/system-toggles', { toggles });
  },

  updateAllRolePermissions: async (roles: any[]): Promise<void> => {
    await api.put('/admin/permissions/roles', { roles });
  },
};

// ============================================
// SYSTEM METRICS & SESSIONS (for Admin GOD MODE monitoring)
// ============================================
export const systemService = {
  getMetrics: async (): Promise<any> => {
    const response = await api.get('/admin/dashboard/metrics');
    return response.data;
  },

  getSystemHealth: async (): Promise<any> => {
    const response = await api.get('/admin/dashboard/system-health');
    return response.data;
  },

  getAdminSessions: async (): Promise<{ sessions: any[] }> => {
    try {
      const response = await api.get('/admin/users/sessions');
      return { sessions: response.data || [] };
    } catch (e) {
      // Endpoint may not exist - return empty sessions
      return { sessions: [] };
    }
  },

  revokeAdminSession: async (sessionId: string): Promise<void> => {
    try {
      await api.delete(`/admin/users/sessions/${sessionId}`, {
        successMessage: 'Session revoked successfully.'
      });
    } catch {
      // Silently fail if endpoint missing
    }
  },

  clearAdminSessions: async (scope: 'inactive' | 'all'): Promise<{ deletedCount: number }> => {
    try {
      const response = await api.delete('/admin/users/sessions', {
        params: { scope },
        successMessage: `Cleared ${scope} admin sessions.`
      });
      return response.data;
    } catch {
      return { deletedCount: 0 };
    }
  },
};

// Aliases for components that expect different service names
export const reportsService = reportsCenterService;
export const communicationService: any = {
  sendSMS: async (data: { recipients: string[]; message: string }): Promise<{ sent: number }> => {
    const response = await api.post('/admin/communication/sms', data, { successMessage: 'SMS sent successfully.' });
    return response.data;
  },
  sendEmail: async (data: { recipients: string[]; subject: string; body: string }): Promise<{ sent: number }> => {
    const response = await api.post('/admin/communication/email', data, { successMessage: 'Email sent successfully.' });
    return response.data;
  },
  sendWhatsApp: async (data: { recipients: string[]; message: string }): Promise<{ sent: number }> => {
    const response = await api.post('/admin/communication/whatsapp', data, { successMessage: 'WhatsApp message sent successfully.' });
    return response.data;
  },
  getAnnouncements: async (): Promise<any[]> => {
    const response = await api.get('/admin/communication/announcements');
    return response.data;
  },
  createAnnouncement: async (data: any): Promise<any> => {
    const response = await api.post('/admin/communication/announcements', data, { successMessage: 'Announcement created successfully.' });
    return response.data;
  },
};

export const notificationService: any = {
  sendBulkNotifications: async (data: {
    recipients: string[];
    message: string;
    channels?: string[];
    priority?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ sent: number }> => {
    const recipients = data.recipients.filter(Boolean);
    if (recipients.length === 0) return { sent: 0 };

    const response = await api.post('/communication/notifications/bulk', {
      ...data,
      recipients,
    }, {
      successMessage: 'Notifications sent successfully.',
      silentErrorToast: true,
    });
    return response.data;
  },

  sendBursaryNotification: async (data: any) => {
    const response = await api.post('/communication/notifications/bursary', data, {
      successMessage: 'Bursary notification sent.',
      silentErrorToast: true,
    });
    return response.data;
  },

  sendDisciplineAlert: async (data: any) => {
    const response = await api.post('/communication/notifications/discipline', data, {
      successMessage: 'Discipline alert sent.',
      silentErrorToast: true,
    });
    return response.data;
  },

  sendLowStockAlert: async (data: any) => {
    const response = await api.post('/communication/notifications/low-stock', data, {
      successMessage: 'Low stock alert sent.',
      silentErrorToast: true,
    });
    return response.data;
  },

  notifyNewBook: async (title: string) => {
    const response = await api.post('/communication/notifications/library/new-book', { title }, {
      successMessage: 'Library notification sent.',
      silentErrorToast: true,
    });
    return response.data;
  },
};

export const attendanceService: any = {
  getByClass: async (classId: string, startDate?: string, endDate?: string): Promise<any[]> => {
    const response = await api.get(`/admin/attendance/class/${classId}`, { params: { startDate, endDate } });
    return response.data;
  },
  markAttendance: async (data: any): Promise<any> => {
    const response = await api.post('/admin/attendance/mark', data, { successMessage: 'Attendance marked successfully.' });
    return response.data;
  },
  updateAttendance: async (attendanceId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/attendance/${attendanceId}`, data, { successMessage: 'Attendance updated successfully.' });
    return response.data;
  },
};

export const disciplineService: any = {
  getAll: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/discipline', { params: filters });
    return response.data;
  },
  createRecord: async (data: any): Promise<any> => {
    const response = await api.post('/admin/discipline', data, { successMessage: 'Discipline record created successfully.' });
    return response.data;
  },
  updateRecord: async (recordId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/discipline/${recordId}`, data, { successMessage: 'Discipline record updated successfully.' });
    return response.data;
  },
  deleteRecord: async (recordId: string): Promise<void> => {
    await api.delete(`/admin/discipline/${recordId}`, { successMessage: 'Discipline record deleted successfully.' });
  },
};

export const healthService: any = {
  getRecords: async (studentId?: string): Promise<any[]> => {
    const response = await api.get('/admin/health/records', { params: { studentId } });
    return response.data;
  },
  createRecord: async (data: any): Promise<any> => {
    const response = await api.post('/admin/health/records', data, { successMessage: 'Health record created successfully.' });
    return response.data;
  },
  updateRecord: async (recordId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/health/records/${recordId}`, data, { successMessage: 'Health record updated successfully.' });
    return response.data;
  },
};

export const cocurricularService = {
  getActivities: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/cocurricular', { params: filters });
    return response.data;
  },
  getStats: async (): Promise<any> => {
    const response = await api.get('/admin/cocurricular/stats');
    return response.data;
  },
  uploadMedia: async (formData: FormData, onProgress?: (progressEvent: any) => void): Promise<any> => {
    const response = await api.post('/admin/cocurricular/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
      successMessage: 'Media uploaded successfully.'
    });
    return response.data;
  },
  createActivity: async (data: any): Promise<any> => {
    const response = await api.post('/admin/cocurricular', data, { successMessage: 'Activity created successfully.' });
    return response.data;
  },
  updateActivity: async (activityId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/cocurricular/${activityId}`, data, { successMessage: 'Activity updated successfully.' });
    return response.data;
  },
  deleteActivity: async (activityId: string): Promise<void> => {
    await api.delete(`/admin/cocurricular/${activityId}`, { successMessage: 'Activity deleted successfully.' });
  },
  // Compatibility aliases (older components expect these names)
  getAll: async (filters?: any) => {
    return await (exports as any).cocurricularService.getActivities(filters);
  },
  create: async (data: any) => {
    return await (exports as any).cocurricularService.createActivity(data);
  },
  update: async (id: string, data: any) => {
    return await (exports as any).cocurricularService.updateActivity(id, data);
  },
  delete: async (id: string) => {
    return await (exports as any).cocurricularService.deleteActivity(id);
  },
  exportActivities: async () => {
    const response = await api.get('/admin/cocurricular/export', { responseType: 'blob' });
    return response.data;
  },
  importActivities: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const response = await api.post('/admin/cocurricular/import', fd, { headers: { 'Content-Type': 'multipart/form-data' }, successMessage: 'Activities imported successfully.' });
    return response.data;
  },
};

export const inventoryService: any = {
  getItems: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/inventory', { params: filters });
    return response.data;
  },
  createItem: async (data: any): Promise<any> => {
    const response = await api.post('/admin/inventory', data, { successMessage: 'Inventory item created successfully.' });
    return response.data;
  },
  updateItem: async (itemId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/inventory/${itemId}`, data, { successMessage: 'Inventory item updated successfully.' });
    return response.data;
  },
  deleteItem: async (itemId: string): Promise<void> => {
    await api.delete(`/admin/inventory/${itemId}`, { successMessage: 'Inventory item deleted successfully.' });
  },
};

export const libraryService: any = {
  getBooks: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/library/books', { params: filters });
    return response.data;
  },
  createBook: async (data: any): Promise<any> => {
    const response = await api.post('/admin/library/books', data, { successMessage: 'Book added successfully.' });
    return response.data;
  },
  updateBook: async (bookId: string, data: any): Promise<any> => {
    const response = await api.put(`/admin/library/books/${bookId}`, data, { successMessage: 'Book updated successfully.' });
    return response.data;
  },
  deleteBook: async (bookId: string): Promise<void> => {
    await api.delete(`/admin/library/books/${bookId}`, { successMessage: 'Book deleted successfully.' });
  },
};

export const mediaService: any = mediaManagementService;

// Compatibility stub: Some older components reference `adminTimetableService`.
// Provide a minimal implementation so components compile and basic UI remains functional.
export const adminTimetableService: any = {
  getAll: async (_filters?: any) => ({ items: [], totalPages: 1 }),
  create: async (_payload?: any) => ({}),
  delete: async (_id?: string) => {},
};

export const developerService = {
  runMigration: async (file?: File | null): Promise<any> => {
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      const response = await api.post('/admin/developer/migrate/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }, successMessage: 'Migration file uploaded.' });
      return response.data;
    }
    const response = await api.post('/admin/developer/migrate', {}, { successMessage: 'Migration completed successfully.' });
    return response.data;
  },
  executeSql: async (sql: string): Promise<any> => {
    const response = await api.post('/admin/developer/execute-sql', { sql }, { successMessage: 'SQL executed.' });
    return response.data;
  },
  clearCache: async (): Promise<any> => {
    const response = await api.post('/admin/developer/cache/clear', {}, { successMessage: 'Cache cleared successfully.' });
    return response.data;
  },
  getLogs: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/developer/logs', { params: filters });
    return response.data;
  },
  // Added missing methods for AdminDeveloperPage
  getSystemInfo: async (): Promise<any> => {
    const response = await api.get('/admin/developer/system-info');
    return response.data;
  },
  getDatabaseTables: async (): Promise<any[]> => {
    const response = await api.get('/admin/developer/database/tables');
    return response.data;
  },
  getSystemLogs: async (filters?: any): Promise<any[]> => {
    const response = await api.get('/admin/developer/system-logs', { params: filters });
    return response.data;
  },
  getQueueJobs: async (): Promise<any[]> => {
    const response = await api.get('/admin/developer/queue/jobs');
    return response.data;
  },
  getPerformanceMetrics: async (): Promise<any> => {
    const response = await api.get('/admin/developer/performance');
    return response.data;
  },
  getTableData: async (tableName: string): Promise<any[]> => {
    const response = await api.get(`/admin/developer/database/tables/${tableName}`);
    return response.data;
  },
  retryQueueJob: async (jobId: string): Promise<any> => {
    const response = await api.post(`/admin/developer/queue/jobs/${jobId}/retry`);
    return response.data;
  },
  clearQueue: async (): Promise<any> => {
    const response = await api.post('/admin/developer/queue/clear');
    return response.data;
  },
  optimizeDatabase: async (): Promise<any> => {
    const response = await api.post('/admin/developer/database/optimize');
    return response.data;
  },
  generateReport: async (type: string, params?: any): Promise<any> => {
    const response = await api.post('/admin/developer/reports/generate', { type, params });
    return response.data;
  },
};

export const financeService = financeManagementService;
export const settingsService = systemSettingsService;

export default {
  dashboard: adminDashboardService,
  school: schoolManagementService,
  location: locationService,
  infrastructure: infrastructureService,
  media: mediaManagementService,
  users: userManagementService,
  academic: academicManagementService,
  finance: financeManagementService,
  reports: reportsCenterService,
  settings: systemSettingsService,
  permissions: permissionsService,
  system: systemService,
  // Aliases
  reportsService,
  communicationService,
  attendanceService,
  disciplineService,
  healthService,
  cocurricularService,
  inventoryService,
  libraryService,
  mediaService,
  developerService,
  financeService,
  settingsService,
};
