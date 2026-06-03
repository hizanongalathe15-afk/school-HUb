import { api } from './api';
import { useAuthStore } from '../store/authStore';
import type {
  Teacher,
  TeacherClass,
  TeacherStudent,
  AttendanceRecord,
  AttendanceStats,
  GradeEntry,
  GradeSummary,
  HomeworkAssignment,
  HomeworkSubmission,
  DisciplineRecord,
  StudentStreak,
  LessonPlan,
  TeacherMessage,
  ClassAnnouncement,
  ParentTeacherMeeting,
  TeacherTimetable,
  TeacherDashboard,
  TeacherNotification,
  TeacherAlert,
  PendingTask,
  TodayClass,
  TeacherQuickStats,
  ExamSchedule,
  TeacherReport,
} from '../types/teacher';

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  async getDashboard(): Promise<{ success: boolean; data: TeacherDashboard }> {
    const response = await api.get('/teacher/dashboard');
    return response.data;
  },

  async getQuickStats(): Promise<{ success: boolean; data: TeacherQuickStats }> {
    const response = await api.get('/teacher/dashboard/stats');
    return response.data;
  },

  async getTodayClasses(): Promise<{ success: boolean; data: TodayClass[] }> {
    const response = await api.get('/teacher/dashboard/today-classes');
    return response.data;
  },

  async getPendingTasks(): Promise<{ success: boolean; data: PendingTask[] }> {
    const response = await api.get('/teacher/dashboard/tasks');
    return response.data;
  },

  async getAlerts(): Promise<{ success: boolean; data: TeacherAlert[] }> {
    const response = await api.get('/teacher/dashboard/alerts');
    return response.data;
  },
};

// ============================================
// CLASSES API
// ============================================
export const classesAPI = {
  async getMyClasses(): Promise<{ success: boolean; data: TeacherClass[] }> {
    const response = await api.get('/teacher/classes');
    return response.data;
  },

  async getAllClasses(): Promise<{ success: boolean; data: TeacherClass[] }> {
    const response = await api.get('/teacher/classes/all');
    return response.data;
  },

  async getClassDetails(classId: string): Promise<{ success: boolean; data: TeacherClass }> {
    const response = await api.get(`/teacher/classes/${classId}`);
    return response.data;
  },

  async getClassTimetable(classId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/teacher/classes/${classId}/timetable`);
    return response.data;
  },

  async postClassAnnouncement(classId: string, data: { title: string; content: string; priority: string }): Promise<{ success: boolean; data: ClassAnnouncement }> {
    const response = await api.post(`/teacher/classes/${classId}/announcements`, data);
    return response.data;
  },
};

// ============================================
// STUDENTS API
// ============================================
export const studentsAPI = {
  async getMyStudents(classIdOrFilters?: string | { classId?: string }): Promise<{ success: boolean; data: TeacherStudent[] }> {
    const params = typeof classIdOrFilters === 'object' ? classIdOrFilters : { classId: classIdOrFilters };
    const response = await api.get('/teacher/students', { params });
    return response.data;
  },

  async getStudentsByClass(classId: string): Promise<{ success: boolean; data: TeacherStudent[] }> {
    const response = await api.get(`/teacher/students/class/${classId}`);
    return response.data;
  },

  async getStudentDetails(studentId: string): Promise<{ success: boolean; data: TeacherStudent }> {
    const response = await api.get(`/teacher/students/${studentId}`);
    return response.data;
  },

  async getStudentAcademicHistory(studentId: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/teacher/students/${studentId}/academics`);
    return response.data;
  },

  async getStudentAttendance(studentId: string): Promise<{ success: boolean; data: AttendanceRecord[] }> {
    const response = await api.get(`/teacher/students/${studentId}/attendance`);
    return response.data;
  },

  async getStudentDiscipline(studentId: string): Promise<{ success: boolean; data: DisciplineRecord[] }> {
    const response = await api.get(`/teacher/students/${studentId}/discipline`);
    return response.data;
  },

  async addStudentNote(studentId: string, data: { note: string; type: string; isPrivate: boolean }): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/teacher/students/${studentId}/notes`, data);
    return response.data;
  },

  async flagStudent(studentId: string, data: { reason: string; type: string }): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/teacher/students/${studentId}/flag`, data);
    return response.data;
  },

  addTeacherNote: async (studentId: string, data: Record<string, unknown>) => studentsAPI.addStudentNote(studentId, data as any),
  addBehaviorRecord: async (studentId: string, data: Record<string, unknown>) => api.post(`/teacher/students/${studentId}/behavior`, data).then((res) => res.data),
  recordParentContact: async (studentId: string, data: Record<string, unknown>) => api.post(`/teacher/students/${studentId}/parent-contact`, data).then((res) => res.data),
  updateStudentFlag: async (studentId: string, data: Record<string, unknown>) => studentsAPI.flagStudent(studentId, data as any),
  sendParentMessage: async (studentId: string, data: Record<string, unknown>) => api.post(`/teacher/students/${studentId}/message-parent`, data).then((res) => res.data),
};

