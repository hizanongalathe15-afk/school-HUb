// Communication Types for SMS, Email, WhatsApp

export interface SMSMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface EmailMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface WhatsAppMessage {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface BulkMessageRequest {
  recipients: string[];
  message: string;
  subject?: string;
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
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SMS / CHAT TYPES (Admin Communication Hub)
// ============================================
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isOnline?: boolean;
  lastSeen?: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: Contact[];
  admins?: Contact[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id?: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Message {
  id: string;
  text: string;
  sender?: {
    id: string;
    name?: string;
    role?: string;
  };
  replyTo?: Pick<Message, 'id' | 'text'>;
  attachments?: Attachment[];
  timestamp: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'sending';
  type?: 'sms' | 'email' | 'whatsapp' | 'telegram';
  isStarred?: boolean;
  chatId?: string;
}