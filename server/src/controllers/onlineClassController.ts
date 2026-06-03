import { Request, Response } from 'express';
import { onlineClassService } from '../services/onlineClassService.js';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';

export const onlineClassController = {
  list: async (_req: Request, res: Response) => {
    const sessions = await onlineClassService.list();
    res.json(sessions);
  },

   create: async (req: Request, res: Response) => {
     const session = await onlineClassService.create(req.body);
     
     // Emit event for real-time updates
     eventEmitter.emitEvent('announcement:new', {
       announcementId: `online_class_created_${Date.now()}`,
       message: `New online class created: ${session.title} for ${session.classId}`,
       audience: 'all',
       timestamp: new Date().toISOString()
     });
     
     // Audit log
     await auditLogger.logCreate(
       (req as any).user?.userId,
       'OnlineClass',
       session.id,
       session,
       `Online class created: ${session.title}`
     );
     
     res.status(201).json(session);
   },

   join: async (req: Request, res: Response) => {
     const studentId = String(req.body?.studentId || (req as any).user?.userId || 'anonymous-student');
     const session = await onlineClassService.join(req.params.id, studentId);
     if (!session) {
       return res.status(404).json({ message: 'Online class not found' });
     }
     
     // Emit event for real-time updates
     eventEmitter.emitEvent('event:reminder', {
       eventId: session.id,
       title: `Student joined online class: ${session.title}`,
       startsAt: new Date().toISOString(),
       timestamp: new Date().toISOString()
     });
     
     // Audit log
     await auditLogger.logCreate(
       (req as any).user?.userId,
       'OnlineClassJoin',
       `join_${session.id}_${studentId}_${Date.now()}`,
       {
         sessionId: session.id,
         studentId,
         joinedAt: new Date().toISOString()
       },
       `Student ${studentId} joined online class ${session.id}`
     );
     
     res.json(session);
   },

   focus: async (req: Request, res: Response) => {
     const studentId = String(req.body?.studentId || (req as any).user?.userId || 'anonymous-student');
     const signals = {
       visible: Boolean(req.body?.visible),
       activeWindow: Boolean(req.body?.activeWindow),
       idleSeconds: Number(req.body?.idleSeconds || 0),
       faceDetected: typeof req.body?.faceDetected === 'boolean' ? req.body.faceDetected : undefined,
       gazeCentered: typeof req.body?.gazeCentered === 'boolean' ? req.body.gazeCentered : undefined
     };
     
     const observation = await onlineClassService.recordFocus(req.params.id, studentId, signals);
     if (!observation) {
       return res.status(404).json({ message: 'Online class not found' });
     }
     
     // Emit event for real-time updates (focus change)
     eventEmitter.emitEvent('streak:awarded', {
       studentId,
       streakType: 'ATTENDANCE', // Using attendance as a proxy for focus
       days: 1, // This would be calculated based on actual streak logic in a real implementation
       timestamp: new Date().toISOString()
     });
     
     // Audit log
     await auditLogger.logCreate(
       (req as any).user?.userId,
       'FocusObservation',
       observation.id,
       {
         sessionId: req.params.id,
         studentId,
         score: observation.score,
         status: observation.status,
         signals: observation.signals,
         recordedAt: observation.createdAt
       },
       `Focus recorded for student ${studentId}: ${observation.status} (${observation.score}%)`
     );
     
     res.status(201).json(observation);
   }
};

