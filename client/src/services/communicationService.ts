import { api } from './api';
import { websocketUtils, WebSocketMessage, WebSocketEventHandlers } from '../hooks/useWebSocket';

// Communication event types matching the backend WebSocket events
export enum CommunicationEventType {
  // Messages
  MESSAGE_NEW = 'message:new',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_READ = 'message:read',
  
  // Attendance
  ATTENDANCE_MARKED = 'attendance:marked',
  
  // Results
  RESULT_PUBLISHED = 'result:published',
  
  // Fees
  FEE_PAID = 'fee:paid',
  FEE_OVERDUE = 'fee:overdue',
  
  // Announcements
  ANNOUNCEMENT_NEW = 'announcement:new',
  
  // Homework
  HOMEWORK_ASSIGNED = 'homework:assigned',
  HOMEWORK_SUBMITTED = 'homework:submitted',
  HOMEWORK_GRADED = 'homework:graded',
  
  // Events
  EVENT_REMINDER = 'event:reminder',
  
  // Meetings
  MEETING_BOOKED = 'meeting:booked',
  MEETING_CANCELLED = 'meeting:cancelled',
  
  // Inventory
  STOCK_LOW = 'stock:low',
  STOCK_REQUEST = 'stock:request',
  
  // Discipline
  DISCIPLINE_MERIT = 'discipline:merit',
  DISCIPLINE_DEMERIT = 'discipline:demerit',
  
  // System
  PROFILE_UPDATED = 'profile:updated',
  SYSTEM_MAINTENANCE = 'system:maintenance'
}

