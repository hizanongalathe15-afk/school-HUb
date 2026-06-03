import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PAYMENT'
  | 'NOTIFICATION_SENT'
  | 'MESSAGE_SENT'
  | 'ATTENDANCE_MARKED'
  | 'GRADE_ENTERED'
  | 'FILE_UPLOADED'
  | 'SETTINGS_CHANGED'
  | 'SCHOOL_INFO_UPDATED'
  | 'USER_ROLE_CHANGED';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  async log(data: AuditLogData) {
    try {
      // In a real implementation, you might want to send this to a separate audit database
      // or Elasticsearch for better performance and querying capabilities
      
      if (!data.userId) {
        console.log(`Audit skipped without user: ${data.action} ${data.entity} ${data.entityId || ''}`);
        return;
      }

      await (prisma.auditLog as any).create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValues: data.oldValues ?? undefined,
          newValues: data.newValues ?? undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
      
      console.log(`Audit log: ${data.action} ${data.entity} ${data.entityId || ''}`);
    } catch (error) {
      // Don't let audit logging failures break the application
      console.error('Failed to write audit log:', error);
    }
  }
  
  // Convenience methods for common actions
  async logCreate(userId: string | undefined, entity: string, entityId: string, newValues: Record<string, any>, description?: string) {
    return this.log({
      userId,
      action: 'CREATE',
      entity,
      entityId,
      description,
      newValues
    });
  }
  
  async logUpdate(userId: string | undefined, entity: string, entityId: string, oldValues: Record<string, any>, newValues: Record<string, any>, description?: string) {
    return this.log({
      userId,
      action: 'UPDATE',
      entity,
      entityId,
      description,
      oldValues,
      newValues
    });
  }
  
  async logDelete(userId: string | undefined, entity: string, entityId: string, oldValues: Record<string, any>, description?: string) {
    return this.log({
      userId,
      action: 'DELETE',
      entity,
      entityId,
      description,
      oldValues
    });
  }
}

export const auditLogger = new AuditLogger();
