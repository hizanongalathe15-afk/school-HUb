import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { User, LoginCredentials, AuthResponse } from '../types/user';
import { normalizeApiError, notifyError, notifySuccess } from '../utils/feedback';
import { handleOfflineAxiosError, queueActionIfOffline, syncQueuedActions } from '../utils/offlineActionQueue';

declare module 'axios' {
  export interface AxiosRequestConfig {
    successMessage?: string;
    silentErrorToast?: boolean;
    offlineQueue?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const offlineResponse = await queueActionIfOffline(config);
  if (offlineResponse) {
    return Promise.reject({ __offlineResponse: offlineResponse, config });
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    const successMessage = response.config.successMessage || response.data?.message;

    if (successMessage && method && method !== 'GET') {
      notifySuccess(successMessage);
    }

    return response;
  },
  async (error) => {
    if (error?.__offlineResponse) {
      return Promise.resolve(error.__offlineResponse);
    }

    const originalRequest = error.config;
    const refreshToken = useAuthStore.getState().refreshToken;

    if (error.response?.status === 401 && refreshToken && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        const { token, refreshToken: nextRefreshToken, user } = response.data as AuthResponse;
        useAuthStore.getState().login(user, token, nextRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
      }
    }

    try {
      const queuedResponse = await handleOfflineAxiosError(error);
      return queuedResponse;
    } catch {
      // Continue through normal error handling when the request cannot be queued safely.
    }

    const appError = normalizeApiError(error);
    error.appError = appError;

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    if (!originalRequest?.silentErrorToast) {
      notifyError(error);
    }

    return Promise.reject(error);
  }
);

window.addEventListener('online', () => {
  syncQueuedActions().catch(() => undefined);
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials, {
      successMessage: 'Signed in successfully.'
    });
    return response.data;
  },

  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data, {
      successMessage: 'Account created successfully.'
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email }, {
      successMessage: 'Password reset instructions were prepared.'
    });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`/auth/reset-password/${token}`, { password }, {
      successMessage: 'Password reset successfully.'
    });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout', {}, {
      successMessage: 'Logged out successfully.',
      silentErrorToast: true,
    });
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Pick<User, 'firstName' | 'lastName'> & { phone?: string; avatar?: string | null }): Promise<User> => {
    const response = await api.patch('/auth/me', data, {
      successMessage: 'Profile saved successfully.'
    });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword }, {
      successMessage: 'Password changed successfully.'
    });
  },
};

export const schoolService = {
  getSchool: async () => {
    const response = await api.get('/school');
    return response.data;
  },

  updateSchool: async (data: any) => {
    const response = await api.put('/school', data);
    return response.data;
  },
};

export const studentService = {
  getAll: async () => {
    const response = await api.get('/students');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/students', data, {
      successMessage: 'Student saved successfully.'
    });
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data, {
      successMessage: 'Student updated successfully.'
    });
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/students/${id}`, {
      successMessage: 'Student deleted successfully.'
    });
  },
};

export const feeService = {
  getAll: async () => {
    const response = await api.get('/fees');
    return response.data;
  },

  getByStudent: async (studentId: string) => {
    const response = await api.get(`/fees/student/${studentId}`);
    return response.data;
  },

  makePayment: async (data: any) => {
    const response = await api.post('/fees/payment', data, {
      successMessage: 'Payment saved successfully.'
    });
    return response.data;
  },
};

export const parentService = {
  getDashboard: async () => {
    const response = await api.get('/parents/dashboard');
    return response.data;
  },
  // Profile view helper (best-effort)
  async incrementProfileView(id: string) {
    try {
      const res = await api.post(`/users/${id}/view`);
      return res.data;
    } catch (err) {
      return null;
    }
  },
};

export const attendanceService = {
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  },

  markAttendance: async (data: any) => {
    const response = await api.post('/attendance', data, {
      successMessage: 'Attendance saved successfully.'
    });
    return response.data;
  },
};

export const resultService = {
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/results/student/${studentId}`);
    return response.data;
  },

  enterResult: async (data: any) => {
    const response = await api.post('/results', data, {
      successMessage: 'Result saved successfully.'
    });
    return response.data;
  },
};

export const inventoryService = {
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },

  requestStock: async (data: any) => {
    const response = await api.post('/inventory/request', data, {
      successMessage: 'Stock request saved successfully.'
    });
    return response.data;
  },
};

export const libraryService = {
  getAllBooks: async () => {
    const response = await api.get('/library/books');
    return response.data;
  },

  borrowBook: async (data: any) => {
    const response = await api.post('/library/borrow', data);
    return response.data;
  },
};

