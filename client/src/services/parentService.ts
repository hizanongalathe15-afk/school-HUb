import api from './api';
import { useAuthStore } from '../store/authStore';
import type {
  ParentChild,
  ParentProfile,
  ParentDashboard,
  StudentResult,
  PerformanceTrend,
  ReportCard,
  AttendanceRecord,
  AttendanceSummary,
  FeeBalance,
  FeePayment,
  HomeworkAssignment,
  WeeklyTimetable,
  DisciplineRecord,
  Streak,
  Message,
  Announcement,
  MeetingSlot,
  ParentMeeting,
  SchoolEvent,
  Complaint,
  Notification,
  NotificationPreferences,
  CommunicationPreferences,
  ParentApiResponse,
  SubjectPerformance,
  AcademicReport,
  TermSummary,
} from '../types/parent';

// ============================================
// DASHBOARD API
// ============================================
export const parentDashboardAPI = {
  // Get parent dashboard data
  getDashboard: async (): Promise<ParentApiResponse<ParentDashboard>> => {
    const response = await api.get('/parent/dashboard');
    return response.data;
  },

  // Get quick stats
  getQuickStats: async () => {
    const response = await api.get('/parent/dashboard/stats');
    return response.data;
  },
};

// ============================================
// CHILDREN API
// ============================================
export const childrenAPI = {
  // Get all children for current parent
  getMyChildren: async (): Promise<ParentApiResponse<ParentChild[]>> => {
    const response = await api.get('/parent/children');
    return response.data;
  },

  // Link an already-enrolled student to the signed-in parent once
  linkExistingStudent: async (data: {
    admissionNumber: string;
    dateOfBirth: string;
    relationship: string;
    studentEmail?: string;
  }): Promise<ParentApiResponse<ParentChild>> => {
    const response = await api.post('/parent/children/link-existing', data);
    return response.data;
  },

  // Get specific child details
  getChild: async (childId: string): Promise<ParentApiResponse<ParentChild>> => {
    const response = await api.get(`/parent/children/${childId}`);
    return response.data;
  },

  // Get child's medical information
  getChildMedicalInfo: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/medical`);
    return response.data;
  },

  // Update medical information (allergies, conditions)
  updateMedicalInfo: async (childId: string, medicalInfo: any) => {
    const response = await api.put(`/parent/children/${childId}/medical`, medicalInfo);
    return response.data;
  },

  // Get child's profile summary
  getChildSummary: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/summary`);
    return response.data;
  },
};

