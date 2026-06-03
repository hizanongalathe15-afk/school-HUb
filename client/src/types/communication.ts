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