export const disciplineService = {
  getByStudent: async (studentId: string) => {
    const response = await api.get(`/discipline/student/${studentId}`);
    return response.data;
  },

  recordDiscipline: async (data: any) => {
    const response = await api.post('/discipline', data);
    return response.data;
  },
};

export const eventService = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/events', data);
    return response.data;
  },
};

export interface OnlineClassFocusSignals {
  visible: boolean;
  activeWindow: boolean;
  idleSeconds: number;
  faceDetected?: boolean;
  gazeCentered?: boolean;
}

export const onlineClassService = {
  getAll: async () => {
    const response = await api.get('/online-classes');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/online-classes', data);
    return response.data;
  },

  join: async (id: string, studentId?: string) => {
    const response = await api.post(`/online-classes/${id}/join`, { studentId });
    return response.data;
  },

  recordFocus: async (id: string, data: OnlineClassFocusSignals & { studentId?: string }) => {
    const response = await api.post(`/online-classes/${id}/focus`, data);
    return response.data;
  },
};

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'workflow' | 'record' | 'action';
  title: string;
  body: string;
  order: number;
  locked?: boolean;
}

export const dashboardLayoutService = {
  get: async (moduleId: string, role?: string) => {
    const query = role ? `?role=${role}` : '';
    const cacheKey = `${role || 'self'}:${moduleId}`;
    const cached = dashboardLayoutCache.get(cacheKey);
    if (cached && Date.now() - cached.time < 5000) {
      return cached.value;
    }
    const response = await api.get(`/dashboard-layouts/${moduleId}${query}`);
    dashboardLayoutCache.set(cacheKey, { time: Date.now(), value: response.data });
    return response.data;
  },

  save: async (moduleId: string, data: { role?: string; widgets: DashboardWidget[] }) => {
    const response = await api.put(`/dashboard-layouts/${moduleId}`, data);
    dashboardLayoutCache.set(`${data.role || 'self'}:${moduleId}`, { time: Date.now(), value: response.data });
    return response.data;
  },
};