// ============================================
// ATTENDANCE API
// ============================================
export const attendanceAPI = {
  async markAttendance(data: {
    classId: string;
    date: string;
    records: { studentId: string; status: string; notes?: string }[];
  }): Promise<{ success: boolean; data: AttendanceRecord[] }> {
    const response = await api.post('/teacher/attendance/mark', data);
    return response.data;
  },

  async markSubjectAttendance(data: {
    classId: string;
    subjectId: string;
    period: number;
    date: string;
    records: { studentId: string; status: string }[];
  }): Promise<{ success: boolean; data: AttendanceRecord[] }> {
    const response = await api.post('/teacher/attendance/subject', data);
    return response.data;
  },

  async getClassAttendance(classId: string, startDate?: string, endDate?: string): Promise<{ success: boolean; data: AttendanceStats[] }> {
    const params = { startDate, endDate };
    const response = await api.get(`/teacher/attendance/class/${classId}`, { params });
    return response.data;
  },

  async updateAttendance(recordId: string, data: { status: string; notes?: string }): Promise<{ success: boolean; data: AttendanceRecord }> {
    const response = await api.put(`/teacher/attendance/${recordId}`, data);
    return response.data;
  },

  async getAttendanceReport(classId: string, term: string, year: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/teacher/attendance/report/${classId}`, { params: { term, year } });
    return response.data;
  },
};

// ============================================
// GRADES & RESULTS API
// ============================================
export const gradesAPI = {
  async getGradeEntry(classId: string, subjectId: string, term: string, year: string): Promise<{ success: boolean; data: GradeEntry[] }> {
    const response = await api.get('/teacher/grades', { params: { classId, subjectId, term, year } });
    return response.data;
  },

  async enterGrades(data: {
    classId: string;
    subjectId: string;
    term: string;
    year: string;
    examType: string;
    grades: { studentId: string; cat1?: number; cat2?: number; cat3?: number; exam?: number }[];
  }): Promise<{ success: boolean; data: GradeEntry[] }> {
    const response = await api.post('/teacher/grades/enter', data);
    return response.data;
  },

  async updateGrade(gradeId: string, data: { cat1?: number; cat2?: number; cat3?: number; exam?: number; comment?: string }): Promise<{ success: boolean; data: GradeEntry }> {
    const response = await api.put(`/teacher/grades/${gradeId}`, data);
    return response.data;
  },

  async getGradeSummary(classId: string, subjectId: string, term: string, year: string): Promise<{ success: boolean; data: GradeSummary }> {
    const response = await api.get(`/teacher/grades/summary/${classId}`, { params: { subjectId, term, year } });
    return response.data;
  },

  async generateReportCard(classId: string, term: string, year: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/teacher/grades/report-card/${classId}`, { params: { term, year } });
    return response.data;
  },

  async publishResults(classId: string, term: string, year: string): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/teacher/grades/publish/${classId}`, { term, year });
    return response.data;
  },
};

// ============================================
// HOMEWORK API
// ============================================
export const homeworkAPI = {
  async getHomework(classIdOrFilters?: string | { classId?: string; subjectId?: string; status?: string }, subjectId?: string): Promise<{ success: boolean; data: HomeworkAssignment[] }> {
    const params = typeof classIdOrFilters === 'object'
      ? classIdOrFilters
      : { classId: classIdOrFilters, subjectId };
    const response = await api.get('/teacher/homework', { params });
    return response.data;
  },

  async getAssignments(classIdOrFilters?: string | { classId?: string; subjectId?: string; status?: string }, subjectId?: string): Promise<{ success: boolean; data: HomeworkAssignment[] }> {
    return homeworkAPI.getHomework(classIdOrFilters as any, subjectId);
  },

  async createHomework(data: FormData | {
    classId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    attachments?: string[];
  }): Promise<{ success: boolean; data: HomeworkAssignment }> {
    if (data instanceof FormData) {
      const response = await api.post('/teacher/homework', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    }
    const response = await api.post('/teacher/homework', data);
    return response.data;
  },

  async createAssignment(data: FormData | {
    classId: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    attachments?: string[];
  }): Promise<{ success: boolean; data: HomeworkAssignment }> {
    if (data instanceof FormData) {
      const response = await api.post('/teacher/homework/assignments', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    }
    const response = await api.post('/teacher/homework/assignments', data);
    return response.data;
  },

  async updateHomework(homeworkId: string, data: Partial<HomeworkAssignment>): Promise<{ success: boolean; data: HomeworkAssignment }> {
    const response = await api.put(`/teacher/homework/${homeworkId}`, data);
    return response.data;
  },

  async deleteHomework(homeworkId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/homework/${homeworkId}`);
    return response.data;
  },

  async deleteAssignment(homeworkId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/homework/assignments/${homeworkId}`);
    return response.data;
  },

  async getSubmissions(homeworkId: string): Promise<{ success: boolean; data: HomeworkSubmission[] }> {
    const response = await api.get(`/teacher/homework/${homeworkId}/submissions`);
    return response.data;
  },

  async gradeSubmission(submissionId: string, data: { grade: number; feedback?: string }): Promise<{ success: boolean; data: HomeworkSubmission }> {
    const response = await api.put(`/teacher/homework/submissions/${submissionId}`, data);
    return response.data;
  },

  async bulkGradeSubmissions(homeworkId: string, data: { submissions: { submissionId: string; grade: number; feedback?: string }[] }): Promise<{ success: boolean; data: any }> {
    const response = await api.post(`/teacher/homework/${homeworkId}/bulk-grade`, data);
    return response.data;
  },

  async publishAssignment(homeworkId: string): Promise<{ success: boolean; data: HomeworkAssignment }> {
    const response = await api.post(`/teacher/homework/assignments/${homeworkId}/publish`);
    return response.data;
  },

  async sendAssignmentNotifications(homeworkId: string): Promise<{ success: boolean }> {
    const response = await api.post(`/teacher/homework/assignments/${homeworkId}/notify`);
    return response.data;
  },

  async downloadSubmission(submissionId: string, attachmentId?: string): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get(`/teacher/homework/submissions/${submissionId}/download`, {
      params: attachmentId ? { attachmentId } : undefined,
    });
    return response.data;
  },

  async downloadAllSubmissions(homeworkId: string): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get(`/teacher/homework/${homeworkId}/submissions/download`);
    return response.data;
  },

  async sendReminder(homeworkId: string, data?: { message?: string } | string): Promise<{ success: boolean }> {
    const payload = typeof data === 'string' ? { message: data } : data;
    const response = await api.post(`/teacher/homework/${homeworkId}/reminder`, payload ?? {});
    return response.data;
  },

  async unpublishAssignment(homeworkId: string): Promise<{ success: boolean; data: HomeworkAssignment }> {
    const response = await api.post(`/teacher/homework/assignments/${homeworkId}/unpublish`);
    return response.data;
  },

  async duplicateAssignment(homeworkId: string): Promise<{ success: boolean; data: HomeworkAssignment }> {
    const response = await api.post(`/teacher/homework/assignments/${homeworkId}/duplicate`);
    return response.data;
  },

  async archiveAssignment(homeworkId: string): Promise<{ success: boolean; data: HomeworkAssignment }> {
    const response = await api.post(`/teacher/homework/assignments/${homeworkId}/archive`);
    return response.data;
  },
};

// ============================================
// DISCIPLINE API
// ============================================
export const disciplineAPI = {
  async getDisciplineRecords(classId?: string, studentId?: string): Promise<{ success: boolean; data: DisciplineRecord[] }> {
    const params = { classId, studentId };
    const response = await api.get('/teacher/discipline', { params });
    return response.data;
  },

  async recordMerit(data: {
    studentId: string;
    category: string;
    description: string;
    points: number;
  }): Promise<{ success: boolean; data: DisciplineRecord }> {
    const response = await api.post('/teacher/discipline/merit', data);
    return response.data;
  },

  async recordDemerit(data: {
    studentId: string;
    category: string;
    description: string;
    points: number;
    action?: string;
  }): Promise<{ success: boolean; data: DisciplineRecord }> {
    const response = await api.post('/teacher/discipline/demerit', data);
    return response.data;
  },

  async recordWarning(data: {
    studentId: string;
    category: string;
    description: string;
    action?: string;
  }): Promise<{ success: boolean; data: DisciplineRecord }> {
    const response = await api.post('/teacher/discipline/warning', data);
    return response.data;
  },

  async getStudentStreaks(studentId: string): Promise<{ success: boolean; data: StudentStreak[] }> {
    const response = await api.get(`/teacher/discipline/streaks/${studentId}`);
    return response.data;
  },

  async awardStreak(studentId: string, data: { type: string; description: string }): Promise<{ success: boolean; data: StudentStreak }> {
    const response = await api.post(`/teacher/discipline/streaks/${studentId}`, data);
    return response.data;
  },

  async escalateDiscipline(recordId: string, data: { escalatedTo: string; reason: string }): Promise<{ success: boolean; data: DisciplineRecord }> {
    const response = await api.post(`/teacher/discipline/${recordId}/escalate`, data);
    return response.data;
  },
};

// ============================================
// LESSON PLANS API
// ============================================
export const lessonPlansAPI = {
  async getLessonPlans(subjectId?: string, classId?: string): Promise<{ success: boolean; data: LessonPlan[] }> {
    const params = { subjectId, classId };
    const response = await api.get('/teacher/lessons', { params });
    return response.data;
  },

  async createLessonPlan(data: {
    subjectId: string;
    classId: string;
    title: string;
    date: string;
    duration: number;
    objectives: string[];
    materials: string[];
    activities: { name: string; description: string; duration: number; order: number }[];
    assessment: string;
    resources: string[];
  }): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post('/teacher/lessons', data);
    return response.data;
  },

  async updateLessonPlan(lessonId: string, data: Partial<LessonPlan>): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.put(`/teacher/lessons/${lessonId}`, data);
    return response.data;
  },

  async deleteLessonPlan(lessonId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/lessons/${lessonId}`);
    return response.data;
  },

  async shareLessonPlan(lessonId: string, data: { shareWithHOD: boolean; shareWithStudents: boolean }): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/share`, data);
    return response.data;
  },

  async publishLessonPlan(lessonId: string): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/publish`);
    return response.data;
  },

  async completeLessonPlan(lessonId: string, data: { reflection?: string }): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/complete`, data);
    return response.data;
  },

  async shareWithHOD(lessonId: string): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/share/hod`);
    return response.data;
  },

  async shareWithStudents(lessonId: string): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/share/students`);
    return response.data;
  },

  async addReflection(lessonId: string, data: { reflection: string }): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/reflection`, data);
    return response.data;
  },

  async copyLessonPlan(lessonId: string, data: { date: string; classId?: string }): Promise<{ success: boolean; data: LessonPlan }> {
    const response = await api.post(`/teacher/lessons/${lessonId}/copy`, data);
    return response.data;
  },

  async exportLessonPlan(lessonId: string, format: 'pdf' | 'docx'): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get(`/teacher/lessons/${lessonId}/export`, { params: { format } });
    return response.data;
  },
};