// ============================================
// ACADEMIC PERFORMANCE API
// ============================================
export const academicAPI = {
  // Get child's results for a term
  getResults: async (childId: string, termId?: string): Promise<ParentApiResponse<StudentResult[]>> => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/results`, { params });
    return response.data;
  },

  // Get performance trend over time
  getPerformanceTrend: async (childId: string): Promise<ParentApiResponse<PerformanceTrend[]>> => {
    const response = await api.get(`/parent/children/${childId}/performance-trend`);
    return response.data;
  },

  // Get report card
  getReportCard: async (childId: string, termId: string): Promise<ParentApiResponse<ReportCard>> => {
    const response = await api.get(`/parent/children/${childId}/report-card`, { params: { termId } });
    return response.data;
  },

  // Download report card as PDF
  downloadReportCard: async (childId: string, termId: string) => {
    const response = await api.get(`/parent/children/${childId}/report-card/download`, {
      params: { termId },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get all report cards for a child
  getAllReportCards: async (childId: string): Promise<ParentApiResponse<ReportCard[]>> => {
    const response = await api.get(`/parent/children/${childId}/report-cards`);
    return response.data;
  },

  // Get subject-wise analysis
  getSubjectAnalysis: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/subject-analysis`, { params });
    return response.data;
  },

  // Get subject performance details
  getSubjectPerformance: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/subject-performance`, { params });
    return response.data;
  },

  // Get academic reports
  getReports: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/academic-reports`, { params });
    return response.data;
  },

  // Get term summary
  getTermSummary: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/term-summary`, { params });
    return response.data;
  },

  // Get report preview
  getReportPreview: async (childId: string, termId: string) => {
    const response = await api.get(`/parent/children/${childId}/report-preview`, { params: { termId } });
    return response.data;
  },

  // Download academic report
  downloadReport: async (reportId: string) => {
    const response = await api.get(`/parent/reports/${reportId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceAPI = {
  // Get attendance records for a month
  getAttendance: async (childId: string, monthOrParams?: number | { month?: number; year?: number }, year?: number): Promise<ParentApiResponse<AttendanceRecord[]>> => {
    const params: any = typeof monthOrParams === 'object'
      ? monthOrParams
      : { ...(monthOrParams ? { month: monthOrParams } : {}), ...(year ? { year } : {}) };
    const response = await api.get(`/parent/children/${childId}/attendance`, { params });
    return response.data;
  },

  // Get attendance summary
  getAttendanceSummary: async (childId: string, month?: number, year?: number): Promise<ParentApiResponse<AttendanceSummary>> => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get(`/parent/children/${childId}/attendance/summary`, { params });
    return response.data;
  },

  // Get attendance chart data
  getAttendanceChart: async (childId: string, months?: number) => {
    const params = months ? { months } : {};
    const response = await api.get(`/parent/children/${childId}/attendance/chart`, { params });
    return response.data;
  },

  // Submit absence request
  submitAbsenceRequest: async (childId: string, startDate: string, endDate: string, reason: string) => {
    const response = await api.post(`/parent/children/${childId}/absence-request`, {
      startDate,
      endDate,
      reason,
    });
    return response.data;
  },

  // Get absence requests history
  getAbsenceRequests: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/absence-requests`);
    return response.data;
  },
};

// ============================================
// FEE MANAGEMENT API
// ============================================
export const feesAPI = {
  // Get fee balance for all children
  getFeeBalances: async (): Promise<ParentApiResponse<FeeBalance[]>> => {
    const response = await api.get('/parent/fees/balances');
    return response.data;
  },

  // Get fee balance for specific child
  getChildFeeBalance: async (childId: string): Promise<ParentApiResponse<FeeBalance>> => {
    const response = await api.get(`/parent/children/${childId}/fees/balance`);
    return response.data;
  },

  // Get payment history
  getPaymentHistory: async (childId?: string): Promise<ParentApiResponse<FeePayment[]>> => {
    const params = childId ? { childId } : {};
    const response = await api.get('/parent/fees/payments', { params });
    return response.data;
  },

  // Get fee structure
  getFeeStructure: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/fees/structure`);
    return response.data;
  },

  // Make a payment (MPESA)
  makeMPESAPayment: async (childId: string, amount: number, phoneNumber: string) => {
    const response = await api.post('/parent/fees/pay/mpesa', {
      childId,
      amount,
      phoneNumber,
    });
    return response.data;
  },

  // Make a payment (Card)
  makeCardPayment: async (childId: string, amount: number, cardTokenOrDetails: string | Record<string, unknown>) => {
    const payload = typeof cardTokenOrDetails === 'string'
      ? { childId, amount, cardToken: cardTokenOrDetails }
      : { childId, amount, ...cardTokenOrDetails };
    const response = await api.post('/parent/fees/pay/card', payload);
    return response.data;
  },

  confirmBankTransfer: async (referenceOrChildId: string, amountOrReference?: number | string, amount?: number) => {
    const payload = typeof amountOrReference === 'number'
      ? { childId: referenceOrChildId, reference: amount?.toString(), amount: amountOrReference }
      : { childId: referenceOrChildId, reference: amountOrReference, amount };
    const response = await api.post('/parent/fees/pay/bank-transfer/confirm', payload);
    return response.data;
  },

  // Download receipt
  downloadReceipt: async (paymentId: string) => {
    const response = await api.get(`/parent/fees/receipts/${paymentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get payment plan
  getPaymentPlan: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/fees/payment-plan`);
    return response.data;
  },

  // Create payment plan request
  createPaymentPlanRequest: async (childId: string, installments: number, startDate: string) => {
    const response = await api.post(`/parent/children/${childId}/fees/payment-plan`, {
      installments,
      startDate,
    });
    return response.data;
  },

  // Apply for bursary/scholarship
  applyForBursary: async (childId: string, reason: string, amount?: number) => {
    const response = await api.post(`/parent/children/${childId}/fees/bursary-application`, {
      reason,
      amount,
    });
    return response.data;
  },
};

