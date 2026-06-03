import { api } from './api';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
  isRead: boolean;
  archived?: boolean;
  createdAt: string;
}

export interface NotificationPayload {
  notifications: AppNotification[];
  unreadCount: number;
  archivedCount: number;
}

export const notificationService = {
  async list(includeArchived = false): Promise<NotificationPayload> {
    const response = await api.get('/notifications', { params: { archived: includeArchived } });
    return response.data.data;
  },

  async markRead(ids: string[]): Promise<NotificationPayload> {
    const response = await api.patch('/notifications/read', { ids });
    return response.data.data;
  },

  async markAllRead(): Promise<NotificationPayload> {
    const response = await api.patch('/notifications/read-all');
    return response.data.data;
  },

  async archive(ids: string[]): Promise<NotificationPayload> {
    const response = await api.patch('/notifications/archive', { ids });
    return response.data.data;
  },

  async delete(ids: string[]): Promise<NotificationPayload> {
    const response = await api.delete('/notifications', { data: { ids } });
    return response.data.data;
  },
};