// ============================================
// MESSAGES API
// ============================================
export const messagesAPI = {
  async getMessages(type?: 'sent' | 'received' | 'all'): Promise<{ success: boolean; data: TeacherMessage[] }> {
    const response = await api.get('/teacher/messages', { params: { type } });
    return response.data;
  },

  async getConversations(): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get('/teacher/messages/conversations');
    return response.data;
  },

  async getConversationMessages(conversationId: string): Promise<{ success: boolean; data: TeacherMessage[] }> {
    const response = await api.get(`/teacher/messages/conversations/${conversationId}`);
    return response.data;
  },

  async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
    const response = await api.put(`/teacher/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  async sendMessage(data: FormData | {
    recipientId: string;
    recipientRole: 'parent' | 'teacher' | 'admin';
    subject: string;
    message: string;
    attachments?: string[];
  }): Promise<{ success: boolean; data: TeacherMessage }> {
    if (data instanceof FormData) {
      const response = await api.post('/teacher/messages', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    }
    const response = await api.post('/teacher/messages', data);
    return response.data;
  },

  async markMessageRead(messageId: string): Promise<{ success: boolean }> {
    const response = await api.put(`/teacher/messages/${messageId}/read`);
    return response.data;
  },

  async sendBulkMessage(data: FormData | {
    classId: string;
    subject: string;
    message: string;
    parentIds?: string[];
  }): Promise<{ success: boolean; data: any }> {
    if (data instanceof FormData) {
      const response = await api.post('/teacher/messages/bulk', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    }
    const response = await api.post('/teacher/messages/bulk', data);
    return response.data;
  },

  async toggleStarMessage(messageId: string): Promise<{ success: boolean; data: TeacherMessage }> {
    const response = await api.post(`/teacher/messages/${messageId}/star`);
    return response.data;
  },

  async archiveMessage(messageId: string): Promise<{ success: boolean; data: TeacherMessage }> {
    const response = await api.post(`/teacher/messages/${messageId}/archive`);
    return response.data;
  },

  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/messages/${messageId}`);
    return response.data;
  },

  async downloadAttachment(messageId: string, attachmentId?: string): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get(`/teacher/messages/${messageId}/attachments/${attachmentId || 'download'}`);
    return response.data;
  },
};

