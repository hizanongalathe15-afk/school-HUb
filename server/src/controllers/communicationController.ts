import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { eventEmitter } from '../services/eventEmitterService.js';
import { auditLogger } from '../services/auditLoggerService.js';
import { WebSocketService } from '../services/websocketService.js';

const prisma = new PrismaClient();

export const communicationController = {
  status: (_req: Request, res: Response) => {
    res.json({
      data: [
        { channel: 'SMS', status: 'Connected', deliveryRate: '99%' },
        { channel: 'WhatsApp', status: 'Connected', deliveryRate: '98%' },
        { channel: 'Portal Chat', status: 'Ready', deliveryRate: 'Realtime-ready' }
      ]
    });
  },

   sendMessage: async (req: Request, res: Response) => {
     try {
       const authUser = (req as any).user as { userId: string } | undefined;
       const { fromUserId, toUserId, receiverId, body, message, attachments = [], channel = 'PORTAL' } = req.body;
       const senderId = fromUserId || authUser?.userId;
       const targetId = toUserId || receiverId;
       const text = String(body || message || '').trim();

       if (!senderId || !targetId || (!text && !attachments.length)) {
         return res.status(400).json({ message: 'receiver and message body or attachment are required' });
       }

       const receiver = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
       if (!receiver) {
         return res.status(404).json({ message: 'Receiver user not found' });
       }

       const saved = await prisma.message.create({
         data: {
           senderId,
           receiverId: targetId,
           message: text || `[${channel} attachment]`,
           attachment: attachments.length ? JSON.stringify(attachments).slice(0, 20000) : undefined
         }
       });

       // Emit event for decoupled communication
       eventEmitter.emitEvent('message:new', {
         senderId,
         receiverId: targetId,
         message: text || `[${channel} attachment]`,
         timestamp: new Date().toISOString()
       });

       // Audit log
       await auditLogger.logCreate(
         senderId,
         'Message',
         saved.id,
         {
           senderId,
           receiverId: targetId,
           message: text || `[${channel} attachment]`,
           channel,
           attachmentsCount: attachments.length
         },
         `Message sent from ${senderId} to ${targetId}`
       );

       res.status(201).json({ message: 'Message sent', data: saved });
     } catch {
       res.status(500).json({ message: 'Unable to send message' });
     }
   },

  getMessages: async (req: Request, res: Response) => {
    const authUser = (req as any).user as { userId: string; role: string } | undefined;
    const userId = req.params.userId === 'me' ? authUser?.userId : req.params.userId;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } }
      }
    });
    res.json({ data: messages });
  },

  broadcast: (req: Request, res: Response) => {
    const { message = 'School announcement', audience = 'all parents', channel = 'WHATSAPP' } = req.body;
    res.json({
      data: {
        id: `broadcast_${Date.now()}`,
        channel,
        audience,
        message,
        delivered: 1942,
        failed: 0,
        simulated: true,
        sentAt: new Date().toISOString()
      }
    });
  },

  sendSms: (req: Request, res: Response) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ message: 'phone and message are required' });
    }
    res.json({ data: { id: `sms_${Date.now()}`, phone, message, status: 'SIMULATED_SENT' } });
  }
};
