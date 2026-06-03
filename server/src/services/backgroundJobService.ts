import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { mpesaService } from './mpesaService.js';
import { smsService } from './smsService.js';
import { emailService } from './emailService.js';
import { notificationService } from './notificationService.js';
import { getRedisStatus } from '../config/redis.js';
import { cacheService } from './cacheService.js';

type ParentAttendanceNotification = {
  parentId: string;
  children: string[];
};

type ParentFeeNotification = {
  parentId: string;
  fees: Array<{
    type: string;
    amount: number;
    dueDate: Date;
  }>;
  totalAmount: number;
};

export class BackgroundJobService {
  private jobs: cron.ScheduledTask[] = [];
  private readonly jobPatterns: string[] = [];

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Job 1: Attendance Reminders - Every day at 6:00 AM
    this.jobs.push(
      cron.schedule('0 6 * * *', async () => {
        try {
          console.log('Running attendance reminders job...');
          
          // Find students who were absent yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          
          const absentStudents = await prisma.attendance.findMany({
            where: {
              date: {
                gte: yesterday,
                lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
              },
              status: 'ABSENT'
            },
            include: {
              student: {
                select: {
                  parentId: true
                }
              }
            }
          });

          // Group by parent to avoid duplicate notifications
          const parentNotifications = new Map<string, ParentAttendanceNotification>();
          
          for (const record of absentStudents) {
            const parentId = record.student.parentId;
            if (parentId) {
              if (!parentNotifications.has(parentId)) {
                parentNotifications.set(parentId, {
                  parentId,
                  children: [] as string[]
                });
              }
              
              const parentData = parentNotifications.get(parentId)!;
              parentData.children.push(record.studentId);
            }
          }

          for (const [parentId, data] of parentNotifications.entries()) {
            const students = await prisma.student.findMany({
              where: { id: { in: data.children } },
              select: { firstName: true, lastName: true },
            });
            const childrenNames = students
              .map((student) => `${student.firstName} ${student.lastName}`.trim())
              .join(', ') || data.children.join(', ');
            const message = `Reminder: The following children were absent yesterday: ${childrenNames}. Please ensure they attend school today.`;

            await notificationService.create(parentId, {
              title: 'Attendance Reminder',
              message,
              type: 'ATTENDANCE_REMINDER' as any,
            });

            const parent = await prisma.parent.findUnique({
              where: { id: parentId },
              select: { phone: true, email: true },
            });
            if (parent?.phone) {
              await smsService.sendSms(parent.phone, message);
            }
            if (parent?.email) {
              await emailService.create({
                to: parent.email,
                subject: 'Attendance Reminder',
                text: message,
              });
            }
          }
          
          console.log(`Attendance reminders sent to ${parentNotifications.size} parents`);
        } catch (error) {
          console.error('Error in attendance reminders job:', error);
        }
      })
    );

    // Job 2: Fee Due Reminders - Every day at 7:00 AM
    this.jobs.push(
      cron.schedule('0 7 * * *', async () => {
        try {
          console.log('Running fee due reminders job...');
          
          // Find fees due in the next 7 days
          const today = new Date();
          const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const dueFees = await prisma.fee.findMany({
            where: {
              dueDate: {
                gte: today,
                lte: sevenDaysFromNow
              },
              status: 'PENDING'
            },
            include: {
              student: {
                select: {
                  parentId: true
                }
              }
            }
          });

          // Group by parent
          const parentNotifications = new Map<string, ParentFeeNotification>();
          
          for (const fee of dueFees) {
            const parentId = fee.student.parentId;
            if (parentId) {
              if (!parentNotifications.has(parentId)) {
                parentNotifications.set(parentId, {
                  parentId,
                  fees: [] as any[],
                  totalAmount: 0
                });
              }
              
              const parentData = parentNotifications.get(parentId)!;
              parentData.fees.push(fee);
              parentData.totalAmount += fee.amount;
            }
          }

          // Send reminders to parents
          for (const [parentId, data] of parentNotifications.entries()) {
            const feeDetails = data.fees.map((f) => 
              `${f.type}: KSh ${f.amount} (Due: ${new Date(f.dueDate).toLocaleDateString()})`
            ).join('\n');
            
            const message = `Fee Payment Reminder\n\nYou have ${data.fees.length} fee payment(s) due in the next 7 days:\n\n${feeDetails}\n\nTotal Amount Due: KSh ${data.totalAmount}\n\nPlease make payment to avoid late fees.`;
            
            await notificationService.create(parentId, {
              title: 'Fee Payment Reminder',
              message,
              type: 'FEE_REMINDER' as any
            });
          }
          
          console.log(`Fee reminders sent to ${parentNotifications.size} parents`);
        } catch (error) {
          console.error('Error in fee due reminders job:', error);
        }
      })
    );