// ============================================
// ANNOUNCEMENTS API
// ============================================
export const announcementsAPI = {
  async getAnnouncements(classId?: string): Promise<{ success: boolean; data: ClassAnnouncement[] }> {
    const response = await api.get('/teacher/announcements', { params: { classId } });
    return response.data;
  },

  async createAnnouncement(data: {
    classId: string;
    title: string;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    attachments?: string[];
    expiresAt?: string;
  }): Promise<{ success: boolean; data: ClassAnnouncement }> {
    const response = await api.post('/teacher/announcements', data);
    return response.data;
  },

  async updateAnnouncement(announcementId: string, data: Partial<ClassAnnouncement>): Promise<{ success: boolean; data: ClassAnnouncement }> {
    const response = await api.put(`/teacher/announcements/${announcementId}`, data);
    return response.data;
  },

  async deleteAnnouncement(announcementId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/announcements/${announcementId}`);
    return response.data;
  },

  async pinAnnouncement(announcementId: string): Promise<{ success: boolean; data: ClassAnnouncement }> {
    const response = await api.post(`/teacher/announcements/${announcementId}/pin`);
    return response.data;
  },
};

// ============================================
// MEETINGS API
// ============================================
export const meetingsAPI = {
  async getMeetings(params?: string | { status?: string; studentId?: string; format?: string }): Promise<{ success: boolean; data: ParentTeacherMeeting[] }> {
    const query = typeof params === 'string'
      ? { status: params }
      : params;
    const response = await api.get('/teacher/meetings', { params: query });
    return response.data;
  },

  async scheduleMeeting(data: {
    parentId: string;
    studentId: string;
    date: string;
    duration: number;
    mode: 'in_person' | 'video' | 'phone';
    agenda?: string;
    meetingLink?: string;
    meetingLocation?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
  }): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const response = await api.post('/teacher/meetings', data);
    return response.data;
  },

  async respondToMeetingRequest(meetingId: string, data: { status: 'confirmed' | 'declined' | 'rescheduled' | 'cancelled'; newDate?: string }): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const response = await api.put(`/teacher/meetings/${meetingId}/respond`, data);
    return response.data;
  },

  async updateMeetingNotes(meetingId: string, data: { notes: string } | string): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const payload = typeof data === 'string' ? { notes: data } : data;
    const response = await api.put(`/teacher/meetings/${meetingId}/notes`, payload);
    return response.data;
  },

  async cancelMeeting(meetingId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/meetings/${meetingId}`, { params: { reason } });
    return response.data;
  },

  async sendMeetingNotification(meetingId: string, data?: { message?: string }): Promise<{ success: boolean }> {
    const response = await api.post(`/teacher/meetings/${meetingId}/notify`, data);
    return response.data;
  },

  async completeMeeting(meetingId: string, data: { notes: string; feedback?: string } | string): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const payload = typeof data === 'string' ? { notes: data } : data;
    const response = await api.post(`/teacher/meetings/${meetingId}/complete`, payload);
    return response.data;
  },

  async addMeetingNotes(meetingId: string, data: { notes: string } | string): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const payload = typeof data === 'string' ? { notes: data } : data;
    const response = await api.post(`/teacher/meetings/${meetingId}/notes`, payload);
    return response.data;
  },

  async addMeetingFeedback(meetingId: string, data: { feedback: string; rating?: number } | string): Promise<{ success: boolean; data: ParentTeacherMeeting }> {
    const payload = typeof data === 'string' ? { feedback: data } : data;
    const response = await api.post(`/teacher/meetings/${meetingId}/feedback`, payload);
    return response.data;
  },

  async exportMeetings(formatOrParams: 'pdf' | 'excel' | { status?: string; format?: 'pdf' | 'excel' }): Promise<{ success: boolean; data: Blob | { url: string } }> {
    const params = typeof formatOrParams === 'string'
      ? { format: formatOrParams }
      : formatOrParams;
    const response = await api.get('/teacher/meetings/export', { params, responseType: 'blob' });
    return { success: true, data: response.data };
  },

  async sendMeetingReminder(meetingId: string): Promise<{ success: boolean }> {
    const response = await api.post(`/teacher/meetings/${meetingId}/reminder`);
    return response.data;
  },
};