export const landingMediaService = {
  getAll: async () => {
    const response = await api.get('/landing-media');
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post('/landing-media', data);
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch(`/landing-media/${id}`, data);
    return response.data.data;
  },

  reorder: async (orderedIds: string[]) => {
    const response = await api.patch('/landing-media/reorder', { orderedIds });
    return response.data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/landing-media/${id}`);
  },
};

export interface ChatGroupAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: 'file' | 'voice' | 'folder';
  dataUrl?: string;
}

export interface ChatGroupMessage {
  id: string;
  senderId: string;
  body: string;
  attachments?: ChatGroupAttachment[];
  createdAt: string;
}

export interface ChatGroupMemberProfile {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ChatGroupRecord {
  id: string;
  name: string;
  scope: 'whole_school' | 'staff' | 'teachers' | 'parents' | 'class' | 'custom';
  ownerId: string;
  memberIds: string[];
  allowedRoles: string[];
  archivedBy?: string[];
  leftBy?: string[];
  mutedUntilBy?: Record<string, string>;
  disappearingBy?: Record<string, string>;
  themeBy?: Record<string, string>;
  shortcutsBy?: string[];
  listBy?: string[];
  blockedBy?: string[];
  memberProfiles?: ChatGroupMemberProfile[];
  messages: ChatGroupMessage[];
  createdAt: string;
  updatedAt: string;
}

export const chatGroupService = {
  getAll: async (includeArchived = false): Promise<ChatGroupRecord[]> => {
    const response = await api.get('/chat-groups', { params: { archived: includeArchived } });
    return response.data.data;
  },

  create: async (data: Partial<ChatGroupRecord>): Promise<ChatGroupRecord> => {
    const response = await api.post('/chat-groups', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ChatGroupRecord>): Promise<ChatGroupRecord> => {
    const response = await api.patch(`/chat-groups/${id}`, data);
    return response.data.data;
  },

  addMembers: async (id: string, memberIds: string[]): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/members`, { memberIds });
    return response.data.data;
  },

  send: async (id: string, body: string, attachments: ChatGroupAttachment[] = []): Promise<ChatGroupMessage> => {
    const response = await api.post(`/chat-groups/${id}/messages`, { body, attachments });
    return response.data.data;
  },

  deleteMessages: async (id: string, messageIds: string[]): Promise<ChatGroupRecord> => {
    const response = await api.delete(`/chat-groups/${id}/messages`, { data: { messageIds } });
    return response.data.data;
  },

  clear: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/clear`);
    return response.data.data;
  },

  archive: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/archive`);
    return response.data.data;
  },

  mute: async (id: string, until: string | null): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/mute`, { until });
    return response.data.data;
  },

  setDisappearing: async (id: string, duration: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/disappearing`, { duration });
    return response.data.data;
  },

  setTheme: async (id: string, theme: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/theme`, { theme });
    return response.data.data;
  },

  shortcut: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/shortcut`);
    return response.data.data;
  },

  listToggle: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/list`);
    return response.data.data;
  },

  block: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/block`);
    return response.data.data;
  },

  report: async (id: string, reason: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/report`, { reason });
    return response.data.data;
  },

  call: async (id: string, type: 'voice' | 'video'): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/call`, { type });
    return response.data.data;
  },

  leave: async (id: string): Promise<ChatGroupRecord> => {
    const response = await api.post(`/chat-groups/${id}/leave`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/chat-groups/${id}`);
  },
};

export const systemMetricsService = {
  get: async () => {
    const response = await api.get('/system-metrics');
    return response.data;
  },

  getDetailed: async () => {
    const response = await api.get('/system-metrics');
    return response.data;
  },

  getHistory: async (period = 'month') => {
    const response = await api.get('/analytics/system/history', { params: { period } });
    return response.data;
  },

  logoutOthers: async () => {
    const response = await api.post('/system-metrics/logout-others');
    return response.data;
  },

  logoutSelected: async (ids: string[]) => {
    const response = await api.post('/system-metrics/logout-selected', { ids });
    return response.data;
  },

  clearInactive: async () => {
    const response = await api.post('/system-metrics/clear-inactive');
    return response.data;
  },

  clearAllSessions: async () => {
    const response = await api.post('/system-metrics/clear-all-sessions');
    return response.data;
  },
};

export const analyticsService = {
  getSchools: async () => {
    const response = await api.get('/analytics/schools');
    return response.data;
  },

  getSystemMetrics: async () => {
    const response = await api.get('/analytics/system');
    return response.data;
  },

  getSystemHistory: async (period = 'month') => {
    const response = await api.get('/analytics/system/history', { params: { period } });
    return response.data;
  },

  exportReport: async (params: { period: string; schoolId?: string; includeCharts?: boolean }) => {
    const response = await api.get('/analytics/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};

function analyticsParams(period: string, schoolId?: string) {
  return { period, schoolId: schoolId === 'all' ? undefined : schoolId };
}

export const studentAnalyticsService = {
  get: async (period: string, schoolId?: string) => {
    const response = await api.get('/analytics/students', { params: analyticsParams(period, schoolId) });
    return response.data;
  },
};

export const feeAnalyticsService = {
  get: async (period: string, schoolId?: string) => {
    const response = await api.get('/analytics/fees', { params: analyticsParams(period, schoolId) });
    return response.data;
  },
};

export const attendanceAnalyticsService = {
  get: async (period: string, schoolId?: string) => {
    const response = await api.get('/analytics/attendance', { params: analyticsParams(period, schoolId) });
    return response.data;
  },
};

export const performanceAnalyticsService = {
  get: async (period: string, schoolId?: string) => {
    const response = await api.get('/analytics/performance', { params: analyticsParams(period, schoolId) });
    return response.data;
  },
};

export const departmentAnalyticsService = {
  get: async (period: string, schoolId?: string) => {
    const response = await api.get('/analytics/departments', { params: analyticsParams(period, schoolId) });
    return response.data;
  },
};

export const settingsService = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.put('/settings', data);
    return response.data;
  },
};

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface FooterSocial {
  label: string;
  href: string;
}

export interface FooterContent {
  summary: string;
  columns: FooterColumn[];
  socials: FooterSocial[];
  bottomText: string;
}

export interface PublicPageSection {
  heading: string;
  body: string;
}

export interface PublicPageContent {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  body: string;
  category: string;
  sections: PublicPageSection[];
  updatedAt?: string;
}

export const footerService = {
  getContent: async (): Promise<FooterContent> => {
    const response = await api.get('/school/footer');
    return response.data.data;
  },

  updateContent: async (data: Partial<FooterContent>): Promise<FooterContent> => {
    const response = await api.put('/school/footer', data);
    return response.data.data;
  },

  resetContent: async (): Promise<FooterContent> => {
    const response = await api.post('/school/footer/reset');
    return response.data.data;
  },
};

export const landingContentService = {
  get: async () => {
    const response = await api.get('/school/landing-content');
    return response.data.data;
  },

  update: async (data: any) => {
    const response = await api.put('/school/landing-content', data, {
      successMessage: 'Landing page content saved successfully.'
    });
    return response.data.data;
  },
};

export const publicPageService = {
  list: async (): Promise<PublicPageContent[]> => {
    const response = await api.get('/school/public-pages');
    return response.data.data;
  },

  getBySlug: async (slug: string): Promise<PublicPageContent> => {
    const response = await api.get(`/school/public-pages/${slug.replace(/^\/+/, '')}`);
    return response.data.data;
  },

  updatePage: async (slug: string, data: Partial<PublicPageContent>): Promise<PublicPageContent> => {
    const response = await api.put(`/school/public-pages/${slug.replace(/^\/+/, '')}`, data);
    return response.data.data;
  },

  reset: async (): Promise<PublicPageContent[]> => {
    const response = await api.post('/school/public-pages/reset');
    return response.data.data;
  },
};

export const searchService = {
  global: async (query: string) => {
    const response = await api.get('/search', { params: { q: query, limit: 8 } });
    return response.data.data as Array<{ type: string; id: string; title: string; detail?: string; href: string }>;
  },
};

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
  archived?: boolean;
}

export interface NotificationPayload {
  notifications: NotificationItem[];
  unreadCount: number;
  archivedCount: number;
}

export const notificationService = {
  list: async (includeArchived = false): Promise<NotificationPayload> => {
    const response = await api.get('/notifications', { params: { archived: includeArchived } });
    return response.data.data;
  },

  markRead: async (ids: string[]): Promise<NotificationPayload> => {
    const response = await api.patch('/notifications/read', { ids });
    return response.data.data;
  },

  markAllRead: async (): Promise<NotificationPayload> => {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },

  archive: async (ids: string[]): Promise<NotificationPayload> => {
    const response = await api.patch('/notifications/archive', { ids });
    return response.data.data;
  },

  delete: async (ids: string[]): Promise<NotificationPayload> => {
    const response = await api.delete('/notifications', { data: { ids } });
    return response.data.data;
  },
};

export interface DashboardActionResult {
  id: string;
  moduleId: string;
  action: string;
  status: 'completed';
  auditMessage: string;
  completedAt: string;
  snapshot?: DashboardModuleSnapshot;
}

export interface DashboardModuleSnapshot {
  moduleId: string;
  generatedAt: string;
  metrics: Array<{ label: string; value: string; trend: string }>;
  workflows: Array<{ title: string; owner: string; status: string }>;
  records: string[];
}

const dashboardSnapshotCache = new Map<string, { time: number; value: DashboardModuleSnapshot; promise?: Promise<DashboardModuleSnapshot> }>();
const dashboardLayoutCache = new Map<string, { time: number; value: any }>();

export const dashboardModuleService = {
  getSnapshot: async (moduleId: string): Promise<DashboardModuleSnapshot> => {
    const cached = dashboardSnapshotCache.get(moduleId);
    if (cached?.promise) return cached.promise;
    if (cached && Date.now() - cached.time < 5000) return cached.value;

    const promise = api
      .get(`/dashboard/modules/${encodeURIComponent(moduleId)}/snapshot`)
      .then((response) => {
        const value = response.data.data as DashboardModuleSnapshot;
        dashboardSnapshotCache.set(moduleId, { time: Date.now(), value });
        return value;
      })
      .catch((error) => {
        dashboardSnapshotCache.delete(moduleId);
        throw error;
      });

    dashboardSnapshotCache.set(moduleId, { time: Date.now(), value: cached?.value as DashboardModuleSnapshot, promise });
    return promise;
  },

  getSnapshots: async (moduleIds: string[]): Promise<Record<string, DashboardModuleSnapshot>> => {
    const entries = await Promise.all(moduleIds.map(async (moduleId) => [moduleId, await dashboardModuleService.getSnapshot(moduleId)] as const));
    return Object.fromEntries(entries);
  },

  refreshSnapshot: async (moduleId: string): Promise<DashboardModuleSnapshot> => {
    dashboardSnapshotCache.delete(moduleId);
    const response = await api.get(`/dashboard/modules/${encodeURIComponent(moduleId)}/snapshot`);
    const value = response.data.data as DashboardModuleSnapshot;
    dashboardSnapshotCache.set(moduleId, { time: Date.now(), value });
    return value;
  },

  runAction: async (moduleId: string, action: string): Promise<DashboardActionResult> => {
    const response = await api.post(`/dashboard/modules/${encodeURIComponent(moduleId)}/actions`, { action });
    if (response.data.data?.snapshot) {
      dashboardSnapshotCache.set(moduleId, { time: Date.now(), value: response.data.data.snapshot });
    }
    return response.data.data as DashboardActionResult;
  },
};

export default api;

export async function getApi<T>(path: string): Promise<T> {
  const response = await api.get(path);
  return response.data as T;
}