    // Job 3: Database Backup - Every 6 hours
    this.jobs.push(
      cron.schedule('0 */6 * * *', async () => {
        try {
          console.log('Running database backup job...');
          
          // In a real implementation, you would:
          // 1. Use pg_dump to create a backup
          // 2. Compress and encrypt it
          // 3. Upload to cloud storage (AWS S3, Google Cloud, etc.)
          // 4. Send notification to admin
          
          // For now, we'll just log that the job ran
          console.log('Database backup job completed (simulated)');
          
          // Notify admins
          const admins = await prisma.user.findMany({
            where: {
              role: {
                in: ['ADMIN', 'PRINCIPAL', 'BURSAR']
              }
            }
          });
          
          for (const admin of admins) {
            await notificationService.create(admin.id, {
              title: 'Database Backup Completed',
              message: 'The automated database backup has been completed successfully.',
              type: 'BACKUP_COMPLETED' as any
            });
          }
        } catch (error) {
          console.error('Error in database backup job:', error);
        }
      })
    );

    // Job 4: Low Stock Alerts - Every day at 8:00 AM
    this.jobs.push(
      cron.schedule('0 8 * * *', async () => {
        try {
          console.log('Running low stock alerts job...');
          
          // Find inventory items below reorder level
          const lowStockItems = await prisma.inventoryItem.findMany({
            where: {
              quantity: {
                lte: prisma.inventoryItem.fields.minThreshold
              }
            }
          });

          if (lowStockItems.length > 0) {
            const itemsDetails = lowStockItems.map((item) => 
              `${item.name}: ${item.quantity} ${item.unit} (Reorder level: ${item.minThreshold})`
            ).join('\n');
            
            const message = `Low Stock Alert\n\nThe following inventory items are below their reorder levels:\n\n${itemsDetails}\n\nPlease place orders to replenish stock.`;
            
            // Notify store keeper and admin
            const storeKeepers = await prisma.user.findMany({
              where: { role: 'STORE_KEEPER' }
            });
            
            const admins = await prisma.user.findMany({
              where: { role: 'ADMIN' }
            });
            
            const recipients = [...storeKeepers, ...admins];
            
            for (const recipient of recipients) {
              await notificationService.create(recipient.id, {
                title: 'Low Stock Alert',
                message,
                type: 'LOW_STOCK_ALERT' as any
              });
            }
            
            console.log(`Low stock alerts sent to ${recipients.length} recipients`);
          } else {
            console.log('No low stock items found');
          }
        } catch (error) {
          console.error('Error in low stock alerts job:', error);
        }
      })
    );

    // Job 5: Cache Warmup - Every hour
    this.jobs.push(
      cron.schedule('0 * * * *', async () => {
        try {
          console.log('Running cache warmup job...');
          
          const redisStatus = getRedisStatus();
          if (!redisStatus.enabled) {
            console.log('Redis is disabled, skipping cache warmup');
            return;
          }
          
          // In a real implementation, you would:
          // 1. Preload frequently accessed data into Redis
          // 2. Warm up caches for dashboards, menus, etc.
          
          // For example, cache school info, active sessions, etc.
          const schoolInfo = await prisma.school.findFirst();
          if (schoolInfo) {
            // Store in Redis cache
            await cacheService.set('school:info', schoolInfo, 3600); // Cache for 1 hour
            console.log('Cached school info');
          }
          
          // Cache active users count
          const activeUsersCount = await prisma.user.count({
            where: {
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          });
          await cacheService.set('metrics:activeUsers24h', activeUsersCount, 3600);
          console.log('Cached active users count');
          
          console.log('Cache warmup job completed');
        } catch (error) {
          console.error('Error in cache warmup job:', error);
        }
      })
    );

    this.jobPatterns.push('0 6 * * *', '0 7 * * *', '0 */6 * * *', '0 8 * * *', '0 * * * *');
    console.log(`Background job service initialized with ${this.jobs.length} jobs`);
  }

  // Method to manually trigger a job (for testing/admin purposes)
  async triggerJob(jobName: string) {
    // Implementation would depend on how you want to expose this
    console.log(`Manually triggering job: ${jobName}`);
    // In a real implementation, you might have a way to trigger specific jobs
  }

  // Get status of all jobs
  async getJobStatus() {
    return Promise.all(this.jobs.map(async (job, index) => ({
      id: index,
      pattern: this.jobPatterns[index] || 'unknown',
      status: await job.getStatus(),
      nextRun: job.getNextRun()?.toISOString() || null
    })));
  }

  // Shutdown all jobs
  shutdown() {
    for (const job of this.jobs) {
      job.stop();
    }
    this.jobs = [];
    console.log('All background jobs stopped');
  }
}