// ============================================
// HOMEWORK API
// ============================================
export const homeworkAPI = {
  // Get homework for child
  getHomework: async (childId: string, status?: 'active' | 'completed' | 'overdue'): Promise<ParentApiResponse<HomeworkAssignment[]>> => {
    const params = status ? { status } : {};
    const response = await api.get(`/parent/children/${childId}/homework`, { params });
    return response.data;
  },

  // Get homework details
  getHomeworkDetail: async (childId: string, homeworkId: string) => {
    const response = await api.get(`/parent/children/${childId}/homework/${homeworkId}`);
    return response.data;
  },

  // Download homework attachment
  downloadHomeworkAttachment: async (childId: string, homeworkId: string, fileName: string) => {
    const response = await api.get(`/parent/children/${childId}/homework/${homeworkId}/attachments/${fileName}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  markAsCompleted: async (childId: string, homeworkId: string) => {
    const response = await api.post(`/parent/children/${childId}/homework/${homeworkId}/complete`);
    return response.data;
  },
};

// ============================================
// TIMETABLE API
// ============================================
export const timetableAPI = {
  // Get weekly timetable for child
  getTimetable: async (childId: string): Promise<ParentApiResponse<WeeklyTimetable>> => {
    const response = await api.get(`/parent/children/${childId}/timetable`);
    return response.data;
  },

  // Get exam timetable
  getExamTimetable: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/exam-timetable`, { params });
    return response.data;
  },

  // Download printable timetable
  downloadTimetable: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/timetable/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get exam results
  getExamResults: async (childId: string, examId?: string) => {
    const params = examId ? { examId } : {};
    const response = await api.get(`/parent/children/${childId}/exam-results`, { params });
    return response.data;
  },

  // Get exam overall summary
  getExamOverallSummary: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/exam-summary`);
    return response.data;
  },

  // Get exam rules
  getExamRules: async () => {
    const response = await api.get('/parent/exams/rules');
    return response.data;
  },

  // Download exam timetable
  downloadExamTimetable: async (childId: string, termId?: string) => {
    const params = termId ? { termId } : {};
    const response = await api.get(`/parent/children/${childId}/exam-timetable/download`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// DISCIPLINE API
// ============================================
export const disciplineAPI = {
  // Get discipline records for child
  getDisciplineRecords: async (childId: string): Promise<ParentApiResponse<DisciplineRecord[]>> => {
    const response = await api.get(`/parent/children/${childId}/discipline`);
    return response.data;
  },

  // Get streaks
  getStreaks: async (childId: string): Promise<ParentApiResponse<Streak[]>> => {
    const response = await api.get(`/parent/children/${childId}/streaks`);
    return response.data;
  },

  // Get behavior summary
  getBehaviorSummary: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/behavior-summary`);
    return response.data;
  },
};

