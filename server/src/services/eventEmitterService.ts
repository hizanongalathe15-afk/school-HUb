import { EventEmitter } from 'events';

// Define event types that match the documentation
export type SystemEventType =
  | 'message:new'
  | 'message:read'
  | 'attendance:marked'
  | 'result:published'
  | 'fee:paid'
  | 'fee:overdue'
  | 'announcement:new'
  | 'homework:assigned'
  | 'homework:submitted'
  | 'homework:graded'
  | 'event:reminder'
  | 'meeting:booked'
  | 'meeting:cancelled'
  | 'stock:low'
  | 'stock:request'
  | 'stock:request_created'
  | 'stock:request_approved'
  | 'discipline:merit'
  | 'discipline:demerit'
  | 'streak:awarded'
  | 'profile:updated'
  | 'system:maintenance'
  | 'notification:sent'
  | 'student:registered'
  | 'teacher:created'
  | 'meeting:scheduled'
  | 'onlineclass:joined'
  | 'liveclass:started'
  | 'liveclass:ended'
  | 'term:end_processed'
  | 'parent:student_claimed';

// Define the shape of data for each event type
export interface SystemEventMap {
  'message:new': { messageId?: string; senderId: string; receiverId: string; message: string; timestamp: string };
  'message:read': { messageId: string; readerId: string; timestamp: string };
  'attendance:marked': { studentId: string; classId: string; status: string; timestamp: string };
  'result:published': { classId: string; subjectId: string; studentId: string; grade: string | null; score: number; timestamp: string };
  'fee:paid': { studentId: string; amount: number; transactionId: string; timestamp: string };
  'fee:overdue': { studentId: string; amount: number; daysOverdue: number; timestamp: string };
  'announcement:new': { announcementId: string; message: string; audience: string; timestamp: string };
  'homework:assigned': { homeworkId: string; classId: string; subject: string; title: string; timestamp: string };
  'homework:submitted': { homeworkId: string; studentId: string; submittedAt: string; timestamp: string };
  'homework:graded': { homeworkId: string; studentId: string; grade: number; feedback: string; timestamp: string };
  'event:reminder': { eventId: string; title: string; startsAt: string; timestamp: string };
  'meeting:booked': { meetingId: string; title: string; startsAt: string; attendeeIds: string[]; timestamp: string };
  'meeting:cancelled': { meetingId: string; title: string; timestamp: string };
  'stock:low': { itemId: string; itemName: string; currentQuantity: number; reorderLevel: number; timestamp: string };
  'stock:request': { requestId: string; itemId: string; quantity: number; requestedBy: string; timestamp: string };
  'stock:request_created': { requestId: string; teacherId: string; itemId: string; quantity: number; timestamp: string };
  'stock:request_approved': { requestId: string; teacherId: string; itemId: string; quantity: number; timestamp: string };
  'discipline:merit': { studentId: string; points: number; reason: string; timestamp: string };
  'discipline:demerit': { studentId: string; points: number; reason: string; timestamp: string };
  'streak:awarded': { studentId: string; streakType: string; days: number; timestamp: string };
  'profile:updated': { userId: string; updatedFields: string[]; timestamp: string };
  'system:maintenance': { message: string; startsAt: string; endsAt: string; timestamp: string };
  'notification:sent': { notificationId: string; userId: string; channels: string[]; timestamp: string };
  'student:registered': { studentId: string; parentId: string; admissionNumber: string; className: string; stream: string; timestamp: string };
  'teacher:created': { teacherId: string; userId: string; subject: string; assignedClasses: string[]; timestamp: string };
  'meeting:scheduled': { meetingId: string; parentId: string; teacherId: string; studentId: string; meetingDate: string; timestamp: string };
  'onlineclass:joined': { studentId: string; classId: string; subjectId: string; timestamp: string };
  'liveclass:started': { id: string; teacherId: string; classId: string; subjectId: string; title: string; meetingLink: string; startedAt: Date; isActive: boolean };
  'liveclass:ended': { classSessionId: string; userId: string; endedAt: Date };
  'term:end_processed': { schoolId: string; term: number; year: number; reportCardsGenerated: number; studentsPromoted: number; timestamp: string };
  'parent:student_claimed': { parentId: string; studentId: string; timestamp: string };
}

// Type for event handler functions
export type EventHandler<T extends SystemEventType> = (data: SystemEventMap[T]) => void;

export class EventEmitterService extends EventEmitter {
  private static instance: EventEmitterService;

  private constructor() {
    super();
    // Set maximum listeners to avoid warnings
    this.setMaxListeners(50);
  }

  public static getInstance(): EventEmitterService {
    if (!EventEmitterService.instance) {
      EventEmitterService.instance = new EventEmitterService();
    }
    return EventEmitterService.instance;
  }

  // Emit an event with strong typing
  public emitEvent<T extends SystemEventType>(event: T, data: SystemEventMap[T]): boolean {
    return this.emit(event, data);
  }

  // Subscribe to an event with strong typing
  public onEvent<T extends SystemEventType>(event: T, handler: EventHandler<T>): this {
    return this.on(event, handler);
  }

  // Subscribe to an event only once
  public onceEvent<T extends SystemEventType>(event: T, handler: EventHandler<T>): this {
    return this.once(event, handler);
  }

  // Remove event listener
  public offEvent<T extends SystemEventType>(event: T, handler: EventHandler<T>): this {
    return this.off(event, handler);
  }

  // Remove all listeners for an event
  public clearEvent<T extends SystemEventType>(event: T): this {
    return this.removeAllListeners(event);
  }

  // Get listener count for an event
  public listenerCountFor<T extends SystemEventType>(event: T): number {
    return this.listenerCount(event);
  }
}

// Export a singleton instance for easy access
export const eventEmitter = EventEmitterService.getInstance();
