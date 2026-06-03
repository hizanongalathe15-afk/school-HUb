import { NotificationType, Role } from '@prisma/client';
import { prisma } from '../config/database.js';
import { smsService } from './smsService.js';
import { emailService } from './emailService.js';
import { whatsappService } from './whatsappService.js';
import { eventEmitter } from './eventEmitterService.js';

export interface NotificationArchive {
  userId: string;
  archivedIds: string[];
}

const DEMO_NOTIFICATIONS = [
  {
    type: NotificationType.MEETING_REQUEST,
    title: 'Parent meeting request',
    message: 'A parent meeting request is waiting for review in the communication area.',
    link: '/dashboard/admin/communication/announcements'
  },
  {
    type: NotificationType.PAYMENT_CONFIRMATION,
    title: 'Fee payment received',
    message: 'A new fee payment has been recorded and needs finance review.',
    link: '/dashboard/admin/finance/payments'
  }
];

const roleLabels: Record<Role, string> = {
  DEVELOPER: 'developer',
  PRINCIPAL: 'principal',
  ADMIN: 'admin',
  BURSAR: 'bursar',
  STORE_KEEPER: 'store keeper',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
  ALUMNI: 'alumni',
  GUEST: 'guest'
};

const roleLinks: Record<Role, string> = {
  DEVELOPER: '/dashboard/system-metrics',
  PRINCIPAL: '/dashboard/principal',
  ADMIN: '/dashboard/admin',
  BURSAR: '/dashboard/bursar',
  STORE_KEEPER: '/dashboard/storekeeper',
  TEACHER: '/dashboard/teacher',
  PARENT: '/dashboard/parent',
  STUDENT: '/dashboard',
  ALUMNI: '/dashboard',
  GUEST: '/dashboard'
};

function firstName(user: { firstName: string; email: string }) {
  return user.firstName?.trim() || user.email.split('@')[0] || 'there';
}

function welcomeCopy(user: { firstName: string; email: string; role: Role }) {
  const name = firstName(user);
  const role = roleLabels[user.role] || 'user';
  return {
    title: `Welcome back, ${name}`,
    message: `We're happy to have you back in your ${role} workspace. Your dashboard is ready with the latest school updates.`,
    link: roleLinks[user.role] || '/dashboard'
  };
}

async function getArchive(userId: string): Promise<string[]> {
  const setting = await prisma.setting.findFirst({
    where: { group: 'notifications', key: `archive:${userId}` }
  });

  if (setting && Array.isArray(setting.value)) {
    return setting.value.filter((id): id is string => typeof id === 'string');
  }

  return [];
}

async function saveArchive(userId: string, ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  await prisma.setting.upsert({
    where: { key: `archive:${userId}` },
    update: { value: uniqueIds as unknown as any, group: 'notifications', updatedBy: userId },
    create: { key: `archive:${userId}`, value: uniqueIds as unknown as any, group: 'notifications', updatedBy: userId }
  });
}