// Message interfaces
export interface ChatMessage {
  id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  attachments?: Attachment[];
  timestamp?: string;
  isRead?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

// Bulk message interfaces
export interface BulkMessagePayload {
  recipients: string[];
  message: string;
  subject?: string;
  type: 'sms' | 'email' | 'whatsapp' | 'push';
  scheduledAt?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  attendanceAlerts: boolean;
  feeReminders: boolean;
  homeworkAlerts: boolean;
  announcementAlerts: boolean;
}

/**
 * Communication Service - Central hub for all inter-role communication
 * 
 * This service provides:
 * 1. Real-time messaging via WebSocket
 * 2. SMS notifications via backend API
 * 3. Email notifications via backend API
 * 4. WhatsApp notifications via backend API
 * 5. Push notifications via backend API
 */
export const communicationService = {
  // ==================== WebSocket Real-time Communication ====================
  
  /**
   * Send a real-time message to a specific user
   */
  sendMessage(receiverId: string, message: string, attachments?: Attachment[]) {
    return new Promise<void>((resolve, reject) => {
      if (!websocketUtils.isConnected()) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      websocketUtils.send(CommunicationEventType.MESSAGE_NEW, {
        receiverId,
        message,
        attachments,
        timestamp: new Date().toISOString()
      });

      resolve();
    });
  },

  /**
   * Send a message to a room (group chat, class, etc.)
   */
  sendToRoom(roomId: string, message: string, data?: any) {
    if (!websocketUtils.isConnected()) {
      console.warn('WebSocket not connected, message queued');
      return;
    }

    websocketUtils.send('room_message', {
      roomId,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Join a WebSocket room
   */
  joinRoom(roomId: string) {
    if (!websocketUtils.isConnected()) {
      console.warn('WebSocket not connected');
      return;
    }

    websocketUtils.send('join_room', { roomId });
  },

  /**
   * Leave a WebSocket room
   */
  leaveRoom(roomId: string) {
    if (!websocketUtils.isConnected()) {
      return;
    }

    websocketUtils.send('leave_room', { roomId });
  },

  /**
   * Broadcast a message to all connected users
   */
  broadcast(type: CommunicationEventType, data: any) {
    if (!websocketUtils.isConnected()) {
      console.warn('WebSocket not connected');
      return;
    }

    websocketUtils.send(type, data);
  },

  // ==================== SMS Communication ====================
  
  /**
   * Send SMS to a single recipient
   */
  async sendSMS(phoneNumber: string, message: string) {
    const response = await api.post('/sms/send', {
      phoneNumber,
      message
    });
    return response.data;
  },

  /**
   * Send SMS to multiple recipients
   */
  async sendBulkSMS(recipients: string[], message: string) {
    const response = await api.post('/sms/send-bulk', {
      recipients,
      message
    });
    return response.data;
  },

  /**
   * Send SMS to parents in a specific class
   */
  async sendSMSToClass(classId: string, message: string) {
    const response = await api.post('/sms/send-to-class', {
      classId,
      message
    });
    return response.data;
  },

  /**
   * Get SMS history
   */
  async getSMSHistory(params?: { limit?: number; offset?: number; status?: string }) {
    const response = await api.get('/sms', { params });
    return response.data;
  },

  // ==================== Email Communication ====================
  
  /**
   * Send email to a single recipient
   */
  async sendEmail(email: string, subject: string, body: string, attachments?: any[]) {
    const response = await api.post('/email/send', {
      email,
      subject,
      body,
      attachments
    });
    return response.data;
  },

  /**
   * Send email to multiple recipients
   */
  async sendBulkEmail(recipients: string[], subject: string, body: string) {
    const response = await api.post('/email/send-bulk', {
      recipients,
      subject,
      body
    });
    return response.data;
  },

  /**
   * Send email to parents in a specific class
   */
  async sendEmailToClass(classId: string, subject: string, body: string) {
    const response = await api.post('/email/send-to-class', {
      classId,
      subject,
      body
    });
    return response.data;
  },

  /**
   * Get email history
   */
  async getEmailHistory(params?: { limit?: number; offset?: number }) {
    const response = await api.get('/email', { params });
    return response.data;
  },

  // ==================== WhatsApp Communication ====================
  
  /**
   * Send WhatsApp message to a single recipient
   */
  async sendWhatsApp(phoneNumber: string, message: string) {
    const response = await api.post('/whatsapp/send', {
      phoneNumber,
      message
    });
    return response.data;
  },

  /**
   * Send WhatsApp message to a group
   */
  async sendWhatsAppToGroup(groupId: string, message: string) {
    const response = await api.post('/whatsapp/send-to-group', {
      groupId,
      message
    });
    return response.data;
  },

  /**
   * Send WhatsApp message to all parents
   */
  async sendWhatsAppToParents(message: string) {
    const response = await api.post('/whatsapp/send-to-parents', {
      message
    });
    return response.data;
  },

  // ==================== Push Notifications ====================
  
  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    const response = await api.post('/push/send', {
      userId,
      title,
      body,
      data
    });
    return response.data;
  },

  /**
   * Send push notification to multiple users
   */
  async sendBulkPushNotification(userIds: string[], title: string, body: string) {
    const response = await api.post('/push/send-bulk', {
      userIds,
      title,
      body
    });
    return response.data;
  },

  // ==================== Multi-Channel Communication ====================
  
  /**
   * Send notification through multiple channels
   * This ensures the message reaches the recipient through their preferred channel
   */
  async sendMultiChannel(options: {
    userIds?: string[];
    classId?: string;
    roleId?: string;
    title: string;
    message: string;
    channels: ('sms' | 'email' | 'whatsapp' | 'push')[];
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) {
    const response = await api.post('/communication/send-multi', options);
    return response.data;
  },

  /**
   * Send announcement to specific audience
   */
  async sendAnnouncement(options: {
    audience: 'all' | 'parents' | 'teachers' | 'students' | 'staff' | string;
    title: string;
    message: string;
    channels?: ('sms' | 'email' | 'whatsapp' | 'push' | 'websocket')[];
    priority?: 'low' | 'normal' | 'high';
  }) {
    // First, send via WebSocket for real-time delivery
    if (options.channels?.includes('websocket') || !options.channels) {
      this.broadcast(CommunicationEventType.ANNOUNCEMENT_NEW, {
        audience: options.audience,
        title: options.title,
        message: options.message,
        priority: options.priority
      });
    }

    // Then send via other channels
    const channels = options.channels || ['push'];
    const response = await api.post('/announcements/send', {
      audience: options.audience,
      title: options.title,
      message: options.message,
      channels,
      priority: options.priority
    });

    return response.data;
  },

  // ==================== Message Templates ====================
  
  /**
   * Get all message templates
   */
  async getTemplates(type?: 'sms' | 'email' | 'whatsapp') {
    const params = type ? { type } : {};
    const response = await api.get('/communication/templates', { params });
    return response.data;
  },

  /**
   * Create a new message template
   */
  async createTemplate(template: Omit<MessageTemplate, 'id'>) {
    const response = await api.post('/communication/templates', template);
    return response.data;
  },

  /**
   * Update a message template
   */
  async updateTemplate(id: string, template: Partial<MessageTemplate>) {
    const response = await api.patch(`/communication/templates/${id}`, template);
    return response.data;
  },

  /**
   * Delete a message template
   */
  async deleteTemplate(id: string) {
    await api.delete(`/communication/templates/${id}`);
  },

  // ==================== Notification Preferences ====================
  
  /**
   * Get user notification preferences
   */
  async getNotificationPreferences() {
    const response = await api.get('/communication/preferences');
    return response.data;
  },

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
    const response = await api.patch('/communication/preferences', preferences);
    return response.data;
  },

  // ==================== Chat Groups ====================
  
  /**
   * Create a chat group
   */
  async createChatGroup(data: {
    name: string;
    description?: string;
    memberIds: string[];
    type: 'class' | 'staff' | 'custom';
  }) {
    const response = await api.post('/chat-groups', data);
    return response.data;
  },

  /**
   * Get all chat groups for current user
   */
  async getChatGroups(includeArchived = false) {
    const response = await api.get('/chat-groups', { params: { archived: includeArchived } });
    return response.data;
  },

  /**
   * Send message to chat group
   */
  async sendGroupMessage(groupId: string, message: string, attachments?: Attachment[]) {
    const response = await api.post(`/chat-groups/${groupId}/messages`, {
      message,
      attachments
    });
    return response.data;
  },

  /**
   * Get chat group messages
   */
  async getGroupMessages(groupId: string, limit = 50, before?: string) {
    const response = await api.get(`/chat-groups/${groupId}/messages`, {
      params: { limit, before }
    });
    return response.data;
  },

  // ==================== Communication Analytics ====================
  
  /**
   * Get communication statistics
   */
  async getCommunicationStats(period: 'day' | 'week' | 'month' | 'year') {
    const response = await api.get('/communication/stats', { params: { period } });
    return response.data;
  },

  /**
   * Get delivery reports
   */
  async getDeliveryReports(params?: {
    type?: 'sms' | 'email' | 'whatsapp';
    status?: 'sent' | 'delivered' | 'failed';
    startDate?: string;
    endDate?: string;
  }) {
    const response = await api.get('/communication/delivery-reports', { params });
    return response.data;
  }
};

export default communicationService;