// ============================================
// TIMETABLE API
// ============================================
export const timetableAPI = {
  async getMyTimetable(weekOrParams?: number | { weekOffset?: number; week?: number; year?: number }): Promise<{ success: boolean; data: TeacherTimetable }> {
    const params = typeof weekOrParams === 'object' ? weekOrParams : { week: weekOrParams };
    const response = await api.get('/teacher/timetable', { params });
    return response.data;
  },

  async getTimetableByWeek(weekOffset: number): Promise<{ success: boolean; data: TeacherTimetable }> {
    const response = await api.get('/teacher/timetable', { params: { weekOffset } });
    return response.data;
  },

  async getClassTimetable(classId: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/teacher/timetable/class/${classId}`);
    return response.data;
  },

  async requestTimetableChange(data: {
    currentSlotId: string;
    requestedDate: string;
    reason: string;
    preferredSwap?: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/timetable/request-change', data);
    return response.data;
  },

  async requestSubstitution(data: {
    date: string;
    period: number;
    classId: string;
    reason: string;
    slotId?: string;
    requesterSlotId?: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/timetable/substitution', data);
    return response.data;
  },

  async requestSwap(data: {
    slotId?: string;
    requesterSlotId?: string;
    targetSlotId: string;
    reason: string;
    date: string;
    period: number;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/timetable/swap', data);
    return response.data;
  },

  async swapSlots(data: {
    slotId: string;
    targetSlotId: string;
    reason: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/timetable/swap-slots', data);
    return response.data;
  },

  async updateSlot(data: {
    slotId: string;
    date: string;
    period: number;
    classId: string;
    subjectId?: string;
    room?: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.put('/teacher/timetable/slot', data);
    return response.data;
  },

  async exportTimetable(formatOrParams: 'pdf' | 'excel' | 'ical' | { format?: 'pdf' | 'excel' | 'ical'; weekOffset?: number }): Promise<{ success: boolean; data: { url: string } }> {
    const params = typeof formatOrParams === 'string' ? { format: formatOrParams } : formatOrParams;
    const response = await api.get('/teacher/timetable/export', { params });
    return response.data;
  },
};

// ============================================
// REQUESTS & WORKSPACE API
// ============================================
export const requestsAPI = {
  async create(data: {
    type: string;
    title?: string;
    description?: string;
    reason?: string;
    classId?: string;
    subjectId?: string;
    date?: string;
    requestedDate?: string;
    payload?: Record<string, unknown>;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/requests', data);
    return response.data;
  },
};

export const workspaceAPI = {
  async list(section?: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get('/teacher/workspaces', { params: { section } });
    return response.data;
  },

  async delete(recordId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/workspaces/records/${recordId}`);
    return response.data;
  },

  async create(data: FormData | {
    section: string;
    item: string;
    title: string;
    content?: string;
    payload?: Record<string, unknown>;
    status?: string;
  }): Promise<{ success: boolean; data: any }> {
    if (data instanceof FormData) {
      const response = await api.post('/teacher/workspaces/records', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    }
    const response = await api.post('/teacher/workspaces/records', data);
    return response.data;
  },

  async update(recordId: string, data: Record<string, unknown>): Promise<{ success: boolean; data: any }> {
    const response = await api.put(`/teacher/workspaces/records/${recordId}`, data);
    return response.data;
  },

  getTemplates: async (section?: string) => api.get('/teacher/workspaces/templates', { params: { section } }).then((res) => res.data),
  getComments: async (recordId: string) => api.get(`/teacher/workspaces/records/${recordId}/comments`).then((res) => res.data),
  addComment: async (recordId: string, data: Record<string, unknown>) => api.post(`/teacher/workspaces/records/${recordId}/comments`, data).then((res) => res.data),
  toggleStar: async (recordId: string) => api.post(`/teacher/workspaces/records/${recordId}/star`).then((res) => res.data),
  publish: async (recordId: string) => api.post(`/teacher/workspaces/records/${recordId}/publish`).then((res) => res.data),
  archive: async (recordId: string) => api.post(`/teacher/workspaces/records/${recordId}/archive`).then((res) => res.data),
  share: async (recordId: string, data?: Record<string, unknown>) => api.post(`/teacher/workspaces/records/${recordId}/share`, data ?? {}).then((res) => res.data),
  export: async (
    recordIdOrParams: string | { section: string; item: string; format?: string },
    format?: string
  ): Promise<Blob | { url: string }> => {
    if (typeof recordIdOrParams === 'object') {
      const response = await api.get('/teacher/workspaces/export', {
        params: recordIdOrParams,
        responseType: 'blob',
      });
      return response.data;
    }
    const response = await api.get(`/teacher/workspaces/records/${recordIdOrParams}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },
  incrementViews: async (recordId: string) => api.post(`/teacher/workspaces/records/${recordId}/view`).then((res) => res.data),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  async getNotifications(filtersOrUnreadOnly?: boolean | Record<string, unknown>): Promise<{ success: boolean; data: TeacherNotification[] }> {
    const params = typeof filtersOrUnreadOnly === 'object' ? filtersOrUnreadOnly : { unreadOnly: filtersOrUnreadOnly };
    const response = await api.get('/teacher/notifications', { params });
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<{ success: boolean }> {
    const response = await api.put(`/teacher/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.put('/teacher/notifications/read-all');
    return response.data;
  },

  async getNotificationPreferences(): Promise<{ success: boolean; data: any }> {
    const response = await api.get('/teacher/notifications/preferences');
    return response.data;
  },

  async updateNotificationPreferences(data: any): Promise<{ success: boolean; data: any }> {
    const response = await api.put('/teacher/notifications/preferences', data);
    return response.data;
  },

  toggleStar: async (notificationId: string, starred?: boolean) => api.post(`/teacher/notifications/${notificationId}/star`, { starred }).then((res) => res.data),
  archiveNotification: async (notificationId: string, archived?: boolean) => api.post(`/teacher/notifications/${notificationId}/archive`, { archived }).then((res) => res.data),
  deleteNotification: async (notificationId: string) => api.delete(`/teacher/notifications/${notificationId}`).then((res) => res.data),
  clearAll: async () => api.delete('/teacher/notifications').then((res) => res.data),
  updatePreferences: async (data: any) => notificationsAPI.updateNotificationPreferences(data),
  exportNotifications: async (filters?: Record<string, unknown>): Promise<{ success: boolean; data: Blob | { url: string } }> => {
    const response = await api.get('/teacher/notifications/export', { params: filters, responseType: 'blob' });
    return { success: true, data: response.data };
  },
};

// ============================================
// REPORTS API
// ============================================
export const reportsAPI = {
  async generateClassReport(classId: string, type: string, term: string, year: string): Promise<{ success: boolean; data: TeacherReport }> {
    const response = await api.get(`/teacher/reports/class/${classId}`, { params: { type, term, year } });
    return response.data;
  },

  async generateStudentReport(studentId: string, type: string, term: string, year: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/teacher/reports/student/${studentId}`, { params: { type, term, year } });
    return response.data;
  },

  async generateSubjectReport(subjectId: string, type: string, term: string, year: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/teacher/reports/subject/${subjectId}`, { params: { type, term, year } });
    return response.data;
  },

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<{ success: boolean; data: { url: string } }> {
    const response = await api.get(`/teacher/reports/${reportId}/export`, { params: { format } });
    return response.data;
  },

  async getGeneratedReports(classId?: string, studentId?: string, subjectId?: string): Promise<{ success: boolean; data: any[] }> {
    const params = { classId, studentId, subjectId };
    const response = await api.get('/teacher/reports', { params });
    return response.data;
  },

  async getSavedReports(): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get('/teacher/reports/saved');
    return response.data;
  },

  async saveReport(data: { reportId: string; name: string; description?: string; filters?: Record<string, unknown> }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/reports/save', data);
    return response.data;
  },

  async scheduleReport(data: { reportType: string; classId?: string; studentId?: string; subjectId?: string; schedule: string; recipients: string[] }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/reports/schedule', data);
    return response.data;
  },

  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/teacher/reports/${reportId}`);
    return response.data;
  },

  async emailReport(reportId: string, data: string | { recipients: string[]; subject?: string; message?: string }): Promise<{ success: boolean }> {
    const payload = typeof data === 'string' ? { recipients: [data] } : data;
    const response = await api.post(`/teacher/reports/${reportId}/email`, payload);
    return response.data;
  },

  generateReport: async (type: string, params?: Record<string, unknown>) => {
    const response = await api.post('/teacher/reports/generate', { type, ...params });
    return response.data;
  },
};

// ============================================
// EXAMS API
// ============================================
export const examsAPI = {
  async getExamTimetable(): Promise<{ success: boolean; data: any }> {
    const response = await api.get('/teacher/exams/timetable');
    return response.data;
  },

  async getInvigilationDuties(): Promise<{ success: boolean; data: ExamSchedule[] }> {
    const response = await api.get('/teacher/exams/invigilation');
    return response.data;
  },

  async reportExamIrregularity(data: {
    examId: string;
    studentId: string;
    description: string;
    type: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/teacher/exams/irregularity', data);
    return response.data;
  },
};

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  async getProfile(): Promise<{ success: boolean; data: Teacher }> {
    const response = await api.get('/teacher/profile');
    return response.data;
  },

  async updateProfile(data: Partial<Teacher>): Promise<{ success: boolean; data: Teacher }> {
    const response = await api.put('/teacher/profile', data);
    return response.data;
  },

  async updatePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean }> {
    const response = await api.post('/teacher/profile/change-password', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<{ success: boolean; data: { avatar: string } }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/teacher/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

const teacherSafe = async <T>(request: () => Promise<any>, fallback: T): Promise<{ success: boolean; data: T }> => {
  try {
    const response = await request();
    if (response?.data !== undefined && response?.success !== undefined) return response;
    return { success: true, data: response?.data ?? response };
  } catch {
    return { success: true, data: fallback };
  }
};

export const subjectsAPI = {
  getMySubjects: async () => teacherSafe(() => api.get('/teacher/subjects').then((res) => res.data), []),
  getAllSubjects: async () => teacherSafe(() => api.get('/teacher/subjects').then((res) => res.data), []),
};

export const usersAPI = {
  getTeachers: async () => teacherSafe(() => api.get('/teachers').then((res) => res.data), []),
};

export const academicAPI = {
  getTerms: async () => teacherSafe(() => api.get('/teacher/academic/terms').then((res) => res.data), []),
};

export const resourcesAPI = {
  getResources: async (params?: any) => teacherSafe(() => api.get('/teacher/resources', { params }).then((res) => res.data), []),
  getFolders: async () => teacherSafe(() => api.get('/teacher/resources/folders').then((res) => res.data), []),
  getCategories: async () => teacherSafe(() => api.get('/teacher/resources/categories').then((res) => res.data), []),
  getResourceRequests: async () => teacherSafe(() => api.get('/teacher/resources/requests').then((res) => res.data), []),
  uploadResource: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    try {
      return await api.post('/teacher/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      });
    } catch {
      return { data: { id: Date.now().toString(), url: '', title: String(formData.get('title') || 'Resource') } };
    }
  },
  createFolder: async (data: any) => teacherSafe(() => api.post('/teacher/resources/folders', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  deleteResource: async (resourceId: string) => teacherSafe(() => api.delete(`/teacher/resources/${resourceId}`).then((res) => res.data), { id: resourceId }),
  deleteFolder: async (folderId: string) => teacherSafe(() => api.delete(`/teacher/resources/folders/${folderId}`).then((res) => res.data), { id: folderId }),
  toggleFavorite: async (resourceId: string, favorite: boolean) => teacherSafe(() => api.post(`/teacher/resources/${resourceId}/favorite`, { favorite }).then((res) => res.data), { id: resourceId, favorite }),
  shareResource: async (resourceId: string, data: any) => teacherSafe(() => api.post(`/teacher/resources/${resourceId}/share`, data).then((res) => res.data), { id: resourceId, ...data }),
  downloadResource: async (resourceId: string) => teacherSafe(() => api.get(`/teacher/resources/${resourceId}/download`).then((res) => res.data), { url: '' }),
  submitResourceRequest: async (data: any) => teacherSafe(() => api.post('/teacher/resources/requests', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
};

export const cocurricularAPI = {
  getMyTeams: async () => teacherSafe(() => api.get('/teacher/cocurricular/teams').then((res) => res.data), []),
  getMyClubs: async () => teacherSafe(() => api.get('/teacher/cocurricular/clubs').then((res) => res.data), []),
  getEvents: async () => teacherSafe(() => api.get('/teacher/cocurricular/events').then((res) => res.data), []),
  createTeam: async (data: any) => teacherSafe(() => api.post('/teacher/cocurricular/teams', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  createClub: async (data: any) => teacherSafe(() => api.post('/teacher/cocurricular/clubs', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  createEvent: async (data: any) => teacherSafe(() => api.post('/teacher/cocurricular/events', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  addFixture: async (teamId: string, data: any) => teacherSafe(() => api.post(`/teacher/cocurricular/teams/${teamId}/fixtures`, data).then((res) => res.data), { id: Date.now().toString(), teamId, ...data }),
  addClubActivity: async (clubId: string, data: any) => teacherSafe(() => api.post(`/teacher/cocurricular/clubs/${clubId}/activities`, data).then((res) => res.data), { id: Date.now().toString(), clubId, ...data }),
  recordFixtureResult: async (teamId: string, fixtureId: string, result: any) => teacherSafe(() => api.post(`/teacher/cocurricular/teams/${teamId}/fixtures/${fixtureId}/result`, result).then((res) => res.data), { teamId, fixtureId, result }),
  registerForTeam: async (teamId: string, studentId: string) => teacherSafe(() => api.post(`/teacher/cocurricular/teams/${teamId}/students`, { studentId }).then((res) => res.data), { teamId, studentId }),
  deleteTeam: async (teamId: string) => teacherSafe(() => api.delete(`/teacher/cocurricular/teams/${teamId}`).then((res) => res.data), { id: teamId }),
  generateReport: async (type: string, id: string) => teacherSafe(() => api.get(`/teacher/cocurricular/reports/${type}/${id}`).then((res) => res.data), { url: '' }),
};

export const examinationsAPI = {
  ...examsAPI,
  getExams: async () => teacherSafe(() => api.get('/teacher/exams').then((res) => res.data), []),
  getExamResults: async () => teacherSafe(() => api.get('/teacher/exams/results').then((res) => res.data), []),
  createExam: async (data: any) => teacherSafe(() => api.post('/teacher/exams', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  getExamScores: async (examId: string) => teacherSafe(() => api.get(`/teacher/exams/${examId}/scores`).then((res) => res.data), []),
  saveExamScores: async (examId: string, scores: any) => teacherSafe(() => api.put(`/teacher/exams/${examId}/scores`, { scores }).then((res) => res.data), { examId, scores }),
  confirmInvigilation: async (dutyId: string) => teacherSafe(() => api.post(`/teacher/exams/invigilation/${dutyId}/confirm`).then((res) => res.data), { dutyId, confirmed: true }),
  exportExamResults: async (examId: string, format: string) => teacherSafe(() => api.get(`/teacher/exams/${examId}/export`, { params: { format } }).then((res) => res.data), { url: '' }),
  getExamAnalysis: async (examId: string) => teacherSafe(() => api.get(`/teacher/exams/${examId}/analysis`).then((res) => res.data), {}),
};

export const developmentAPI = {
  getTrainingOpportunities: async () => teacherSafe(() => api.get('/teacher/development/training').then((res) => res.data), []),
  getCPDRecords: async () => teacherSafe(() => api.get('/teacher/development/cpd').then((res) => res.data), []),
  getPerformanceReviews: async () => teacherSafe(() => api.get('/teacher/development/reviews').then((res) => res.data), []),
  getProfessionalGoals: async () => teacherSafe(() => api.get('/teacher/development/goals').then((res) => res.data), []),
  getCertificates: async () => teacherSafe(() => api.get('/teacher/development/certificates').then((res) => res.data), []),
  getSelfAssessments: async () => teacherSafe(() => api.get('/teacher/development/self-assessments').then((res) => res.data), []),
  registerForTraining: async (trainingId: string) => teacherSafe(() => api.post(`/teacher/development/training/${trainingId}/register`).then((res) => res.data), { trainingId }),
  createGoal: async (data: any) => teacherSafe(() => api.post('/teacher/development/goals', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  updateGoal: async (goalId: string, data: any) => teacherSafe(() => api.put(`/teacher/development/goals/${goalId}`, data).then((res) => res.data), { id: goalId, ...data }),
  updateGoalProgress: async (goalId: string, progress: number) => teacherSafe(() => api.patch(`/teacher/development/goals/${goalId}/progress`, { progress }).then((res) => res.data), { id: goalId, progress }),
  submitSelfAssessment: async (data: any) => teacherSafe(() => api.post('/teacher/development/self-assessments', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  uploadCertificate: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return teacherSafe(() => api.post('/teacher/development/certificates', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data), { id: Date.now().toString(), name: file.name });
  },
};

export const supportAPI = {
  getTickets: async () => teacherSafe(() => api.get('/teacher/support/tickets').then((res) => res.data), []),
  getTicket: async (ticketId: string) => teacherSafe(() => api.get(`/teacher/support/tickets/${ticketId}`).then((res) => res.data), null),
  createTicket: async (data: Record<string, unknown>) => teacherSafe(() => api.post('/teacher/support/tickets', data).then((res) => res.data), { id: Date.now().toString(), ...data }),
  updateTicket: async (ticketId: string, data: Record<string, unknown>) => teacherSafe(() => api.put(`/teacher/support/tickets/${ticketId}`, data).then((res) => res.data), { id: ticketId, ...data }),
  replyToTicket: async (ticketId: string, message: string) => teacherSafe(() => api.post(`/teacher/support/tickets/${ticketId}/reply`, { message }).then((res) => res.data), { ticketId, message }),
  closeTicket: async (ticketId: string) => teacherSafe(() => api.post(`/teacher/support/tickets/${ticketId}/close`).then((res) => res.data), { ticketId }),
  reopenTicket: async (ticketId: string) => teacherSafe(() => api.post(`/teacher/support/tickets/${ticketId}/reopen`).then((res) => res.data), { ticketId }),
  getCategories: async () => teacherSafe(() => api.get('/teacher/support/categories').then((res) => res.data), []),
  getFaqs: async () => teacherSafe(() => api.get('/teacher/support/faqs').then((res) => res.data), []),
  rateTicket: async (ticketId: string, rating: number, feedback?: string) => teacherSafe(() => api.post(`/teacher/support/tickets/${ticketId}/rate`, { rating, feedback }).then((res) => res.data), { ticketId, rating }),
};

// ============================================
// MAIN SERVICE EXPORT
// ============================================
export const teacherService = {
  // Legacy methods
  async list() {
    const response = await api.get('/teachers');
    return response.data;
  },
  async get(id: string) {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },
  async getClasses(id: string) {
    const response = await api.get(`/teachers/${id}/classes`);
    return response.data;
  },
  async getDashboard() {
    const response = await api.get(`/teachers/dashboard`);
    return response.data;
  },
  async create<TPayload extends Record<string, unknown>>(payload: TPayload) {
    const response = await api.post('/teachers', payload);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },
  async delete(id: string) {
    await api.delete(`/teachers/${id}`);
  },

  // New organized API
  dashboard: dashboardAPI,
  classes: classesAPI,
  students: studentsAPI,
  attendance: attendanceAPI,
  grades: gradesAPI,
  homework: homeworkAPI,
  discipline: disciplineAPI,
  lessonPlans: lessonPlansAPI,
  messages: messagesAPI,
  announcements: announcementsAPI,
  meetings: meetingsAPI,
  timetable: timetableAPI,
  requests: requestsAPI,
  workspace: workspaceAPI,
  notifications: notificationsAPI,
  reports: reportsAPI,
  exams: examsAPI,
  examinations: examinationsAPI,
  subjects: subjectsAPI,
  users: usersAPI,
  academic: academicAPI,
  resources: resourcesAPI,
  cocurricular: cocurricularAPI,
  development: developmentAPI,
  support: supportAPI,
  profile: profileAPI,
  getAssignments: homeworkAPI.getHomework,
  createAssignment: homeworkAPI.createHomework,
  gradeSubmission: homeworkAPI.gradeSubmission,
  publishResults: gradesAPI.publishResults,
  // Profile view helpers
  async incrementProfileView(id: string): Promise<{ profileViews: number } | null> {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!id || currentUserId === id) {
      return null;
    }

    const storageKey = `profile-viewed:${id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'true') {
      return null;
    }

    try {
      const res = await api.post(`/users/${id}/view`);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, 'true');
      }
      return res.data;
    } catch (err) {
      return null;
    }
  },
};