export const notificationService = {
  async createWelcome(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, email: true, role: true }
    });
    if (!user) return null;

    const copy = welcomeCopy(user);
    return prisma.notification.create({
      data: {
        userId,
        type: NotificationType.GENERAL_ANNOUNCEMENT,
        title: copy.title,
        message: copy.message,
        link: copy.link
      }
    });
  },

  async ensureWelcomeNotification(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, email: true, role: true }
    });
    if (!user) return;

    const copy = welcomeCopy(user);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.GENERAL_ANNOUNCEMENT,
        OR: [
          { title: { startsWith: 'Welcome back,' } },
          { title: 'Dashboard ready' }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    if (existing) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: {
          title: copy.title,
          message: copy.message,
          link: copy.link
        }
      });
      return;
    }

    await this.createWelcome(userId);
  },

  async ensureDemoNotifications(userId: string) {
    await this.ensureWelcomeNotification(userId);
    const count = await prisma.notification.count({ where: { userId } });
    if (count > 1) return;

    await prisma.notification.createMany({
      data: DEMO_NOTIFICATIONS.map((notification) => ({
        ...notification,
        userId
      }))
    });
  },

  async list(userId: string, includeArchived = false) {
    await this.ensureDemoNotifications(userId);
    const archivedIds = await getArchive(userId);
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { id: { notIn: archivedIds } })
      },
      orderBy: { createdAt: 'desc' },
      take: 80
    });

    const unreadCount = notifications.filter((notification) => !notification.isRead).length;
    return {
      notifications: notifications.map((notification) => ({
        ...notification,
        archived: archivedIds.includes(notification.id)
      })),
      unreadCount,
      archivedCount: archivedIds.length
    };
  },

  async markRead(userId: string, ids: string[]) {
    await prisma.notification.updateMany({
      where: { userId, id: { in: ids } },
      data: { isRead: true }
    });
    return this.list(userId);
  },

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return this.list(userId);
  },

  async archive(userId: string, ids: string[]) {
    const archivedIds = await getArchive(userId);
    await saveArchive(userId, [...archivedIds, ...ids]);
    return this.list(userId);
  },

  async delete(userId: string, ids: string[]) {
    await prisma.notification.deleteMany({
      where: { userId, id: { in: ids } }
    });
    const archivedIds = await getArchive(userId);
    await saveArchive(userId, archivedIds.filter((id) => !ids.includes(id)));
    return this.list(userId);
  },

  async create(userId: string, data: { title: string; message: string; link?: string; type?: NotificationType }) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        link: data.link,
        type: data.type || NotificationType.GENERAL_ANNOUNCEMENT
      }
    });
    return notification;
  },

  // Send notification via appropriate channels based on user preferences
  async sendNotification(
    userId: string, 
    data: { 
      title: string; 
      message: string; 
      link?: string; 
      type?: NotificationType;
      channels?: ('SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH')[]
    }
  ) {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true, 
          phone: true,
          role: true
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Determine which channels to use
      const channelsToUse = data.channels || ['PUSH']; // Default to push notifications
      
      // Create notification record in database
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: data.title,
          message: data.message,
          link: data.link,
          type: data.type || NotificationType.GENERAL_ANNOUNCEMENT
        }
      });
      
      // Send via each requested channel
      const sendPromises = [];
      
      if (channelsToUse.includes('SMS') && user.phone) {
        sendPromises.push(
          smsService.sendSms(user.phone, `${data.title}: ${data.message}`)
            .then(result => {
              console.log(`SMS sent to ${user.phone}:`, result);
              return result;
            })
            .catch(error => {
              console.error(`Failed to send SMS to ${user.phone}:`, error);
              throw error;
            })
        );
      }
      
      if (channelsToUse.includes('EMAIL') && user.email) {
        sendPromises.push(
          emailService.create({
            to: user.email,
            subject: data.title,
            text: data.message,
            html: `<p>${data.message}</p>${data.link ? `<p><a href="${data.link}">Click here for more details</a></p>` : ''}`
          })
            .then(result => {
              console.log(`Email sent to ${user.email}:`, result);
              return result;
            })
            .catch(error => {
              console.error(`Failed to send email to ${user.email}:`, error);
              throw error;
            })
        );
      }
      
      if (channelsToUse.includes('WHATSAPP') && user.phone) {
        sendPromises.push(
          whatsappService.create({
            to: user.phone,
            message: `${data.title}\n\n${data.message}${data.link ? `\n\nLink: ${data.link}` : ''}`
          })
            .then(result => {
              console.log(`WhatsApp message sent to ${user.phone}:`, result);
              return result;
            })
            .catch(error => {
              console.error(`Failed to send WhatsApp message to ${user.phone}:`, error);
              throw error;
            })
        );
      }
      
      // For PUSH notifications, we would typically use Firebase Cloud Messaging or similar
      // For now, we'll just log it since we don't have FCM configured in this example
      if (channelsToUse.includes('PUSH')) {
        console.log(`PUSH notification would be sent to user ${userId}: ${data.title}`);
        // In a real implementation, you would use FCM or similar service here
        sendPromises.push(Promise.resolve({ 
          id: `push_${Date.now()}`, 
          userId, 
          status: 'SENT' 
        }));
      }
      
      // Wait for all channel sends to complete
      const results = await Promise.all(sendPromises);
      
      // Emit event for real-time updates
      eventEmitter.emitEvent('notification:sent', {
        notificationId: notification.id,
        userId,
        channels: channelsToUse,
        timestamp: new Date().toISOString()
      });
      
      return {
        notification,
        channelResults: results
      };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
};