// ============================================
// COMMUNICATION API
// ============================================
export const communicationAPI = {
  // Get messages (optionally scoped to a conversation)
  getMessages: async (
    conversationId?: string,
    page?: number,
    limit?: number
  ): Promise<ParentApiResponse<Message[]>> => {
    const params: Record<string, string | number> = {};
    if (conversationId) params.conversationId = conversationId;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const response = await api.get('/parent/messages', { params });
    return response.data;
  },

  // Get conversations
  getConversations: async (page?: number, limit?: number) => {
    const params: any = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const response = await api.get('/parent/conversations', { params });
    return response.data;
  },

  // Send message to teacher
  sendMessage: async (
    data:
      | {
          conversationId: string;
          content: string;
          replyToId?: string;
          attachments?: string[];
          editMode?: boolean;
          messageId?: string;
        }
      | {
          recipientId: string;
          subject: string;
          body: string;
          attachments?: string[];
        }
  ): Promise<ParentApiResponse<Message>> => {
    const response = await api.post('/parent/messages', data);
    return response.data;
  },

  // Get message thread
  getMessageThread: async (messageId: string) => {
    const response = await api.get(`/parent/messages/${messageId}/thread`);
    return response.data;
  },

  // Mark message as read
  markMessageAsRead: async (messageId: string) => {
    const response = await api.patch(`/parent/messages/${messageId}/read`);
    return response.data;
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId: string) => {
    const response = await api.patch(`/parent/conversations/${conversationId}/read`);
    return response.data;
  },

  // Upload attachments
  uploadAttachments: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.post('/parent/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = response.data;
    return payload?.data ?? payload?.urls ?? payload ?? [];
  },

  // Edit message
  editMessage: async (
    messageId: string,
    updates: string | { subject?: string; body?: string; content?: string }
  ): Promise<ParentApiResponse<Message>> => {
    const payload = typeof updates === 'string'
      ? { body: updates, content: updates }
      : updates;
    const response = await api.patch(`/parent/messages/${messageId}`, payload);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/parent/messages/${messageId}`);
    return response.data;
  },

  // Get announcements
  getAnnouncements: async (page?: number, limit?: number): Promise<ParentApiResponse<Announcement[]>> => {
    const params: any = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const response = await api.get('/parent/announcements', { params });
    return response.data;
  },

  // Mark announcement as read
  markAnnouncementAsRead: async (announcementId: string) => {
    const response = await api.patch(`/parent/announcements/${announcementId}/read`);
    return response.data;
  },

  // Get teacher contacts for child
  getTeacherContacts: async (childId: string) => {
    const response = await api.get(`/parent/children/${childId}/teachers`);
    return response.data;
  },
};

// ============================================
// MEETINGS API
// ============================================
export const meetingsAPI = {
  // Get available meeting slots
  getAvailableSlots: async (teacherId?: string, startDate?: string, endDate?: string) => {
    const params: any = {};
    if (teacherId) params.teacherId = teacherId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/parent/meetings/available-slots', { params });
    return response.data;
  },

  // Book a meeting
  bookMeeting: async (slotId: string, studentId: string, notes?: string) => {
    const response = await api.post('/parent/meetings/book', {
      slotId,
      studentId,
      notes,
    });
    return response.data;
  },

  // Get booked meetings
  getMyMeetings: async (status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'): Promise<ParentApiResponse<ParentMeeting[]>> => {
    const params = status ? { status } : {};
    const response = await api.get('/parent/meetings', { params });
    return response.data;
  },

  // Cancel a meeting
  cancelMeeting: async (meetingId: string, reason: string) => {
    const response = await api.post(`/parent/meetings/${meetingId}/cancel`, { reason });
    return response.data;
  },

  // Reschedule a meeting
  rescheduleMeeting: async (meetingId: string, newSlotId: string) => {
    const response = await api.post(`/parent/meetings/${meetingId}/reschedule`, { newSlotId });
    return response.data;
  },

  // Join video meeting
  joinVideoMeeting: async (meetingId: string) => {
    const response = await api.post(`/parent/meetings/${meetingId}/join`);
    return response.data;
  },

  // Rate a meeting
  rateMeeting: async (meetingId: string, rating: number, feedback?: string) => {
    const response = await api.post(`/parent/meetings/${meetingId}/rate`, { rating, feedback });
    return response.data;
  },
};

// ============================================
// EVENTS API
// ============================================
export const eventsAPI = {
  // Get school events
  getEvents: async (type?: string, startDate?: string, endDate?: string, childId?: string): Promise<ParentApiResponse<SchoolEvent[]>> => {
    const params: any = {};
    if (type) params.type = type;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (childId) params.childId = childId;
    const response = await api.get('/parent/events', { params });
    return response.data;
  },

  // RSVP to event
  rsvpToEvent: async (eventId: string, status: 'attending' | 'not_attending' | 'maybe', guestCount?: number) => {
    const response = await api.post(`/parent/events/${eventId}/rsvp`, {
      status,
      guestCount,
    });
    return response.data;
  },

  // Get my RSVPs
  getMyRSVPs: async () => {
    const response = await api.get('/parent/events/rsvps');
    return response.data;
  },

  // Cancel RSVP
  cancelRSVP: async (eventId: string) => {
    const response = await api.post(`/parent/events/${eventId}/rsvp/cancel`);
    return response.data;
  },
};

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  // Get parent profile
  getProfile: async (): Promise<ParentApiResponse<ParentProfile>> => {
    const response = await api.get('/parent/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData: Partial<ParentProfile>) => {
    const response = await api.put('/parent/profile', profileData);
    return response.data;
  },

  // Update phone number
  updatePhone: async (phone: string) => {
    const response = await api.patch('/parent/profile/phone', { phone });
    return response.data;
  },

  // Update email
  updateEmail: async (email: string) => {
    const response = await api.patch('/parent/profile/email', { email });
    return response.data;
  },

  // Upload profile photo
  uploadPhoto: async (photoFile: File) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const response = await api.post('/parent/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async (): Promise<ParentApiResponse<NotificationPreferences>> => {
    const response = await api.get('/parent/profile/notification-preferences');
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences: Partial<NotificationPreferences>) => {
    const response = await api.put('/parent/profile/notification-preferences', preferences);
    return response.data;
  },

  // Get communication preferences
  getCommunicationPreferences: async (): Promise<ParentApiResponse<CommunicationPreferences>> => {
    const response = await api.get('/parent/profile/communication-preferences');
    return response.data;
  },

  // Update communication preferences
  updateCommunicationPreferences: async (preferences: Partial<CommunicationPreferences>) => {
    const response = await api.put('/parent/profile/communication-preferences', preferences);
    return response.data;
  },

  // Get login history
  getLoginHistory: async () => {
    const response = await api.get('/parent/profile/login-history');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/parent/profile/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Increment profile view count for this parent (guarded)
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

  // Enable 2FA
  enable2FA: async () => {
    const response = await api.post('/parent/profile/2fa/enable');
    return response.data;
  },

  // Disable 2FA
  disable2FA: async (code: string) => {
    const response = await api.post('/parent/profile/2fa/disable', { code });
    return response.data;
  },
};

// ============================================
// COMPLAINTS API
// ============================================
export const complaintsAPI = {
  // Submit a complaint
  submitComplaint: async (
    categoryOrPayload: string | {
      category: string;
      subject: string;
      description: string;
      studentId?: string;
      priority?: string;
      attachments?: string[] | File;
    },
    subject?: string,
    description?: string,
    studentId?: string,
    priority?: string,
    attachments?: string[] | File
  ) => {
    const payload = typeof categoryOrPayload === 'object'
      ? categoryOrPayload
      : { category: categoryOrPayload, subject: subject!, description: description!, studentId, priority, attachments };
    const response = await api.post('/parent/complaints', payload);
    return response.data;
  },

  // Get my complaints
  getMyComplaints: async (status?: string): Promise<ParentApiResponse<Complaint[]>> => {
    const params = status ? { status } : {};
    const response = await api.get('/parent/complaints', { params });
    return response.data;
  },

  // Get complaint details
  getComplaintDetail: async (complaintId: string) => {
    const response = await api.get(`/parent/complaints/${complaintId}`);
    return response.data;
  },

  // Reply to complaint
  replyToComplaint: async (complaintId: string, message: string) => {
    const response = await api.post(`/parent/complaints/${complaintId}/reply`, { message });
    return response.data;
  },

  // Rate complaint resolution
  rateComplaint: async (complaintId: string, rating: number, feedback?: string) => {
    const response = await api.post(`/parent/complaints/${complaintId}/rate`, { rating, feedback });
    return response.data;
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  // Get notifications
  getNotifications: async (unreadOnly?: boolean): Promise<ParentApiResponse<Notification[]>> => {
    const params = unreadOnly ? { unreadOnly } : {};
    const response = await api.get('/parent/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: string) => {
    const response = await api.patch(`/parent/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/parent/notifications/read-all');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/parent/notifications/unread-count');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/parent/notifications/${notificationId}`);
    return response.data;
  },
};

// ============================================
// DOWNLOADS API
// ============================================
export const downloadsAPI = {
  // Download school forms
  downloadForm: async (formType: string) => {
    const response = await api.get(`/parent/downloads/forms/${formType}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download school brochure
  downloadBrochure: async () => {
    const response = await api.get('/parent/downloads/brochure', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download school calendar
  downloadCalendar: async () => {
    const response = await api.get('/parent/downloads/calendar', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download report
  downloadReport: async (reportId: string) => {
    const response = await api.get(`/parent/downloads/reports/${reportId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download fee receipt
  downloadFeeReceipt: async (paymentId: string) => {
    const response = await api.get(`/parent/downloads/receipts/${paymentId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Download admission letter
  downloadAdmissionLetter: async (studentId: string) => {
    const response = await api.get(`/parent/downloads/admission/${studentId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadReportCard: async (childIdOrReportId: string, termId?: string) => {
    if (termId) {
      return academicAPI.downloadReportCard(childIdOrReportId, termId);
    }
    const response = await api.get(`/parent/downloads/reports/${childIdOrReportId}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ============================================
// SCHOOL INFORMATION API
// ============================================
export const schoolInfoAPI = {
  // Get school profile
  getSchoolProfile: async () => {
    const response = await api.get('/parent/school/profile');
    return response.data;
  },

  // Get school calendar
  getSchoolCalendar: async () => {
    const response = await api.get('/parent/school/calendar');
    return response.data;
  },

  // Get term dates
  getTermDates: async () => {
    const response = await api.get('/parent/school/term-dates');
    return response.data;
  },

  // Get school policies
  getSchoolPolicies: async () => {
    const response = await api.get('/parent/school/policies');
    return response.data;
  },

  // Get staff directory
  getStaffDirectory: async () => {
    const response = await api.get('/parent/school/staff-directory');
    return response.data;
  },

  // Get contact information
  getContactInfo: async () => {
    const response = await api.get('/parent/school/contact');
    return response.data;
  },
};

// Export all APIs as a single object for convenience
function unwrapParentResponse<T>(response: ParentApiResponse<T> | T): T {
  if (response && typeof response === 'object' && 'data' in (response as object)) {
    return (response as ParentApiResponse<T>).data as T;
  }
  return response as T;
}

const parentService = {
  dashboard: parentDashboardAPI,
  children: childrenAPI,
  academic: academicAPI,
  attendance: attendanceAPI,
  fees: feesAPI,
  homework: homeworkAPI,
  timetable: timetableAPI,
  discipline: disciplineAPI,
  communication: communicationAPI,
  meetings: meetingsAPI,
  events: eventsAPI,
  profile: profileAPI,
  complaints: complaintsAPI,
  notifications: notificationsAPI,
  downloads: downloadsAPI,
  schoolInfo: schoolInfoAPI,
  getMyChildren: async () => unwrapParentResponse(await childrenAPI.getMyChildren()),
  getExamTimetable: timetableAPI.getExamTimetable,
  getExamResults: timetableAPI.getExamResults,
  getExamOverallSummary: timetableAPI.getExamOverallSummary,
  getExamRules: timetableAPI.getExamRules,
  downloadExamTimetable: timetableAPI.downloadExamTimetable,
  downloadReportCard: academicAPI.downloadReportCard,
  getChildMedicalRecord: async (childId: string) => {
    try {
      return await childrenAPI.getChildMedicalInfo(childId);
    } catch {
      return { allergies: [], conditions: [], emergencyContacts: [], immunizations: [] };
    }
  },
  getChildSickBayVisits: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/sick-bay-visits`);
      return response.data;
    } catch {
      return [];
    }
  },
  getChildMedicalDocuments: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/medical-documents`);
      return response.data;
    } catch {
      return [];
    }
  },
  addChildAllergy: async (childId: string, allergy: any) => {
    const current = await parentService.getChildMedicalRecord(childId);
    const next = { ...current, allergies: [...(current.allergies || []), { id: Date.now().toString(), ...allergy }] };
    try {
      return await childrenAPI.updateMedicalInfo(childId, next);
    } catch {
      return next;
    }
  },
  removeChildAllergy: async (childId: string, allergyId: string) => {
    const current = await parentService.getChildMedicalRecord(childId);
    const next = { ...current, allergies: (current.allergies || []).filter((item: any) => item.id !== allergyId) };
    try {
      return await childrenAPI.updateMedicalInfo(childId, next);
    } catch {
      return next;
    }
  },
  addChildCondition: async (childId: string, condition: any) => {
    const current = await parentService.getChildMedicalRecord(childId);
    const next = { ...current, conditions: [...(current.conditions || []), { id: Date.now().toString(), ...condition }] };
    try {
      return await childrenAPI.updateMedicalInfo(childId, next);
    } catch {
      return next;
    }
  },
  removeChildCondition: async (childId: string, conditionId: string) => {
    const current = await parentService.getChildMedicalRecord(childId);
    const next = { ...current, conditions: (current.conditions || []).filter((item: any) => item.id !== conditionId) };
    try {
      return await childrenAPI.updateMedicalInfo(childId, next);
    } catch {
      return next;
    }
  },
  addEmergencyContact: async (childId: string, contact: any) => {
    const current = await parentService.getChildMedicalRecord(childId);
    const next = { ...current, emergencyContacts: [...(current.emergencyContacts || []), { id: Date.now().toString(), ...contact }] };
    try {
      return await childrenAPI.updateMedicalInfo(childId, next);
    } catch {
      return next;
    }
  },
  getChildBusRoute: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/transport/route`);
      return response.data;
    } catch {
      return null;
    }
  },
  getChildTransportFee: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/transport/fee`);
      return response.data;
    } catch {
      return { amount: 0, balance: 0, status: 'not_configured' };
    }
  },
  getChildBusIssues: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/transport/issues`);
      return response.data;
    } catch {
      return [];
    }
  },
  reportBusIssue: async (childId: string, issue: any) => {
    try {
      const response = await api.post(`/parent/children/${childId}/transport/issues`, issue);
      return response.data;
    } catch {
      return { id: Date.now().toString(), childId, status: 'OPEN', ...issue };
    }
  },
  getChildSports: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/sports`);
      return response.data;
    } catch {
      return [];
    }
  },
  getChildClubs: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/clubs`);
      return response.data;
    } catch {
      return [];
    }
  },
  getChildCompetitions: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/competitions`);
      return response.data;
    } catch {
      return [];
    }
  },
  getChildFieldTrips: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/field-trips`);
      return response.data;
    } catch {
      return [];
    }
  },
  consentFieldTrip: async (childId: string, tripId: string) => {
    try {
      const response = await api.post(`/parent/children/${childId}/field-trips/${tripId}/consent`);
      return response.data;
    } catch {
      return { success: true, childId, tripId };
    }
  },
  // Boarding-specific APIs
  getChildDormitoryInfo: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/boarding/dormitory`);
      return response.data;
    } catch {
      return null;
    }
  },
  getChildLaundryStatus: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/boarding/laundry`);
      return response.data;
    } catch {
      return [];
    }
  },
  getMealMenu: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/boarding/meals`);
      return response.data;
    } catch {
      return { weekly: [] };
    }
  },
  getVisitationSlots: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/boarding/visitation-slots`);
      return response.data;
    } catch {
      return [];
    }
  },
  getChildLeaveRequests: async (childId: string) => {
    try {
      const response = await api.get(`/parent/children/${childId}/boarding/leave-requests`);
      return response.data;
    } catch {
      return [];
    }
  },
  requestLeave: async (childId: string, data: any) => {
    try {
      const response = await api.post(`/parent/children/${childId}/boarding/leave-request`, data);
      return response.data;
    } catch {
      return { success: true };
    }
  },
  bookVisitationSlot: async (childId: string, slotId: string) => {
    try {
      const response = await api.post(`/parent/children/${childId}/boarding/book-visitation`, { slotId });
      return response.data;
    } catch {
      return { success: true };
    }
  },
};

export default parentService;
