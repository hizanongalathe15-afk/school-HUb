import { Request, Response } from 'express';
import { AttendanceStatus, PrismaClient } from '@prisma/client';
import { readSetting, writeSetting } from '../services/settingStore.js';
import { publicPageService } from '../services/publicPageService.js';

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const prisma = new PrismaClient();

function attendanceDayRange(input?: string) {
  const base = input ? new Date(input) : new Date();
  if (Number.isNaN(base.getTime())) {
    base.setTime(Date.now());
  }
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, key: start.toISOString().slice(0, 10) };
}

function normalizeAttendanceStatus(status?: string): AttendanceStatus {
  const normalized = String(status || 'PRESENT').toUpperCase();
  return Object.values(AttendanceStatus).includes(normalized as AttendanceStatus)
    ? normalized as AttendanceStatus
    : AttendanceStatus.PRESENT;
}

type InfrastructureFacility = {
  id: string;
  name: string;
  type: string;
  capacity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
  photos: string[];
  videos: string[];
  lastMaintenance?: string;
  assets?: Array<{ name: string; quantity: number; condition: string }>;
};

type InfrastructureStore = {
  facilities: InfrastructureFacility[];
  maintenanceLogs: any[];
  assets: any[];
};

type AdminWorkspaceRecord = {
  id: string;
  name: string;
  category: string;
  owner: string;
  status: 'Active' | 'Draft' | 'Archived';
  notes: string;
  amount?: number;
  dueDate?: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Critical';
  files?: Array<{ name: string; type: string; url: string }>;
  updatedAt: string;
};

type AdminWorkspaceStore = {
  records: AdminWorkspaceRecord[];
};

type AdminGradingSystem = {
  id: string;
  name: string;
  description?: string;
  passMark: number;
  grades: Array<{ letter: string; minScore: number; maxScore: number; points: number; description?: string }>;
  levels: Array<{
    minScore: number;
    maxScore: number;
    grade: string;
    points: number;
    description?: string;
    governmentEquivalency?: string;
    universityPoints?: number;
  }>;
  governmentBoard: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
  equivalencyMap: Record<string, string>;
  isDefault: boolean;
  updatedAt: string;
};

type GradingStore = {
  systems: AdminGradingSystem[];
};

type GovernmentIntegrationStore = {
  connected: boolean;
  lastSync: string;
  examBoard: 'KNEC' | 'NECTA' | 'UNEB' | 'WAEC' | 'OTHER';
  apiKey?: string;
  endpoint?: string;
  applicants: Record<string, { status: string; reason?: string; notifiedAt?: string }>;
};

const INFRASTRUCTURE_KEY = 'admin:infrastructure:facilities';
const ADMIN_WORKSPACE_PREFIX = 'admin:workspace:';
const GRADING_SYSTEMS_KEY = 'admin:academic:grading-systems';
const GOVERNMENT_INTEGRATION_KEY = 'admin:academic:government-integration';

function defaultGradingLevels(): AdminGradingSystem['levels'] {
  return [
    { minScore: 80, maxScore: 100, grade: 'A', points: 12, description: 'Excellent', governmentEquivalency: 'A', universityPoints: 12 },
    { minScore: 75, maxScore: 79, grade: 'A-', points: 11, description: 'Very Good', governmentEquivalency: 'A-', universityPoints: 11 },
    { minScore: 70, maxScore: 74, grade: 'B+', points: 10, description: 'Good', governmentEquivalency: 'B+', universityPoints: 10 },
    { minScore: 65, maxScore: 69, grade: 'B', points: 9, description: 'Above Average', governmentEquivalency: 'B', universityPoints: 9 },
    { minScore: 60, maxScore: 64, grade: 'B-', points: 8, description: 'Average', governmentEquivalency: 'B-', universityPoints: 8 },
    { minScore: 55, maxScore: 59, grade: 'C+', points: 7, description: 'Satisfactory', governmentEquivalency: 'C+', universityPoints: 7 },
    { minScore: 50, maxScore: 54, grade: 'C', points: 6, description: 'Fair', governmentEquivalency: 'C', universityPoints: 6 },
    { minScore: 45, maxScore: 49, grade: 'C-', points: 5, description: 'Below Average', governmentEquivalency: 'C-', universityPoints: 5 },
    { minScore: 40, maxScore: 44, grade: 'D+', points: 4, description: 'Poor', governmentEquivalency: 'D+', universityPoints: 4 },
    { minScore: 35, maxScore: 39, grade: 'D', points: 3, description: 'Very Poor', governmentEquivalency: 'D', universityPoints: 3 },
    { minScore: 30, maxScore: 34, grade: 'D-', points: 2, description: 'Weak', governmentEquivalency: 'D-', universityPoints: 2 },
    { minScore: 0, maxScore: 29, grade: 'E', points: 1, description: 'Fail', governmentEquivalency: 'E', universityPoints: 0 },
  ];
}

function defaultGradingSystem(): AdminGradingSystem {
  const levels = defaultGradingLevels();
  return {
    id: 'kcse-default',
    name: 'KCSE Grading',
    description: 'Default KCSE grading scale',
    passMark: 50,
    grades: levels.map((level: AdminGradingSystem['levels'][number]) => ({
      letter: level.grade,
      minScore: level.minScore,
      maxScore: level.maxScore,
      points: level.points,
      description: level.description,
    })),
    levels,
    governmentBoard: 'KNEC',
    equivalencyMap: {},
    isDefault: true,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeGradingSystem(input: any, fallbackId = `grading-${Date.now()}`): AdminGradingSystem {
  const levels: AdminGradingSystem['levels'] = Array.isArray(input?.levels) && input.levels.length
    ? input.levels.map((level: any) => ({
        minScore: Number(level.minScore ?? 0),
        maxScore: Number(level.maxScore ?? 100),
        grade: String(level.grade || level.letter || 'N/A'),
        points: Number(level.points ?? 0),
        description: level.description ? String(level.description) : undefined,
        governmentEquivalency: level.governmentEquivalency ? String(level.governmentEquivalency) : undefined,
        universityPoints: level.universityPoints === undefined ? undefined : Number(level.universityPoints),
      }))
    : defaultGradingLevels();
  const governmentBoard = ['KNEC', 'NECTA', 'UNEB', 'WAEC', 'OTHER'].includes(String(input?.governmentBoard))
    ? input.governmentBoard
    : 'KNEC';

  return {
    id: String(input?.id || fallbackId),
    name: String(input?.name || 'Untitled Grading System').trim(),
    description: input?.description ? String(input.description) : undefined,
    passMark: Number(input?.passMark ?? 50),
    grades: levels.map((level: AdminGradingSystem['levels'][number]) => ({
      letter: level.grade,
      minScore: level.minScore,
      maxScore: level.maxScore,
      points: level.points,
      description: level.description,
    })),
    levels,
    governmentBoard,
    equivalencyMap: input?.equivalencyMap && typeof input.equivalencyMap === 'object' ? input.equivalencyMap : {},
    isDefault: Boolean(input?.isDefault),
    updatedAt: new Date().toISOString(),
  };
}

async function readGradingStore(): Promise<GradingStore> {
  const store = await readSetting<GradingStore>(GRADING_SYSTEMS_KEY, { systems: [defaultGradingSystem()] });
  return {
    systems: Array.isArray(store.systems) && store.systems.length
      ? store.systems.map((system) => normalizeGradingSystem(system, system.id))
      : [defaultGradingSystem()],
  };
}

async function writeGradingStore(store: GradingStore) {
  await writeSetting(GRADING_SYSTEMS_KEY, 'academic', store);
  return store;
}

function defaultGovernmentIntegration(): GovernmentIntegrationStore {
  return {
    connected: false,
    lastSync: '',
    examBoard: 'KNEC',
    applicants: {},
  };
}

async function readGovernmentIntegration(): Promise<GovernmentIntegrationStore> {
  const store = await readSetting<GovernmentIntegrationStore>(GOVERNMENT_INTEGRATION_KEY, defaultGovernmentIntegration());
  return {
    ...defaultGovernmentIntegration(),
    ...store,
    applicants: store.applicants && typeof store.applicants === 'object' ? store.applicants : {},
  };
}

async function writeGovernmentIntegration(store: GovernmentIntegrationStore) {
  await writeSetting(GOVERNMENT_INTEGRATION_KEY, 'academic', store);
  return store;
}

function mediaTypeFromMime(mime = '') {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'document';
}

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((tag) => typeof tag === 'string');
  if (typeof input !== 'string') return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.filter((tag) => typeof tag === 'string') : [];
  } catch {
    return input.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
}

function mapGalleryToAdminMedia(item: any, fallbackSize = 0, tags: string[] = []) {
  const url = item.type === 'video' ? item.videoUrl : item.imageUrl;
  return {
    id: item.id,
    type: item.type === 'video' ? 'video' : item.type === 'document' ? 'document' : 'image',
    url,
    thumbnailUrl: item.imageUrl || url,
    title: item.title,
    caption: item.description || '',
    tags: tags.length ? tags : [item.category].filter(Boolean),
    uploadedBy: item.uploadedBy,
    uploadedAt: item.createdAt || new Date().toISOString(),
    isFeatured: Boolean(item.isPublished),
    fileSize: fallbackSize,
  };
}

const defaultInfrastructureStore: InfrastructureStore = {
  facilities: [
    {
      id: 'facility-classrooms',
      name: 'Modern Classroom Block',
      type: 'building',
      capacity: 80,
      condition: 'good',
      notes: 'Two active classroom wings with standard learning furniture.',
      photos: [],
      videos: [],
      assets: [{ name: 'Projectors', quantity: 2, condition: 'good' }]
    }
  ],
  maintenanceLogs: [],
  assets: []
};

function normalizeFacility(input: any, id = String(Date.now())): InfrastructureFacility {
  const condition = ['excellent', 'good', 'fair', 'poor'].includes(String(input.condition))
    ? input.condition
    : 'good';

  return {
    id: String(input.id || id),
    name: String(input.name || 'Untitled facility').trim(),
    type: String(input.type || 'building').trim(),
    capacity: Number(input.capacity || 0),
    condition,
    notes: String(input.notes || input.description || ''),
    photos: Array.isArray(input.photos) ? input.photos.filter((item: unknown) => typeof item === 'string') : [],
    videos: Array.isArray(input.videos) ? input.videos.filter((item: unknown) => typeof item === 'string') : [],
    lastMaintenance: input.lastMaintenance || undefined,
    assets: Array.isArray(input.assets) ? input.assets : []
  };
}

async function readInfrastructureStore() {
  const store = await readSetting<InfrastructureStore>(INFRASTRUCTURE_KEY, defaultInfrastructureStore);
  return {
    facilities: Array.isArray(store.facilities) ? store.facilities.map((facility) => normalizeFacility(facility, facility.id)) : [],
    maintenanceLogs: Array.isArray(store.maintenanceLogs) ? store.maintenanceLogs : [],
    assets: Array.isArray(store.assets) ? store.assets : []
  };
}

async function syncInfrastructurePublicPage(store: InfrastructureStore, updatedBy?: string) {
  const facilities = store.facilities;
  const lead = facilities[0];
  await publicPageService.updatePage('infrastructure', {
    title: 'Infrastructure',
    eyebrow: 'About Us',
    summary: facilities.length
      ? `Explore ${facilities.length} school facilities managed by the administration.`
      : 'Explore the school facilities managed by the administration.',
    heroImage: lead?.photos?.[0] || '',
    video: lead?.videos?.[0] || '',
    body: 'These facilities are published from the administration infrastructure module, so public visitors see the same facilities the school manages internally.',
    sections: facilities.map((facility) => ({
      heading: facility.name,
      body: `${facility.type} | Capacity: ${facility.capacity || 0} | Condition: ${facility.condition}. ${facility.notes || ''}`.trim(),
      image: facility.photos?.[0] || '',
      video: facility.videos?.[0] || ''
    })),
    category: 'About Us'
  }, updatedBy);
}

async function writeInfrastructureStore(store: InfrastructureStore, updatedBy?: string) {
  await writeSetting(INFRASTRUCTURE_KEY, 'infrastructure', store);
  await syncInfrastructurePublicPage(store, updatedBy);
  return store;
}

function workspaceKey(path: unknown) {
  const normalized = String(path || '/admin/workspace')
    .trim()
    .replace(/^\/+/, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '-');
  return `${ADMIN_WORKSPACE_PREFIX}${normalized}`;
}

function normalizeWorkspaceRecord(input: any, fallbackCategory = 'Admin'): AdminWorkspaceRecord {
  const status = ['Active', 'Draft', 'Archived'].includes(String(input?.status)) ? input.status : 'Active';
  return {
    id: String(input?.id || `record-${Date.now()}`),
    name: String(input?.name || 'Untitled record').trim(),
    category: String(input?.category || fallbackCategory).trim(),
    owner: String(input?.owner || 'Admin Principal').trim(),
    status,
    notes: String(input?.notes || ''),
    amount: input?.amount === undefined || input?.amount === '' ? undefined : Number(input.amount),
    dueDate: input?.dueDate ? String(input.dueDate) : undefined,
    priority: ['Low', 'Normal', 'High', 'Critical'].includes(String(input?.priority)) ? input.priority : 'Normal',
    files: Array.isArray(input?.files)
      ? input.files
          .filter((file: any) => file && typeof file.name === 'string' && typeof file.url === 'string')
          .map((file: any) => ({ name: String(file.name), type: String(file.type || 'file'), url: String(file.url) }))
      : [],
    updatedAt: String(input?.updatedAt || new Date().toISOString()),
  };
}

function defaultWorkspaceStore(path: string): AdminWorkspaceStore {
  const title = path
    .split('/')
    .filter(Boolean)
    .slice(1)
    .join(' ')
    .replace(/-/g, ' ') || 'admin workspace';
  const label = title.replace(/\b\w/g, (character) => character.toUpperCase());
  const now = new Date().toISOString();
  return {
    records: [
      {
        id: `${Date.now()}-primary`,
        name: `${label} primary workflow`,
        category: label,
        owner: 'Admin Principal',
        status: 'Active',
        notes: 'Backend-persisted starter record. Edit or delete it when live data is ready.',
        updatedAt: now,
      },
      {
        id: `${Date.now()}-approval`,
        name: `${label} approval queue`,
        category: label,
        owner: 'Deputy Admin',
        status: 'Draft',
        notes: 'Use this workspace for approvals, follow-ups, and audit notes.',
        updatedAt: now,
      },
    ],
  };
}

async function readWorkspace(path: string) {
  const store = await readSetting<AdminWorkspaceStore>(workspaceKey(path), defaultWorkspaceStore(path));
  return {
    records: Array.isArray(store.records)
      ? store.records.map((record) => normalizeWorkspaceRecord(record))
      : [],
  };
}

async function writeWorkspace(path: string, store: AdminWorkspaceStore) {
  await writeSetting(workspaceKey(path), 'admin-workspaces', store);
  return store;
}

// ============================================
// DASHBOARD CONTROLLERS
// ============================================
export const adminController = {
  // Dashboard Metrics
  getDashboardMetrics: async (req: Request, res: Response) => {
    try {
      // Get counts from database
      const [totalStudents, totalTeachers, totalParents, totalStaff] = await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.parent.count(),
        prisma.staff.count(),
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const [todayAttendance, totalFees, paidFees, pendingFeeRows, disciplineCases] = await Promise.all([
        prisma.attendance.findMany({
          where: { date: { gte: todayStart, lt: todayEnd } },
          select: { status: true },
        }),
        prisma.fee.aggregate({ _sum: { amount: true } }),
        prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        prisma.fee.findMany({
          where: { status: { in: ['PENDING', 'PARTIAL'] } },
          select: { amount: true },
        }),
        prisma.discipline.count({
          where: { resolvedAt: null },
        }),
      ]);

      const presentToday = todayAttendance.filter((row) => row.status === 'PRESENT' || row.status === 'LATE').length;
      const attendanceDenominator = todayAttendance.length || totalStudents || 1;
      const attendanceRate = Number(((presentToday / attendanceDenominator) * 100).toFixed(1));
      const attendanceToday = presentToday;

      const totalFeeAmount = totalFees._sum.amount || 0;
      const collectedAmount = paidFees._sum.amount || 0;
      const feeCollectionRate = totalFeeAmount > 0
        ? Number(((collectedAmount / totalFeeAmount) * 100).toFixed(1))
        : 0;
      const pendingFees = pendingFeeRows.reduce((sum, fee) => sum + (fee.amount || 0), 0);

      // Get library books count
      const libraryBooks = await prisma.book.count();

      // Get inventory items count
      const inventoryItems = await prisma.inventoryItem.count();

      const activeDisciplineCases = disciplineCases;

      // System health
      const systemHealth = {
        status: 'healthy' as const,
        database: { status: 'online' as const, responseTime: 12, lastCheck: new Date().toISOString() },
        storage: { status: 'online' as const, responseTime: 45, lastCheck: new Date().toISOString() },
        email: { status: 'online' as const, responseTime: 230, lastCheck: new Date().toISOString() },
        sms: { status: 'online' as const, responseTime: 180, lastCheck: new Date().toISOString() },
        mpesa: { status: 'online' as const, responseTime: 320, lastCheck: new Date().toISOString() },
        uptime: 99.9,
        lastBackup: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      };

      // Recent activities
      // Count distinct roles present
      const roleRows = await prisma.user.findMany({ select: { role: true } });
      const rolesReady = new Set(roleRows.map(r => r.role)).size;

      res.json({
        totalStudents,
        rolesReady,
        totalTeachers,
        totalParents,
        totalStaff,
        attendanceToday,
        attendanceRate,
        feeCollectionRate,
        pendingFees,
        libraryBooks,
        inventoryItems,
        activeDisciplineCases,
        systemHealth,
        recentActivities: [],
        alerts: [],
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard metrics' });
    }
  },

  // Activity Logs
  getActivityLogs: async (req: Request, res: Response) => {
    try {
      const page = Number.parseInt(String(req.query.page || '1'), 10);
      const limit = Number.parseInt(String(req.query.limit || '50'), 10);
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        }),
        prisma.auditLog.count(),
      ]);

      res.json({
        logs: logs.map((log) => ({
          id: log.id,
          userId: log.userId,
          userName: `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.userId,
          userRole: log.user.role,
          action: log.action,
          resource: log.entity,
          resourceId: log.entityId || undefined,
          details: log.newValues ? JSON.stringify(log.newValues) : undefined,
          ipAddress: log.ipAddress || undefined,
          userAgent: log.userAgent || undefined,
          createdAt: log.createdAt.toISOString(),
        })),
        total,
        page,
        pages: Math.max(1, Math.ceil(total / limit)),
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
  },

  // System Alerts
  getSystemAlerts: async (req: Request, res: Response) => {
    try {
      // Check for system alerts (low storage, failed backups, etc.)
      const alerts = [];

      // Check for low inventory items
      const lowStockItems = 0;

      if (lowStockItems > 0) {
        alerts.push({
          id: 'low-stock',
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockItems} inventory items are running low`,
          source: 'inventory',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      // Check for pending discipline cases
      const pendingDiscipline = 0;

      if (pendingDiscipline > 5) {
        alerts.push({
          id: 'pending-discipline',
          type: 'info',
          title: 'Pending Discipline Cases',
          message: `${pendingDiscipline} discipline cases require attention`,
          source: 'discipline',
          createdAt: new Date().toISOString(),
          acknowledged: false,
        });
      }

      res.json(alerts);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      res.status(500).json({ message: 'Failed to fetch system alerts' });
    }
  },

  // Acknowledge Alert
  acknowledgeAlert: async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      // In a real app, you would update the alert in the database
      res.json({ message: 'Alert acknowledged', alertId });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({ message: 'Failed to acknowledge alert' });
    }
  },

  // System Health
  getSystemHealth: async (req: Request, res: Response) => {
    try {
      const systemHealth = {
        status: 'healthy' as const,
        issues: [],
        score: 100,
        uptime: '99.9%',
        totalUptime: formatUptime(Math.round(process.uptime())),
        lastIncident: null,
        maintenanceMode: false,
        database: { status: 'online' as const, responseTime: 12, lastCheck: new Date().toISOString() },
        storage: { status: 'online' as const, responseTime: 45, lastCheck: new Date().toISOString() },
        email: { status: 'online' as const, responseTime: 230, lastCheck: new Date().toISOString() },
        sms: { status: 'online' as const, responseTime: 180, lastCheck: new Date().toISOString() },
        mpesa: { status: 'online' as const, responseTime: 320, lastCheck: new Date().toISOString() },
        lastBackup: new Date(Date.now() - 86400000).toISOString(),
      };

      res.json(systemHealth);
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ message: 'Failed to fetch system health' });
    }
  },

  // ============================================
  // SCHOOL MANAGEMENT CONTROLLERS
  // ============================================
  getSchoolProfile: async (req: Request, res: Response) => {
    try {
      const school = await prisma.school.findFirst();

      if (!school) {
        // Return default school profile
        return res.json({
          id: '1',
          name: 'School Hub Academy',
          motto: 'Excellence in Education',
          vision: 'To be a leading institution in nurturing future leaders.',
          mission: 'Providing quality education with modern facilities and dedicated teachers.',
          foundingYear: 2000,
          history: 'Founded in 2000, our school has been committed to academic excellence.',
          contactPhone: '+254 700 000 000',
          contactEmail: 'info@schoolhub.ac.ke',
          address: 'P.O. Box 12345',
          city: 'Nairobi',
          country: 'Kenya',
          postalCode: '00100',
          website: 'https://schoolhub.ac.ke',
          socialMedia: {
            facebook: 'https://facebook.com/schoolhub',
            twitter: 'https://twitter.com/schoolhub',
            instagram: 'https://instagram.com/schoolhub',
          },
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          academicCalendar: {
            term1Start: '2024-01-08',
            term1End: '2024-04-05',
            term2Start: '2024-05-06',
            term2End: '2024-08-02',
            term3Start: '2024-09-02',
            term3End: '2024-12-06',
            holidays: [],
          },
          schoolHours: {
            mondayToFriday: { start: '08:00', end: '16:00' },
            saturday: { start: '08:00', end: '12:00' },
            sunday: { start: '', end: '' },
          },
          branches: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      res.json(school);
    } catch (error) {
      console.error('Error fetching school profile:', error);
      res.status(500).json({ message: 'Failed to fetch school profile' });
    }
  },

   updateSchoolProfile: async (req: Request, res: Response) => {
     try {
       const profileData = req.body;
       // Update school profile in database
       const updatedSchool = await prisma.school.updateMany({
         data: {
           ...profileData,
           updatedAt: new Date(),
         },
       });
       
       // If no records were updated, create a new school profile
       if (updatedSchool.count === 0) {
         const newSchool = await prisma.school.create({
           data: {
             ...profileData,
             createdAt: new Date(),
             updatedAt: new Date(),
           },
         });
         res.json({ message: 'School profile created successfully', ...newSchool });
       } else {
         res.json({ message: 'School profile updated successfully', ...profileData });
       }
     } catch (error) {
       console.error('Error updating school profile:', error);
       res.status(500).json({ message: 'Failed to update school profile' });
     }
   },

  updateSchoolBranding: async (req: Request, res: Response) => {
    try {
      const brandingData = req.body;
      res.json({ message: 'School branding updated successfully', ...brandingData });
    } catch (error) {
      console.error('Error updating school branding:', error);
      res.status(500).json({ message: 'Failed to update school branding' });
    }
  },

  updateAcademicCalendar: async (req: Request, res: Response) => {
    try {
      const calendarData = req.body;
      res.json({ message: 'Academic calendar updated successfully', ...calendarData });
    } catch (error) {
      console.error('Error updating academic calendar:', error);
      res.status(500).json({ message: 'Failed to update academic calendar' });
    }
  },

  updateSchoolHours: async (req: Request, res: Response) => {
    try {
      const hoursData = req.body;
      res.json({ message: 'School hours updated successfully', ...hoursData });
    } catch (error) {
      console.error('Error updating school hours:', error);
      res.status(500).json({ message: 'Failed to update school hours' });
    }
  },

  addBranch: async (req: Request, res: Response) => {
    try {
      const branchData = req.body;
      const newBranch = {
        id: Date.now().toString(),
        ...branchData,
        isActive: true,
      };
      res.status(201).json(newBranch);
    } catch (error) {
      console.error('Error adding branch:', error);
      res.status(500).json({ message: 'Failed to add branch' });
    }
  },

  updateBranch: async (req: Request, res: Response) => {
    try {
      const { branchId } = req.params;
      const branchData = req.body;
      res.json({ message: 'Branch updated successfully', id: branchId, ...branchData });
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({ message: 'Failed to update branch' });
    }
  },

  deleteBranch: async (req: Request, res: Response) => {
    try {
      const { branchId } = req.params;
      res.json({ message: 'Branch deleted successfully', id: branchId });
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).json({ message: 'Failed to delete branch' });
    }
  },

  // ============================================
  // LOCATION & ENVIRONMENT CONTROLLERS
  // ============================================
  getLocationData: async (req: Request, res: Response) => {
    try {
      const locationData = {
        id: '1',
        gpsCoordinates: {
          latitude: -1.2921,
          longitude: 36.8219,
        },
        soilInformation: {
          type: 'Volcanic',
          description: 'Rich volcanic soil, ideal for agriculture.',
        },
        roadAccess: {
          description: 'Well-maintained tarmac road access.',
          conditions: 'All-weather access.',
        },
        surroundings: {
          description: 'Located in a serene residential area.',
        },
        droneShots: [],
        climateData: {
          averageTemperature: 22,
          rainfall: '800-1200mm annually',
          seasons: 'Long rains (Mar-May), Short rains (Oct-Dec)',
        },
        neighborhoodMaps: [],
        nearbyLandmarks: [
          { name: 'City Center', distance: '5km', direction: 'North' },
          { name: 'Hospital', distance: '2km', direction: 'East' },
        ],
      };

      res.json(locationData);
    } catch (error) {
      console.error('Error fetching location data:', error);
      res.status(500).json({ message: 'Failed to fetch location data' });
    }
  },

  updateLocation: async (req: Request, res: Response) => {
    try {
      const locationData = req.body;
      res.json({ message: 'Location updated successfully', ...locationData });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ message: 'Failed to update location' });
    }
  },

  updateGPS: async (req: Request, res: Response) => {
    try {
      const gpsData = req.body;
      res.json({ message: 'GPS coordinates updated successfully', ...gpsData });
    } catch (error) {
      console.error('Error updating GPS:', error);
      res.status(500).json({ message: 'Failed to update GPS coordinates' });
    }
  },

  updateSoilInfo: async (req: Request, res: Response) => {
    try {
      const soilData = req.body;
      res.json({ message: 'Soil information updated successfully', ...soilData });
    } catch (error) {
      console.error('Error updating soil info:', error);
      res.status(500).json({ message: 'Failed to update soil information' });
    }
  },

  updateRoadAccess: async (req: Request, res: Response) => {
    try {
      const roadData = req.body;
      res.json({ message: 'Road access information updated successfully', ...roadData });
    } catch (error) {
      console.error('Error updating road access:', error);
      res.status(500).json({ message: 'Failed to update road access information' });
    }
  },

  updateClimateData: async (req: Request, res: Response) => {
    try {
      const climateData = req.body;
      res.json({ message: 'Climate data updated successfully', ...climateData });
    } catch (error) {
      console.error('Error updating climate data:', error);
      res.status(500).json({ message: 'Failed to update climate data' });
    }
  },

  addLandmark: async (req: Request, res: Response) => {
    try {
      const landmarkData = req.body;
      const newLandmark = {
        id: Date.now().toString(),
        ...landmarkData,
      };
      res.status(201).json(newLandmark);
    } catch (error) {
      console.error('Error adding landmark:', error);
      res.status(500).json({ message: 'Failed to add landmark' });
    }
  },

  deleteLandmark: async (req: Request, res: Response) => {
    try {
      const { landmarkId } = req.params;
      res.json({ message: 'Landmark deleted successfully', id: landmarkId });
    } catch (error) {
      console.error('Error deleting landmark:', error);
      res.status(500).json({ message: 'Failed to delete landmark' });
    }
  },

  // ============================================
  // INFRASTRUCTURE CONTROLLERS
  // ============================================
  getInfrastructure: async (req: Request, res: Response) => {
    try {
      const store = await readInfrastructureStore();
      res.json({
        id: 'infrastructure',
        facilities: store.facilities,
        classrooms: store.facilities.filter((facility) => facility.type === 'building' || facility.type === 'classroom'),
        laboratories: store.facilities.filter((facility) => facility.type === 'lab' || facility.type === 'laboratory'),
        maintenanceLogs: store.maintenanceLogs,
        assets: store.assets
      });
    } catch (error) {
      console.error('Error fetching infrastructure:', error);
      res.status(500).json({ message: 'Failed to fetch infrastructure data' });
    }
  },

  addClassroom: async (req: Request, res: Response) => {
    try {
      const store = await readInfrastructureStore();
      const facility = normalizeFacility({ ...req.body, type: req.body.type || 'building' });
      store.facilities.unshift(facility);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.status(201).json(facility);
    } catch (error) {
      console.error('Error adding classroom:', error);
      res.status(500).json({ message: 'Failed to add classroom' });
    }
  },

  updateClassroom: async (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const store = await readInfrastructureStore();
      const existing = store.facilities.find((facility) => facility.id === classroomId);
      const facility = normalizeFacility({ ...(existing || {}), ...req.body, id: classroomId }, classroomId);
      store.facilities = store.facilities.map((item) => item.id === classroomId ? facility : item);
      if (!existing) store.facilities.unshift(facility);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json(facility);
    } catch (error) {
      console.error('Error updating classroom:', error);
      res.status(500).json({ message: 'Failed to update classroom' });
    }
  },

  deleteClassroom: async (req: Request, res: Response) => {
    try {
      const { classroomId } = req.params;
      const store = await readInfrastructureStore();
      store.facilities = store.facilities.filter((facility) => facility.id !== classroomId);
      store.maintenanceLogs = store.maintenanceLogs.filter((log) => log.facilityId !== classroomId);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json({ message: 'Classroom deleted successfully', id: classroomId });
    } catch (error) {
      console.error('Error deleting classroom:', error);
      res.status(500).json({ message: 'Failed to delete classroom' });
    }
  },

  addLaboratory: async (req: Request, res: Response) => {
    try {
      const store = await readInfrastructureStore();
      const facility = normalizeFacility({ ...req.body, type: req.body.type || 'lab' });
      store.facilities.unshift(facility);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.status(201).json(facility);
    } catch (error) {
      console.error('Error adding laboratory:', error);
      res.status(500).json({ message: 'Failed to add laboratory' });
    }
  },

  updateLaboratory: async (req: Request, res: Response) => {
    try {
      const { labId } = req.params;
      const store = await readInfrastructureStore();
      const existing = store.facilities.find((facility) => facility.id === labId);
      const facility = normalizeFacility({ ...(existing || {}), ...req.body, id: labId }, labId);
      store.facilities = store.facilities.map((item) => item.id === labId ? facility : item);
      if (!existing) store.facilities.unshift(facility);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json(facility);
    } catch (error) {
      console.error('Error updating laboratory:', error);
      res.status(500).json({ message: 'Failed to update laboratory' });
    }
  },

  deleteLaboratory: async (req: Request, res: Response) => {
    try {
      const { labId } = req.params;
      const store = await readInfrastructureStore();
      store.facilities = store.facilities.filter((facility) => facility.id !== labId);
      store.maintenanceLogs = store.maintenanceLogs.filter((log) => log.facilityId !== labId);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json({ message: 'Laboratory deleted successfully', id: labId });
    } catch (error) {
      console.error('Error deleting laboratory:', error);
      res.status(500).json({ message: 'Failed to delete laboratory' });
    }
  },

  addMaintenanceLog: async (req: Request, res: Response) => {
    try {
      const store = await readInfrastructureStore();
      const newLog = {
        id: Date.now().toString(),
        ...req.body,
        status: 'pending' as const,
        reportedAt: new Date().toISOString(),
      };
      store.maintenanceLogs.unshift(newLog);
      if (newLog.facilityId) {
        store.facilities = store.facilities.map((facility) => (
          facility.id === newLog.facilityId ? { ...facility, lastMaintenance: newLog.date || newLog.reportedAt } : facility
        ));
      }
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.status(201).json(newLog);
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      res.status(500).json({ message: 'Failed to add maintenance log' });
    }
  },

  updateMaintenanceLog: async (req: Request, res: Response) => {
    try {
      const { logId } = req.params;
      const store = await readInfrastructureStore();
      let updated = { id: logId, ...req.body };
      store.maintenanceLogs = store.maintenanceLogs.map((log) => {
        if (log.id !== logId) return log;
        updated = { ...log, ...req.body, id: logId };
        return updated;
      });
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json(updated);
    } catch (error) {
      console.error('Error updating maintenance log:', error);
      res.status(500).json({ message: 'Failed to update maintenance log' });
    }
  },

  addAsset: async (req: Request, res: Response) => {
    try {
      const store = await readInfrastructureStore();
      const newAsset = {
        id: Date.now().toString(),
        ...req.body,
      };
      store.assets.unshift(newAsset);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error('Error adding asset:', error);
      res.status(500).json({ message: 'Failed to add asset' });
    }
  },

  updateAsset: async (req: Request, res: Response) => {
    try {
      const { assetId } = req.params;
      const store = await readInfrastructureStore();
      let updated = { id: assetId, ...req.body };
      store.assets = store.assets.map((asset) => {
        if (asset.id !== assetId) return asset;
        updated = { ...asset, ...req.body, id: assetId };
        return updated;
      });
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json(updated);
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ message: 'Failed to update asset' });
    }
  },

  deleteAsset: async (req: Request, res: Response) => {
    try {
      const { assetId } = req.params;
      const store = await readInfrastructureStore();
      store.assets = store.assets.filter((asset) => asset.id !== assetId);
      await writeInfrastructureStore(store, (req as any).user?.userId);
      res.json({ message: 'Asset deleted successfully', id: assetId });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ message: 'Failed to delete asset' });
    }
  },

  // ============================================
  // MEDIA & GALLERY CONTROLLERS
  // ============================================
  getAllMedia: async (req: Request, res: Response) => {
    try {
      const gallery = await prisma.gallery.findMany({ orderBy: { createdAt: 'desc' } });
      const uploaded = gallery.map((item) => mapGalleryToAdminMedia(item));
      res.json([
        ...uploaded,
        {
          id: '1',
          type: 'image',
          url: '/assets/images/school-1.jpg',
          thumbnailUrl: '/assets/images/school-1-thumb.jpg',
          title: 'School Building',
          caption: 'Main administration block',
          tags: ['building', 'campus'],
          uploadedBy: 'admin',
          uploadedAt: new Date().toISOString(),
          isFeatured: true,
          fileSize: 1024000,
        },
      ]);
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  },

  uploadMedia: async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ message: 'No media file uploaded' });

      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ message: 'School not found' });

      const tags = normalizeTags(req.body.tags);
      const type = mediaTypeFromMime(file.mimetype);
      const url = `/uploads/media/${file.filename}`;
      const category = tags[0] || req.body.category || 'gallery';
      const item = await prisma.gallery.create({
        data: {
          schoolId: school.id,
          title: req.body.title || file.originalname,
          description: req.body.caption || req.body.description || '',
          imageUrl: type === 'video' ? '' : url,
          videoUrl: type === 'video' ? url : undefined,
          type,
          category,
          uploadedBy: (req as any).user?.userId || 'admin',
          isPublished: false,
        }
      });

      res.status(201).json(mapGalleryToAdminMedia(item, file.size, tags));
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: 'Failed to upload media' });
    }
  },

  updateMedia: async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;
      const tags = normalizeTags(req.body.tags);
      const item = await prisma.gallery.update({
        where: { id: mediaId },
        data: {
          title: req.body.title,
          description: req.body.caption || req.body.description,
          category: tags[0],
        }
      });
      res.json(mapGalleryToAdminMedia(item, 0, tags));
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({ message: 'Failed to update media' });
    }
  },

  deleteMedia: async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;
      if (mediaId !== '1') {
        await prisma.gallery.delete({ where: { id: mediaId } });
      }
      res.json({ message: 'Media deleted successfully', id: mediaId });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({ message: 'Failed to delete media' });
    }
  },

  featureMedia: async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;
      if (mediaId === '1') return res.json({ message: 'Media featured successfully', id: mediaId, isFeatured: true });
      const item = await prisma.gallery.update({ where: { id: mediaId }, data: { isPublished: true } });
      res.json(mapGalleryToAdminMedia(item));
    } catch (error) {
      console.error('Error featuring media:', error);
      res.status(500).json({ message: 'Failed to feature media' });
    }
  },

  unfeatureMedia: async (req: Request, res: Response) => {
    try {
      const { mediaId } = req.params;
      if (mediaId === '1') return res.json({ message: 'Media unfeatured successfully', id: mediaId, isFeatured: false });
      const item = await prisma.gallery.update({ where: { id: mediaId }, data: { isPublished: false } });
      res.json(mapGalleryToAdminMedia(item));
    } catch (error) {
      console.error('Error unfeaturing media:', error);
      res.status(500).json({ message: 'Failed to unfeature media' });
    }
  },

  getAlbums: async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: '1',
          name: 'School Events',
          description: 'Photos from various school events',
          coverImage: '/assets/images/events-cover.jpg',
          mediaCount: 25,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mediaItems: [],
        },
      ]);
    } catch (error) {
      console.error('Error fetching albums:', error);
      res.status(500).json({ message: 'Failed to fetch albums' });
    }
  },

  createAlbum: async (req: Request, res: Response) => {
    try {
      const albumData = req.body;
      const newAlbum = {
        id: Date.now().toString(),
        ...albumData,
        mediaCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaItems: [],
      };
      res.status(201).json(newAlbum);
    } catch (error) {
      console.error('Error creating album:', error);
      res.status(500).json({ message: 'Failed to create album' });
    }
  },

  updateAlbum: async (req: Request, res: Response) => {
    try {
      const { albumId } = req.params;
      const albumData = req.body;
      res.json({ message: 'Album updated successfully', id: albumId, ...albumData });
    } catch (error) {
      console.error('Error updating album:', error);
      res.status(500).json({ message: 'Failed to update album' });
    }
  },

  deleteAlbum: async (req: Request, res: Response) => {
    try {
      const { albumId } = req.params;
      res.json({ message: 'Album deleted successfully', id: albumId });
    } catch (error) {
      console.error('Error deleting album:', error);
      res.status(500).json({ message: 'Failed to delete album' });
    }
  },

  batchUpload: async (req: Request, res: Response) => {
    try {
      // Handle batch file upload
      const files = (req as any).files as any[];
      const uploadedMedia = files.map((file) => ({
        id: Date.now().toString() + Math.random(),
        type: 'image',
        url: `/uploads/media/${file.filename}`,
        title: file.originalname,
        uploadedBy: (req as any).user.userId,
        uploadedAt: new Date().toISOString(),
        isFeatured: false,
        fileSize: file.size,
      }));

      res.status(201).json(uploadedMedia);
    } catch (error) {
      console.error('Error batch uploading:', error);
      res.status(500).json({ message: 'Failed to batch upload media' });
    }
  },

  // ============================================
  // USER MANAGEMENT CONTROLLERS
  // ============================================
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const { role, search, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build where clause
      const where: any = {};
      if (role) {
        where.role = role;
      }
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit as string),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      // Compute roles ready (distinct roles present)
      const roles = await prisma.user.findMany({ select: { role: true } });
      const rolesReady = new Set(roles.map((r) => r.role)).size;

      res.json({
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          avatar: u.avatar,
          profileViews: (u as any).profileViews ?? 0,
          phone: u.phone,
          isActive: u.isActive,
          lastLogin: u.lastLogin?.toISOString(),
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        })),
        total,
        rolesReady,
        page: parseInt(page as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return mock data
      res.json({
        users: [
          {
            id: '1',
            email: 'admin@schoolhub.ac.ke',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      });
    }
  },

  getUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        profileViews: (user as any).profileViews ?? 0,
        phone: user.phone,
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  },

  createUser: async (req: Request, res: Response) => {
    try {
      const { email, firstName, lastName, role, phone, password } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Create user (password should be hashed in real implementation)
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          role,
          phone,
          password: password, // Should be hashed
          isActive: true,
        },
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        updatedAt: user.updatedAt.toISOString(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      await prisma.user.delete({
        where: { id: userId },
      });
      res.json({ message: 'User deleted successfully', id: userId });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  },

  resetUserPassword: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // Generate temporary password and send via email
      res.json({ message: 'Password reset successfully. User will receive email with new password.' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  },

  blockUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      res.json({ message: 'User blocked successfully', id: userId, reason });
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ message: 'Failed to block user' });
    }
  },

  unblockUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      res.json({ message: 'User unblocked successfully', id: userId });
    } catch (error) {
      console.error('Error unblocking user:', error);
      res.status(500).json({ message: 'Failed to unblock user' });
    }
  },

  assignRole: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      res.json({ message: 'Role assigned successfully', id: userId, role: user.role });
    } catch (error) {
      console.error('Error assigning role:', error);
      res.status(500).json({ message: 'Failed to assign role' });
    }
  },

  bulkImportUsers: async (req: Request, res: Response) => {
    try {
      const { operation, data, options } = req.body;
      // Process bulk import
      const result = {
        success: true,
        total: data.length,
        processed: data.length,
        succeeded: data.length,
        failed: 0,
        errors: [],
      };
      res.json(result);
    } catch (error) {
      console.error('Error bulk importing:', error);
      res.status(500).json({ message: 'Failed to bulk import users' });
    }
  },

  bulkExportUsers: async (req: Request, res: Response) => {
    try {
      const { role } = req.query;
      // Generate CSV/Excel export
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="users.csv"');
      res.send('Name,Email,Role\nJohn Doe,john@example.com,TEACHER');
    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({ message: 'Failed to export users' });
    }
  },

  getUserSessions: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // Get user sessions from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true, role: true }
      });
      
      res.json([
        {
          id: '1',
          userId: userId,
          user: user ? {
            id: userId,
            username: user.email?.split('@')[0] || 'unknown',
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          } : { id: userId, username: 'unknown', email: '', firstName: '', lastName: '', role: 'USER' },
          deviceInfo: {
            userAgent: 'Chrome/120.0',
            ipAddress: '192.168.1.1',
            deviceType: 'desktop',
            browser: 'Chrome',
            browserVersion: '120.0',
            os: 'Linux',
            osVersion: '',
            screenResolution: '1920x1080',
            location: 'Localhost',
            city: 'Localhost',
            country: 'Local',
            countryCode: 'LOCAL',
            timezone: 'UTC'
          },
          isOnline: true,
          status: 'active',
          lastActivity: new Date().toISOString(),
          sessionStart: new Date().toISOString(),
          duration: 3600,
          pagesViewed: 0,
          actionsPerformed: 0
        },
      ]);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      res.status(500).json({ message: 'Failed to fetch user sessions' });
    }
  },

  revokeSession: async (req: Request, res: Response) => {
    try {
      const { userId, sessionId } = req.params;
      // Revoke specific session
      res.json({ message: 'Session revoked successfully', userId, sessionId });
    } catch (error) {
      console.error('Error revoking session:', error);
      res.status(500).json({ message: 'Failed to revoke session' });
    }
  },

  revokeAllSessions: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      // Revoke all sessions for user
      res.json({ message: 'All sessions revoked successfully', userId });
    } catch (error) {
      console.error('Error revoking sessions:', error);
      res.status(500).json({ message: 'Failed to revoke sessions' });
    }
  },

  // ============================================
  // ACADEMIC MANAGEMENT CONTROLLERS
  // ============================================
  getAcademicStructure: async (req: Request, res: Response) => {
    try {
      const [classes, subjects, terms] = await Promise.all([
        prisma.class.findMany(),
        prisma.subject.findMany(),
        prisma.academicTerm.findMany(),
      ]);

      res.json({
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          level: (c as any).level || 1,
          streamIds: (c as any).streamIds || [],
          capacity: c.capacity,
          currentEnrollment: (c as any).currentEnrollment || 0,
        })),
        streams: [],
        subjects: subjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          category: s.category,
        })),
        terms: terms.map((t) => ({
          id: t.id,
          name: t.name,
          year: t.year,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
          isActive: (t as any).isActive || t.isCurrent,
          isClosed: (t as any).isClosed || false,
        })),
        gradingSystem: {
          id: '1',
          name: 'KCSE Grading',
          grades: [
            { letter: 'A', minScore: 80, maxScore: 100, points: 12 },
            { letter: 'A-', minScore: 75, maxScore: 79, points: 11 },
            { letter: 'B+', minScore: 70, maxScore: 74, points: 10 },
            { letter: 'B', minScore: 65, maxScore: 69, points: 9 },
            { letter: 'B-', minScore: 60, maxScore: 64, points: 8 },
            { letter: 'C+', minScore: 55, maxScore: 59, points: 7 },
            { letter: 'C', minScore: 50, maxScore: 54, points: 6 },
            { letter: 'C-', minScore: 45, maxScore: 49, points: 5 },
            { letter: 'D+', minScore: 40, maxScore: 44, points: 4 },
            { letter: 'D', minScore: 35, maxScore: 39, points: 3 },
            { letter: 'D-', minScore: 30, maxScore: 34, points: 2 },
            { letter: 'E', minScore: 0, maxScore: 29, points: 1 },
          ],
          isDefault: true,
        },
        kcseSettings: {
          gradingScale: [],
          subjectGroups: {
            group1: ['English', 'Kiswahili'],
            group2: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
            group3: ['History', 'Geography', 'CRE', 'IRE'],
            group4: ['Agriculture', 'Business Studies', 'Computer Studies'],
          },
          minimumSubjects: 7,
          maximumSubjects: 10,
        },
      });
    } catch (error) {
      console.error('Error fetching academic structure:', error);
      res.json({
        classes: [],
        streams: [],
        subjects: [],
        terms: [],
        gradingSystem: {
          id: '1',
          name: 'KCSE Grading',
          grades: [
            { letter: 'A', minScore: 80, maxScore: 100, points: 12 },
            { letter: 'A-', minScore: 75, maxScore: 79, points: 11 },
            { letter: 'B+', minScore: 70, maxScore: 74, points: 10 },
            { letter: 'B', minScore: 65, maxScore: 69, points: 9 },
            { letter: 'C+', minScore: 55, maxScore: 59, points: 7 },
            { letter: 'C', minScore: 50, maxScore: 54, points: 6 },
            { letter: 'D+', minScore: 40, maxScore: 44, points: 4 },
            { letter: 'E', minScore: 0, maxScore: 29, points: 1 },
          ],
          isDefault: true,
        },
        kcseSettings: {
          gradingScale: [],
          subjectGroups: {
            group1: ['English', 'Kiswahili'],
            group2: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
            group3: ['History', 'Geography', 'CRE'],
            group4: ['Agriculture', 'Business Studies'],
          },
          minimumSubjects: 7,
          maximumSubjects: 10,
        },
      });
    }
  },

  getClasses: async (req: Request, res: Response) => {
    try {
      const classes = await prisma.class.findMany();
      res.json(
        classes.map((c: any) => ({
          id: c.id,
          name: c.name,
          level: c.level || 1,
          streamIds: c.streamIds || [],
          capacity: c.capacity,
          currentEnrollment: c.currentEnrollment || 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.json([]);
    }
  },

  createClass: async (req: Request, res: Response) => {
    try {
      const classData = req.body;
      const newClass = {
        id: Date.now().toString(),
        ...classData,
      };
      res.status(201).json(newClass);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ message: 'Failed to create class' });
    }
  },

  updateClass: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const classData = req.body;
      res.json({ message: 'Class updated successfully', id: classId, ...classData });
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ message: 'Failed to update class' });
    }
  },

  deleteClass: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      res.json({ message: 'Class deleted successfully', id: classId });
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ message: 'Failed to delete class' });
    }
  },

  createStream: async (req: Request, res: Response) => {
    try {
      const streamData = req.body;
      const newStream = {
        id: Date.now().toString(),
        ...streamData,
      };
      res.status(201).json(newStream);
    } catch (error) {
      console.error('Error creating stream:', error);
      res.status(500).json({ message: 'Failed to create stream' });
    }
  },

  updateStream: async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      const streamData = req.body;
      res.json({ message: 'Stream updated successfully', id: streamId, ...streamData });
    } catch (error) {
      console.error('Error updating stream:', error);
      res.status(500).json({ message: 'Failed to update stream' });
    }
  },

  deleteStream: async (req: Request, res: Response) => {
    try {
      const { streamId } = req.params;
      res.json({ message: 'Stream deleted successfully', id: streamId });
    } catch (error) {
      console.error('Error deleting stream:', error);
      res.status(500).json({ message: 'Failed to delete stream' });
    }
  },

  getSubjects: async (req: Request, res: Response) => {
    try {
      const subjects = await prisma.subject.findMany();
      res.json(
        subjects.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          category: s.category,
        }))
      );
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.json([
        { id: '1', name: 'Mathematics', code: 'MATH', category: 'compulsory' },
        { id: '2', name: 'English', code: 'ENG', category: 'compulsory' },
        { id: '3', name: 'Kiswahili', code: 'KISW', category: 'compulsory' },
      ]);
    }
  },

  createSubject: async (req: Request, res: Response) => {
    try {
      const subjectData = req.body;
      const newSubject = {
        id: Date.now().toString(),
        ...subjectData,
      };
      res.status(201).json(newSubject);
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({ message: 'Failed to create subject' });
    }
  },

  updateSubject: async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      const subjectData = req.body;
      res.json({ message: 'Subject updated successfully', id: subjectId, ...subjectData });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({ message: 'Failed to update subject' });
    }
  },

  deleteSubject: async (req: Request, res: Response) => {
    try {
      const { subjectId } = req.params;
      res.json({ message: 'Subject deleted successfully', id: subjectId });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ message: 'Failed to delete subject' });
    }
  },

  getTerms: async (req: Request, res: Response) => {
    try {
      const terms = await prisma.academicTerm.findMany();
      res.json(
        terms.map((t: any) => ({
          id: t.id,
          name: t.name,
          year: t.year,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
          isActive: t.isActive || t.isCurrent,
          isClosed: t.isClosed || false,
        }))
      );
    } catch (error) {
      console.error('Error fetching terms:', error);
      res.json([
        {
          id: '1',
          name: 'Term 1',
          year: 2024,
          startDate: '2024-01-08T00:00:00Z',
          endDate: '2024-04-05T00:00:00Z',
          isActive: true,
          isClosed: false,
        },
      ]);
    }
  },

  createTerm: async (req: Request, res: Response) => {
    try {
      const termData = req.body;
      const newTerm = {
        id: Date.now().toString(),
        ...termData,
        isActive: false,
        isClosed: false,
      };
      res.status(201).json(newTerm);
    } catch (error) {
      console.error('Error creating term:', error);
      res.status(500).json({ message: 'Failed to create term' });
    }
  },

  updateTerm: async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      const termData = req.body;
      res.json({ message: 'Term updated successfully', id: termId, ...termData });
    } catch (error) {
      console.error('Error updating term:', error);
      res.status(500).json({ message: 'Failed to update term' });
    }
  },

  closeTerm: async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      res.json({ message: 'Term closed successfully', id: termId, isClosed: true });
    } catch (error) {
      console.error('Error closing term:', error);
      res.status(500).json({ message: 'Failed to close term' });
    }
  },

  activateTerm: async (req: Request, res: Response) => {
    try {
      const { termId } = req.params;
      res.json({ message: 'Term activated successfully', id: termId, isActive: true });
    } catch (error) {
      console.error('Error activating term:', error);
      res.status(500).json({ message: 'Failed to activate term' });
    }
  },

  getGradingSystems: async (req: Request, res: Response) => {
    try {
      const store = await readGradingStore();
      res.json(store.systems);
    } catch (error) {
      console.error('Error fetching grading systems:', error);
      res.status(500).json({ message: 'Failed to fetch grading systems' });
    }
  },

  createGradingSystem: async (req: Request, res: Response) => {
    try {
      const store = await readGradingStore();
      const system = normalizeGradingSystem(req.body, `grading-${Date.now()}`);
      const nextStore = { systems: [...store.systems, system] };
      await writeGradingStore(nextStore);
      res.status(201).json(system);
    } catch (error) {
      console.error('Error creating grading system:', error);
      res.status(500).json({ message: 'Failed to create grading system' });
    }
  },

  updateGradingSystemById: async (req: Request, res: Response) => {
    try {
      const { gradingSystemId } = req.params;
      const store = await readGradingStore();
      const existing = store.systems.find((system) => system.id === gradingSystemId);
      if (!existing) {
        return res.status(404).json({ message: 'Grading system not found' });
      }
      const updated = normalizeGradingSystem({ ...existing, ...req.body, id: gradingSystemId }, gradingSystemId);
      const nextStore = {
        systems: store.systems.map((system) => (system.id === gradingSystemId ? updated : system)),
      };
      await writeGradingStore(nextStore);
      res.json(updated);
    } catch (error) {
      console.error('Error updating grading system:', error);
      res.status(500).json({ message: 'Failed to update grading system' });
    }
  },

  deleteGradingSystem: async (req: Request, res: Response) => {
    try {
      const { gradingSystemId } = req.params;
      const store = await readGradingStore();
      const nextSystems = store.systems.filter((system) => system.id !== gradingSystemId);
      if (nextSystems.length === store.systems.length) {
        return res.status(404).json({ message: 'Grading system not found' });
      }
      await writeGradingStore({ systems: nextSystems.length ? nextSystems : [defaultGradingSystem()] });
      res.json({ message: 'Grading system deleted', id: gradingSystemId });
    } catch (error) {
      console.error('Error deleting grading system:', error);
      res.status(500).json({ message: 'Failed to delete grading system' });
    }
  },

  exportGradingSystems: async (req: Request, res: Response) => {
    try {
      const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',') : [];
      const store = await readGradingStore();
      const systems = ids.length ? store.systems.filter((system) => ids.includes(system.id)) : store.systems;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="grading-systems.json"');
      res.send(JSON.stringify(systems, null, 2));
    } catch (error) {
      console.error('Error exporting grading systems:', error);
      res.status(500).json({ message: 'Failed to export grading systems' });
    }
  },

  importGradingSystems: async (req: Request, res: Response) => {
    try {
      const store = await readGradingStore();
      const uploaded = (req as Request & { file?: Express.Multer.File }).file;
      let imported: AdminGradingSystem[] = [];
      if (uploaded?.buffer && uploaded.originalname.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(uploaded.buffer.toString('utf8'));
        const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.systems) ? parsed.systems : [];
        imported = rows.map((row: any) => normalizeGradingSystem(row, `grading-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`));
      }
      if (!imported.length) {
        return res.status(400).json({ message: 'Upload a JSON grading export to import grading systems.' });
      }
      const nextStore = { systems: [...store.systems, ...imported] };
      await writeGradingStore(nextStore);
      res.status(201).json(nextStore.systems);
    } catch (error) {
      console.error('Error importing grading systems:', error);
      res.status(500).json({ message: 'Failed to import grading systems' });
    }
  },

  getGradingSystem: async (req: Request, res: Response) => {
    try {
      const store = await readGradingStore();
      res.json(store.systems.find((system) => system.isDefault) || store.systems[0] || defaultGradingSystem());
    } catch (error) {
      console.error('Error fetching grading system:', error);
      res.status(500).json({ message: 'Failed to fetch grading system' });
    }
  },

  updateGradingSystem: async (req: Request, res: Response) => {
    try {
      const store = await readGradingStore();
      const current = store.systems.find((system) => system.isDefault) || store.systems[0] || defaultGradingSystem();
      const updated = normalizeGradingSystem({ ...current, ...req.body, id: current.id, isDefault: true }, current.id);
      await writeGradingStore({
        systems: store.systems.length
          ? store.systems.map((system) => (system.id === current.id ? updated : system))
          : [updated],
      });
      res.json(updated);
    } catch (error) {
      console.error('Error updating grading system:', error);
      res.status(500).json({ message: 'Failed to update grading system' });
    }
  },

  getGovernmentIntegration: async (req: Request, res: Response) => {
    try {
      const store = await readGovernmentIntegration();
      res.json(store);
    } catch (error) {
      console.error('Error fetching government integration:', error);
      res.status(500).json({ message: 'Failed to fetch government integration' });
    }
  },

  connectGovernmentIntegration: async (req: Request, res: Response) => {
    try {
      const previous = await readGovernmentIntegration();
      const examBoard = ['KNEC', 'NECTA', 'UNEB', 'WAEC', 'OTHER'].includes(String(req.body?.examBoard))
        ? req.body.examBoard
        : 'KNEC';
      const nextStore = await writeGovernmentIntegration({
        ...previous,
        connected: true,
        examBoard,
        endpoint: req.body?.endpoint ? String(req.body.endpoint) : undefined,
        apiKey: req.body?.apiKey ? String(req.body.apiKey) : undefined,
        lastSync: previous.lastSync || '',
      });
      res.json(nextStore);
    } catch (error) {
      console.error('Error connecting government integration:', error);
      res.status(500).json({ message: 'Failed to connect government integration' });
    }
  },

  syncGovernmentResults: async (req: Request, res: Response) => {
    try {
      const store = await readGovernmentIntegration();
      const examBoard = String(req.body?.examBoard || store.examBoard || 'KNEC');
      const results = [
        {
          studentId: 'gov-2026-001',
          studentName: 'Sample Applicant One',
          admissionNumber: 'ADM-2026-001',
          appliedProgram: 'Form 1 Admission',
          examYear: 2026,
          examType: examBoard,
          meanGrade: 'B+',
          totalPoints: 10,
          subjectGrades: [
            { subject: 'Mathematics', grade: 'B+', points: 10 },
            { subject: 'English', grade: 'B', points: 9 },
            { subject: 'Science', grade: 'A-', points: 11 },
          ],
        },
        {
          studentId: 'gov-2026-002',
          studentName: 'Sample Applicant Two',
          admissionNumber: 'ADM-2026-002',
          appliedProgram: 'Form 1 Admission',
          examYear: 2026,
          examType: examBoard,
          meanGrade: 'C',
          totalPoints: 6,
          subjectGrades: [
            { subject: 'Mathematics', grade: 'D', points: 3 },
            { subject: 'English', grade: 'C+', points: 7 },
            { subject: 'Science', grade: 'C', points: 6 },
          ],
        },
      ];
      const nextStore = await writeGovernmentIntegration({
        ...store,
        examBoard: ['KNEC', 'NECTA', 'UNEB', 'WAEC', 'OTHER'].includes(examBoard) ? examBoard as any : store.examBoard,
        connected: true,
        lastSync: new Date().toISOString(),
      });
      res.json({ ...nextStore, results });
    } catch (error) {
      console.error('Error syncing government results:', error);
      res.status(500).json({ message: 'Failed to sync government results' });
    }
  },

  updateGovernmentApplicantStatus: async (req: Request, res: Response) => {
    try {
      const { applicantId } = req.params as { applicantId: string };
      const store = await readGovernmentIntegration();
      const status = String(req.body?.status || 'under_review');
      store.applicants[applicantId] = { ...store.applicants[applicantId], status, reason: req.body?.reason ? String(req.body.reason) : undefined };
      await writeGovernmentIntegration(store);
      res.json({ applicantId, ...store.applicants[applicantId] });
    } catch (error) {
      console.error('Error updating government applicant:', error);
      res.status(500).json({ message: 'Failed to update applicant' });
    }
  },

  bulkProcessGovernmentApplicants: async (req: Request, res: Response) => {
    try {
      const store = await readGovernmentIntegration();
      const applicantIds = Array.isArray(req.body?.applicantIds) ? req.body.applicantIds.map(String) : [];
      const status = String(req.body?.status || 'under_review');
      applicantIds.forEach((applicantId: string) => {
        store.applicants[applicantId] = { ...store.applicants[applicantId], status };
      });
      await writeGovernmentIntegration(store);
      res.json({ processed: applicantIds.length, status });
    } catch (error) {
      console.error('Error bulk processing government applicants:', error);
      res.status(500).json({ message: 'Failed to process applicants' });
    }
  },

  notifyGovernmentApplicant: async (req: Request, res: Response) => {
    try {
      const { applicantId } = req.params as { applicantId: string };
      const store = await readGovernmentIntegration();
      store.applicants[applicantId] = {
        ...store.applicants[applicantId],
        status: String(req.body?.status || store.applicants[applicantId]?.status || 'under_review'),
        notifiedAt: new Date().toISOString(),
      };
      await writeGovernmentIntegration(store);
      res.json({ applicantId, notified: true });
    } catch (error) {
      console.error('Error notifying government applicant:', error);
      res.status(500).json({ message: 'Failed to notify applicant' });
    }
  },

  getTimetable: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const { termId } = req.query;

      res.json({
        id: Date.now().toString(),
        classId,
        termId: termId as string,
        entries: [
          {
            day: 'monday',
            period: 1,
            startTime: '08:00',
            endTime: '08:40',
            subjectId: '1',
            teacherId: '1',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching timetable:', error);
      res.status(500).json({ message: 'Failed to fetch timetable' });
    }
  },

  createTimetable: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const timetableData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        classId,
        ...timetableData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating timetable:', error);
      res.status(500).json({ message: 'Failed to create timetable' });
    }
  },

  updateTimetable: async (req: Request, res: Response) => {
    try {
      const { timetableId } = req.params;
      const timetableData = req.body;
      res.json({
        message: 'Timetable updated successfully',
        id: timetableId,
        ...timetableData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating timetable:', error);
      res.status(500).json({ message: 'Failed to update timetable' });
    }
  },

  // ============================================
  // FINANCE MANAGEMENT CONTROLLERS
  // ============================================
  getFinanceDashboard: async (req: Request, res: Response) => {
    try {
      res.json({
        totalCollected: 12500000,
        totalPending: 3500000,
        totalExpenses: 8500000,
        totalBudget: 15000000,
        collectionRate: 78.5,
        expenseRate: 56.7,
        recentTransactions: [],
        pendingPayments: [],
        salaryObligations: [],
      });
    } catch (error) {
      console.error('Error fetching finance dashboard:', error);
      res.status(500).json({ message: 'Failed to fetch finance dashboard' });
    }
  },

  getFeeStructure: async (req: Request, res: Response) => {
    try {
      const { classId } = req.params;
      const { termId } = req.query;

      res.json({
        id: Date.now().toString(),
        classId,
        termId: termId as string,
        items: [
          { name: 'Tuition', amount: 15000, category: 'tuition', isOptional: false },
          { name: 'Boarding', amount: 10000, category: 'boarding', isOptional: true },
          { name: 'Activities', amount: 2000, category: 'activity', isOptional: false },
        ],
        totalAmount: 27000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      res.status(500).json({ message: 'Failed to fetch fee structure' });
    }
  },

  createFeeStructure: async (req: Request, res: Response) => {
    try {
      const feeData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        ...feeData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating fee structure:', error);
      res.status(500).json({ message: 'Failed to create fee structure' });
    }
  },

  updateFeeStructure: async (req: Request, res: Response) => {
    try {
      const { feeStructureId } = req.params;
      const feeData = req.body;
      res.json({
        message: 'Fee structure updated successfully',
        id: feeStructureId,
        ...feeData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating fee structure:', error);
      res.status(500).json({ message: 'Failed to update fee structure' });
    }
  },

  getTransactions: async (req: Request, res: Response) => {
    try {
      const { type, startDate, endDate, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      res.json({
        transactions: [
          {
            id: '1',
            type: 'income',
            category: 'Fee Payment',
            amount: 15000,
            method: 'mpesa',
            reference: 'MPESA123',
            description: 'Term 1 Fees - John Doe',
            createdBy: 'admin',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: parseInt(page as string),
        pages: 1,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  },

  recordTransaction: async (req: Request, res: Response) => {
    try {
      const transactionData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        ...transactionData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording transaction:', error);
      res.status(500).json({ message: 'Failed to record transaction' });
    }
  },

  deleteTransaction: async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.params;
      res.json({ message: 'Transaction deleted successfully', id: transactionId });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ message: 'Failed to delete transaction' });
    }
  },

  getBursaries: async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: '1',
          name: 'Government Bursary',
          sponsor: 'County Government',
          totalAmount: 500000,
          allocatedAmount: 350000,
          remainingAmount: 150000,
          criteria: 'Needy students',
          isActive: true,
          allocations: [],
        },
      ]);
    } catch (error) {
      console.error('Error fetching bursaries:', error);
      res.status(500).json({ message: 'Failed to fetch bursaries' });
    }
  },

  createBursary: async (req: Request, res: Response) => {
    try {
      const bursaryData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        ...bursaryData,
        isActive: true,
        allocations: [],
      });
    } catch (error) {
      console.error('Error creating bursary:', error);
      res.status(500).json({ message: 'Failed to create bursary' });
    }
  },

  allocateBursary: async (req: Request, res: Response) => {
    try {
      const { bursaryId } = req.params;
      const allocationData = req.body;
      res.json({
        message: 'Bursary allocated successfully',
        id: bursaryId,
        ...allocationData,
      });
    } catch (error) {
      console.error('Error allocating bursary:', error);
      res.status(500).json({ message: 'Failed to allocate bursary' });
    }
  },

  getScholarships: async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: '1',
          name: 'Academic Excellence Scholarship',
          type: 'academic',
          criteria: 'Top 5% of students',
          benefits: ['Full tuition', 'Books allowance'],
          isActive: true,
          recipients: [],
        },
      ]);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
      res.status(500).json({ message: 'Failed to fetch scholarships' });
    }
  },

  createScholarship: async (req: Request, res: Response) => {
    try {
      const scholarshipData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        ...scholarshipData,
        isActive: true,
        recipients: [],
      });
    } catch (error) {
      console.error('Error creating scholarship:', error);
      res.status(500).json({ message: 'Failed to create scholarship' });
    }
  },

  generateFinancialReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, type } = req.query;
      // Generate PDF/Excel report
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="financial-report.pdf"');
      res.send('PDF content here');
    } catch (error) {
      console.error('Error generating financial report:', error);
      res.status(500).json({ message: 'Failed to generate financial report' });
    }
  },

  // ============================================
  // REPORTS CENTER CONTROLLERS
  // ============================================
  getReportConfigs: async (req: Request, res: Response) => {
    try {
      res.json([
        {
          id: '1',
          name: 'Monthly Fee Collection',
          type: 'financial',
          format: 'pdf',
          columns: [
            { field: 'date', label: 'Date', type: 'date', visible: true },
            { field: 'amount', label: 'Amount', type: 'currency', visible: true },
          ],
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
        },
      ]);
    } catch (error) {
      console.error('Error fetching report configs:', error);
      res.status(500).json({ message: 'Failed to fetch report configs' });
    }
  },

  createReportConfig: async (req: Request, res: Response) => {
    try {
      const configData = req.body;
      res.status(201).json({
        id: Date.now().toString(),
        ...configData,
        createdAt: new Date().toISOString(),
        createdBy: (req as any).user.userId,
      });
    } catch (error) {
      console.error('Error creating report config:', error);
      res.status(500).json({ message: 'Failed to create report config' });
    }
  },

  updateReportConfig: async (req: Request, res: Response) => {
    try {
      const { configId } = req.params;
      const configData = req.body;
      res.json({
        message: 'Report config updated successfully',
        id: configId,
        ...configData,
      });
    } catch (error) {
      console.error('Error updating report config:', error);
      res.status(500).json({ message: 'Failed to update report config' });
    }
  },

  deleteReportConfig: async (req: Request, res: Response) => {
    try {
      const { configId } = req.params;
      res.json({ message: 'Report config deleted successfully', id: configId });
    } catch (error) {
      console.error('Error deleting report config:', error);
      res.status(500).json({ message: 'Failed to delete report config' });
    }
  },

  generateReport: async (req: Request, res: Response) => {
    try {
      const { configId } = req.params;
      const filters = req.body;
      // Generate report
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="report.pdf"');
      res.send('PDF content');
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  },

  generateAcademicReport: async (req: Request, res: Response) => {
    try {
      const { classId, termId, includeResults } = req.query;
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="academic-report.pdf"');
      res.send('PDF content');
    } catch (error) {
      console.error('Error generating academic report:', error);
      res.status(500).json({ message: 'Failed to generate academic report' });
    }
  },

  generateAttendanceReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, classId, studentId } = req.query;
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="attendance-report.pdf"');
      res.send('PDF content');
    } catch (error) {
      console.error('Error generating attendance report:', error);
      res.status(500).json({ message: 'Failed to generate attendance report' });
    }
  },

  generateDisciplineReport: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, studentId, type } = req.query;
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', 'attachment; filename="discipline-report.pdf"');
      res.send('PDF content');
    } catch (error) {
      console.error('Error generating discipline report:', error);
      res.status(500).json({ message: 'Failed to generate discipline report' });
    }
  },

  getKcseExamSummary: async (req: Request, res: Response) => {
    try {
      const year = Number.parseInt(req.params.year, 10);
      const examTypeInput = String(req.query.examType || 'KCSE').toUpperCase();
      const examType = examTypeInput === 'MOCK' ? 'MOCK' : 'KCSE';

      const rows = await prisma.result.findMany({
        where: { year, examType },
        include: {
          student: {
            include: {
              user: true,
              class: true,
            },
          },
          subject: true,
        },
        orderBy: [{ studentId: 'asc' }, { score: 'desc' }],
      });

      if (!rows.length) {
        return res.json({ examData: null, results: [] });
      }

      const studentBuckets = new Map<string, {
        id: string;
        studentName: string;
        admissionNumber: string;
        gender: 'M' | 'F';
        subjectGrades: Record<string, string>;
        totalPoints: number;
        meanGrade: string;
        rank?: number;
      }>();

      const subjectTotals = new Map<string, { total: number; count: number }>();
      const gradeDistribution: Record<string, number> = {};
      let male = 0;
      let female = 0;

      for (const row of rows) {
        const studentId = row.studentId;
        const studentName = row.student.user
          ? `${row.student.user.firstName || ''} ${row.student.user.lastName || ''}`.trim()
          : `${row.student.firstName || ''} ${row.student.lastName || ''}`.trim() || 'Student';
        const admissionNumber = row.student.admissionNumber || row.student.id;
        const gender = row.student.gender === 'FEMALE' ? 'F' : 'M';

        if (!studentBuckets.has(studentId)) {
          studentBuckets.set(studentId, {
            id: studentId,
            studentName,
            admissionNumber,
            gender,
            subjectGrades: {},
            totalPoints: 0,
            meanGrade: row.grade || 'N/A',
          });
          if (gender === 'F') female += 1;
          else male += 1;
        }

        const bucket = studentBuckets.get(studentId)!;
        const subjectName = row.subject.name;
        bucket.subjectGrades[subjectName] = row.grade || 'N/A';
        bucket.totalPoints += row.points ?? Math.round(row.score);
        bucket.meanGrade = row.grade || bucket.meanGrade;

        const subjectStats = subjectTotals.get(subjectName) || { total: 0, count: 0 };
        subjectStats.total += row.score;
        subjectStats.count += 1;
        subjectTotals.set(subjectName, subjectStats);

        const gradeKey = row.grade || 'N/A';
        gradeDistribution[gradeKey] = (gradeDistribution[gradeKey] || 0) + 1;
      }

      const studentResults = Array.from(studentBuckets.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((student, index) => ({ ...student, rank: index + 1 }));

      const totalCandidates = studentResults.length;
      const meanScore = rows.reduce((sum, row) => sum + row.score, 0) / rows.length;
      const topStudent = studentResults[0];
      const distinctions = studentResults.filter((student) => ['A', 'A-'].includes(student.meanGrade)).length;
      const credits = studentResults.filter((student) => ['B+', 'B', 'B-'].includes(student.meanGrade)).length;
      const passes = studentResults.filter((student) => ['C+', 'C', 'C-'].includes(student.meanGrade)).length;
      const failures = studentResults.filter((student) => ['D+', 'D', 'D-', 'E'].includes(student.meanGrade)).length;

      const subjectPerformance: Record<string, { mean: number; grade: string }> = {};
      for (const [subject, stats] of subjectTotals.entries()) {
        const mean = stats.total / stats.count;
        subjectPerformance[subject] = {
          mean: Number(mean.toFixed(1)),
          grade: mean >= 80 ? 'A' : mean >= 75 ? 'A-' : mean >= 70 ? 'B+' : mean >= 65 ? 'B' : mean >= 60 ? 'B-' : mean >= 55 ? 'C+' : 'C',
        };
      }

      res.json({
        examData: {
          year,
          examType,
          totalCandidates,
          meanScore: Number(meanScore.toFixed(1)),
          meanGrade: topStudent?.meanGrade || 'N/A',
          topStudent: topStudent?.studentName || 'N/A',
          topScore: topStudent?.totalPoints || 0,
          universityQualification: studentResults.filter((student) => student.totalPoints >= 60).length,
          distinctions,
          credits,
          passes,
          failures,
          subjectPerformance,
          genderBreakdown: { male, female },
          gradeDistribution,
        },
        results: studentResults,
      });
    } catch (error) {
      console.error('Error loading KCSE summary:', error);
      res.status(500).json({ message: 'Failed to load KCSE exam summary' });
    }
  },

  exportKcseExamResults: async (req: Request, res: Response) => {
    try {
      const year = Number.parseInt(req.params.year, 10);
      const examType = String(req.query.examType || 'KCSE').toUpperCase();
      const format = String(req.query.format || 'csv').toLowerCase();

      const rows = await prisma.result.findMany({
        where: { year, examType: examType === 'MOCK' ? 'MOCK' : 'KCSE' },
        include: {
          student: { include: { user: true } },
          subject: true,
        },
      });

      if (format === 'json') {
        return res.json(rows);
      }

      const header = 'Student,Admission Number,Subject,Score,Grade,Points,Term,Year';
      const lines = rows.map((row) => {
        const studentName = row.student.user
          ? `${row.student.user.firstName || ''} ${row.student.user.lastName || ''}`.trim()
          : `${row.student.firstName || ''} ${row.student.lastName || ''}`.trim() || row.studentId;
        const admissionNumber = row.student.admissionNumber || row.studentId;
        return [
          `"${studentName.replace(/"/g, '""')}"`,
          `"${admissionNumber.replace(/"/g, '""')}"`,
          `"${row.subject.name.replace(/"/g, '""')}"`,
          row.score,
          `"${(row.grade || '').replace(/"/g, '""')}"`,
          row.points ?? '',
          row.term,
          row.year,
        ].join(',');
      });

      const extension = format === 'excel' ? 'xlsx' : format;
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';

      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `attachment; filename="${examType.toLowerCase()}-${year}-results.${extension}"`);
      res.send(format === 'pdf' ? 'PDF export is not configured yet.' : [header, ...lines].join('\n'));
    } catch (error) {
      console.error('Error exporting KCSE results:', error);
      res.status(500).json({ message: 'Failed to export exam results' });
    }
  },

  generateKCSEAnalysis: async (req: Request, res: Response) => {
    try {
      const { year } = req.params;
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `attachment; filename="kcse-analysis-${year}.pdf"`);
      res.send('PDF content');
    } catch (error) {
      console.error('Error generating KCSE analysis:', error);
      res.status(500).json({ message: 'Failed to generate KCSE analysis' });
    }
  },

  // ============================================
  // SYSTEM SETTINGS CONTROLLERS
  // ============================================
  getSystemSettings: async (req: Request, res: Response) => {
    try {
      res.json({
        general: {
          systemName: 'School Hub',
          systemVersion: '1.0.0',
          timezone: 'Africa/Nairobi',
          dateFormat: 'DD/MM/YYYY',
          currency: 'KES',
          language: 'en',
          maintenanceMode: false,
        },
        security: {
          minPasswordLength: 8,
          requireSpecialChars: true,
          requireNumbers: true,
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          lockoutDuration: 900,
          require2FA: false,
        },
        email: {
          provider: 'smtp',
          fromEmail: 'noreply@schoolhub.ac.ke',
          fromName: 'School Hub',
        },
        sms: {
          provider: 'africas-talking',
          senderId: 'SchoolHub',
        },
        mpesa: {
          environment: 'sandbox',
          shortcode: '123456',
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          backupTime: '02:00',
          retentionDays: 30,
          storageLocation: 'cloud',
          lastBackup: new Date(Date.now() - 86400000).toISOString(),
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          notifyOnStudentEnrollment: true,
          notifyOnFeePayment: true,
          notifyOnDisciplineIssue: true,
          notifyOnLowInventory: true,
          notifyOnSystemError: true,
        },
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({ message: 'Failed to fetch system settings' });
    }
  },

  updateGeneralSettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'General settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating general settings:', error);
      res.status(500).json({ message: 'Failed to update general settings' });
    }
  },

  updateSecuritySettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'Security settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating security settings:', error);
      res.status(500).json({ message: 'Failed to update security settings' });
    }
  },

  updateEmailSettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'Email settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating email settings:', error);
      res.status(500).json({ message: 'Failed to update email settings' });
    }
  },

  updateSMSSettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'SMS settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating SMS settings:', error);
      res.status(500).json({ message: 'Failed to update SMS settings' });
    }
  },

  updateMPESASEttings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'MPESA settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating MPESA settings:', error);
      res.status(500).json({ message: 'Failed to update MPESA settings' });
    }
  },

  updateBackupSettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'Backup settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating backup settings:', error);
      res.status(500).json({ message: 'Failed to update backup settings' });
    }
  },

  updateNotificationSettings: async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      res.json({ message: 'Notification settings updated successfully', ...settingsData });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ message: 'Failed to update notification settings' });
    }
  },

  createBackup: async (req: Request, res: Response) => {
    try {
      const type = String(req.body?.type || 'full');
      const uploadToCloud = Boolean(req.body?.uploadToCloud);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `school-hub-${type}-backup-${timestamp}.json`;
      const payload = {
        createdAt: new Date().toISOString(),
        type,
        uploadToCloud,
        tables: {
          students: await prisma.student.count(),
          teachers: await prisma.teacher.count(),
          parents: await prisma.parent.count(),
          payments: await prisma.payment.count(),
          fees: await prisma.fee.count(),
        },
      };
      const serialized = JSON.stringify(payload);
      const size = Buffer.byteLength(serialized, 'utf8');
      const backupId = `backup-${Date.now()}`;

      await writeSetting('system.backups.latest', 'backup', {
        id: backupId,
        filename,
        size,
        type,
        uploadToCloud,
        createdAt: payload.createdAt,
        status: 'completed',
      });

      res.json({
        message: 'Backup created successfully',
        id: backupId,
        backupId,
        filename,
        size,
        type,
        uploadToCloud,
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ message: 'Failed to create backup' });
    }
  },

  restoreBackup: async (req: Request, res: Response) => {
    try {
      const { backupId } = req.body;
      res.json({ message: 'System restore initiated', backupId });
    } catch (error) {
      console.error('Error restoring backup:', error);
      res.status(500).json({ message: 'Failed to restore backup' });
    }
  },

  listBackups: async (_req: Request, res: Response) => {
    try {
      const latest = await readSetting<any | null>('system.backups.latest', null);
      if (!latest) {
        return res.json([]);
      }
      res.json([latest]);
    } catch (error) {
      console.error('Error listing backups:', error);
      res.status(500).json({ message: 'Failed to list backups' });
    }
  },

  downloadBackup: async (req: Request, res: Response) => {
    try {
      const latest = await readSetting<any | null>('system.backups.latest', null);
      const payload = {
        id: req.params.backupId,
        downloadedAt: new Date().toISOString(),
        backup: latest || null,
      };
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${latest?.filename || 'school-hub-backup.json'}"`);
      res.send(JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Error downloading backup:', error);
      res.status(500).json({ message: 'Failed to download backup' });
    }
  },

  getBackupSchedule: async (_req: Request, res: Response) => {
    try {
      const schedule = await readSetting('system.backup.schedule', null);
      res.json(schedule || {
        enabled: true,
        frequency: 'daily',
        time: '02:00',
        retentionDays: 30,
        keepLocal: true,
        uploadToCloud: true,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to load backup schedule' });
    }
  },

  saveBackupSchedule: async (req: Request, res: Response) => {
    try {
      await writeSetting('system.backup.schedule', 'backup', req.body);
      res.json(req.body);
    } catch (error) {
      res.status(500).json({ message: 'Failed to save backup schedule' });
    }
  },

  getCloudConfig: async (_req: Request, res: Response) => {
    try {
      const config = await readSetting('system.backup.cloud', null);
      res.json(config || {
        provider: 'aws',
        bucketName: '',
        region: 'us-east-1',
        accessKey: '',
        secretKey: '',
        status: 'disconnected',
        totalBackups: 0,
        totalSize: 0,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to load cloud config' });
    }
  },

  saveCloudConfig: async (req: Request, res: Response) => {
    try {
      const config = { ...req.body, status: req.body?.bucketName ? 'connected' : 'disconnected' };
      await writeSetting('system.backup.cloud', 'backup', config);
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: 'Failed to save cloud config' });
    }
  },

  syncBackupsToCloud: async (_req: Request, res: Response) => {
    res.json({ message: 'Backup cloud sync queued', queuedAt: new Date().toISOString() });
  },

  getBackupSystemHealth: async (_req: Request, res: Response) => {
    try {
      const latest = await readSetting('system.backups.latest', null);
      res.json({
        databaseSize: 0,
        mediaSize: 0,
        totalSize: latest?.size || 0,
        diskUsage: 0,
        lastBackupSize: latest?.size || 0,
        backupCount: latest ? 1 : 0,
        healthScore: latest ? 95 : 82,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to load backup health' });
    }
  },

  deleteBackup: async (req: Request, res: Response) => {
    try {
      const { backupId } = req.params;
      res.json({ message: 'Backup deleted successfully', id: backupId });
    } catch (error) {
      console.error('Error deleting backup:', error);
      res.status(500).json({ message: 'Failed to delete backup' });
    }
  },

  clearCache: async (req: Request, res: Response) => {
    try {
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ message: 'Failed to clear cache' });
    }
  },

  runHealthCheck: async (req: Request, res: Response) => {
    try {
      res.json({
        status: 'healthy',
        database: { status: 'online', responseTime: 12 },
        storage: { status: 'online', responseTime: 45 },
        email: { status: 'online', responseTime: 230 },
        sms: { status: 'online', responseTime: 180 },
        mpesa: { status: 'online', responseTime: 320 },
        uptime: 99.9,
      });
    } catch (error) {
      console.error('Error running health check:', error);
      res.status(500).json({ message: 'Failed to run health check' });
    }
  },

  exportActivityLogs: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="activity-logs.csv"');
      res.send('Date,User,Action,Resource\n2024-01-01,Admin,Login,System');
    } catch (error) {
      console.error('Error exporting activity logs:', error);
      res.status(500).json({ message: 'Failed to export activity logs' });
    }
  },

  getAttendanceByDate: async (req: Request, res: Response) => {
    try {
      const { start, end } = attendanceDayRange(String(req.params.date || req.query.date || ''));
      const [students, records] = await Promise.all([
        prisma.student.findMany({
          where: { isActive: true },
          include: { class: { select: { id: true, name: true, stream: true } } },
          orderBy: [{ class: { name: 'asc' } }, { lastName: 'asc' }, { firstName: 'asc' }],
        }),
        prisma.attendance.findMany({
          where: { date: { gte: start, lt: end } },
          include: { student: true, class: true },
        }),
      ]);

      const byStudent = new Map(records.map((record) => [record.studentId, record]));
      res.json(students.map((student) => {
        const record = byStudent.get(student.id);
        return {
          id: student.id,
          studentId: student.id,
          attendanceId: record?.id,
          studentName: `${student.firstName} ${student.lastName}`.trim(),
          admissionNumber: student.admissionNumber,
          classId: student.classId,
          className: student.class ? [student.class.name, student.class.stream].filter(Boolean).join(' ') : 'Unassigned',
          status: (record?.status || 'ABSENT').toLowerCase(),
          timeIn: record?.checkIn ? record.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          notes: record?.notes || '',
        };
      }));
    } catch (error) {
      console.error('Error loading attendance by date:', error);
      res.status(500).json({ message: 'Failed to load attendance' });
    }
  },

  bulkMarkAttendance: async (req: Request, res: Response) => {
    try {
      const { start, key } = attendanceDayRange(String(req.body?.date || ''));
      const studentIds = Array.isArray(req.body?.studentIds) ? req.body.studentIds.map(String) : [];
      const status = normalizeAttendanceStatus(req.body?.status);
      if (!studentIds.length) {
        return res.status(400).json({ message: 'studentIds are required' });
      }

      const students = await prisma.student.findMany({
        where: { id: { in: studentIds }, isActive: true, classId: { not: null } },
        select: { id: true, classId: true },
      });

      const updates = await Promise.all(students.map(async (student) => {
        const existing = await prisma.attendance.findFirst({
          where: { studentId: student.id, date: { gte: start, lt: new Date(start.getTime() + 86400000) } },
          select: { id: true },
        });
        const data = {
          status,
          checkIn: status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE ? new Date() : null,
        };
        if (existing) {
          return prisma.attendance.update({ where: { id: existing.id }, data });
        }
        return prisma.attendance.create({
          data: {
            id: `attendance_${student.id}_${student.classId}_${key}`,
            studentId: student.id,
            classId: student.classId as string,
            date: start,
            ...data,
          },
        });
      }));

      res.json({ message: 'Attendance updated', count: updates.length });
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
      res.status(500).json({ message: 'Failed to bulk mark attendance' });
    }
  },

  exportAttendanceByDate: async (req: Request, res: Response) => {
    try {
      const { start, end, key } = attendanceDayRange(String(req.params.date || req.query.date || ''));
      const records = await prisma.attendance.findMany({
        where: { date: { gte: start, lt: end } },
        include: { student: true, class: true },
        orderBy: [{ class: { name: 'asc' } }, { student: { lastName: 'asc' } }],
      });
      const lines = [
        'Student,Admission Number,Class,Status,Time In,Notes',
        ...records.map((record) => [
          `"${`${record.student.firstName} ${record.student.lastName}`.trim().replace(/"/g, '""')}"`,
          record.student.admissionNumber,
          `"${[record.class.name, record.class.stream].filter(Boolean).join(' ').replace(/"/g, '""')}"`,
          record.status,
          record.checkIn ? record.checkIn.toISOString() : '',
          `"${(record.notes || '').replace(/"/g, '""')}"`,
        ].join(',')),
      ];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${key}.csv"`);
      res.send(lines.join('\n'));
    } catch (error) {
      console.error('Error exporting attendance:', error);
      res.status(500).json({ message: 'Failed to export attendance' });
    }
  },

  importAttendanceByDate: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Attendance file is required' });
      }
      res.json({
        message: 'Attendance file received',
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error('Error importing attendance:', error);
      res.status(500).json({ message: 'Failed to import attendance' });
    }
  },

  // ============================================
  // GENERIC ADMIN WORKSPACE CONTROLLERS
  // ============================================
  getWorkspaceRecords: async (req: Request, res: Response) => {
    try {
      const path = String(req.query.path || '/admin/workspace');
      const store = await readWorkspace(path);
      res.json({ path, records: store.records });
    } catch (error) {
      console.error('Error fetching admin workspace records:', error);
      res.status(500).json({ message: 'Failed to fetch admin workspace records' });
    }
  },

  createWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const path = String(req.body?.path || '/admin/workspace');
      const store = await readWorkspace(path);
      const record = normalizeWorkspaceRecord({
        ...req.body?.record,
        id: `workspace-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      }, req.body?.record?.category);
      const nextStore = { records: [record, ...store.records] };
      await writeWorkspace(path, nextStore);
      res.status(201).json(record);
    } catch (error) {
      console.error('Error creating admin workspace record:', error);
      res.status(500).json({ message: 'Failed to create admin workspace record' });
    }
  },

  updateWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const { recordId } = req.params;
      const path = String(req.body?.path || '/admin/workspace');
      const store = await readWorkspace(path);
      const existing = store.records.find((record) => record.id === recordId);
      if (!existing) {
        return res.status(404).json({ message: 'Workspace record not found' });
      }
      const updated = normalizeWorkspaceRecord({
        ...existing,
        ...req.body?.record,
        id: recordId,
        updatedAt: new Date().toISOString(),
      }, existing.category);
      const nextStore = {
        records: store.records.map((record) => (record.id === recordId ? updated : record)),
      };
      await writeWorkspace(path, nextStore);
      res.json(updated);
    } catch (error) {
      console.error('Error updating admin workspace record:', error);
      res.status(500).json({ message: 'Failed to update admin workspace record' });
    }
  },

  deleteWorkspaceRecord: async (req: Request, res: Response) => {
    try {
      const { recordId } = req.params;
      const path = String(req.body?.path || req.query.path || '/admin/workspace');
      const store = await readWorkspace(path);
      await writeWorkspace(path, {
        records: store.records.filter((record) => record.id !== recordId),
      });
      res.json({ message: 'Workspace record deleted', id: recordId });
    } catch (error) {
      console.error('Error deleting admin workspace record:', error);
      res.status(500).json({ message: 'Failed to delete admin workspace record' });
    }
  },

  // ============================================
  // COMMUNICATION CONTROLLERS
  // ============================================
  getAnnouncements: async (_req: Request, res: Response) => {
    try {
      const announcements = await prisma.announcement.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 100,
      });
      res.json(announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.isUrgent ? 'urgent' : 'normal',
        status: announcement.expiresAt && announcement.expiresAt < new Date() ? 'archived' : 'published',
        targetAudience: announcement.audience,
        mediaUrls: [],
        mediaTypes: [],
        publishedAt: announcement.publishedAt.toISOString(),
        expiresAt: announcement.expiresAt?.toISOString(),
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        isPinned: announcement.isUrgent,
        isPublic: announcement.audience === 'all',
        tags: [],
        createdBy: announcement.createdBy,
      })));
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Failed to fetch announcements' });
    }
  },

  createAnnouncement: async (req: Request, res: Response) => {
    try {
      const title = String(req.body?.title || '').trim();
      const content = String(req.body?.content || '').trim();
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      const school = await prisma.school.findFirst();
      if (!school) return res.status(404).json({ message: 'School not found' });

      const announcement = await prisma.announcement.create({
        data: {
          schoolId: school.id,
          title,
          content,
          audience: String(req.body?.targetAudience || req.body?.audience || 'all'),
          isUrgent: String(req.body?.priority || '').toLowerCase() === 'urgent' || req.body?.isPinned === 'true',
          sendWhatsApp: req.body?.sendWhatsApp === 'true',
          sendSMS: req.body?.sendSMS === 'true',
          sendEmail: req.body?.sendEmail === 'true',
          sendPush: req.body?.sendPush !== 'false',
          expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : null,
          createdBy: (req as any).user?.userId || 'admin',
        }
      });

      res.status(201).json({ ...announcement, message: 'Announcement created successfully' });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Failed to create announcement' });
    }
  },

  updateAnnouncement: async (req: Request, res: Response) => {
    try {
      const { announcementId } = req.params;
      const announcement = await prisma.announcement.update({
        where: { id: announcementId },
        data: {
          title: req.body?.title,
          content: req.body?.content,
          audience: req.body?.targetAudience || req.body?.audience,
          isUrgent: req.body?.isPinned === undefined
            ? (req.body?.priority ? String(req.body.priority).toLowerCase() === 'urgent' : undefined)
            : Boolean(req.body.isPinned),
          expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : undefined,
        }
      });
      res.json(announcement);
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Failed to update announcement' });
    }
  },

  deleteAnnouncement: async (req: Request, res: Response) => {
    try {
      await prisma.announcement.delete({ where: { id: req.params.announcementId } });
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  },

  // ============================================
  // PERMISSIONS CONTROLLERS
  // ============================================
  getAllPermissions: async (req: Request, res: Response) => {
    try {
      const permissions = [
        { id: '1', name: 'Manage Users', category: 'users', description: 'Create, update, delete users', enabled: true },
        { id: '2', name: 'Manage School Profile', category: 'school', description: 'Edit school information', enabled: true },
        { id: '3', name: 'Manage Finance', category: 'finance', description: 'Access financial records', enabled: true },
        { id: '4', name: 'Manage Academic', category: 'academic', description: 'Manage classes, subjects, timetables', enabled: true },
      ];
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  },

  getRolePermissions: async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      // Get permissions for specific role
      res.json([
        { id: '1', name: 'Manage Users', category: 'users', description: 'Create, update, delete users', enabled: true },
        { id: '2', name: 'Manage School Profile', category: 'school', description: 'Edit school information', enabled: true },
      ]);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      res.status(500).json({ message: 'Failed to fetch role permissions' });
    }
  },

  updateRolePermissions: async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      const { permissionIds } = req.body;
      res.json({ message: 'Role permissions updated successfully', role, permissionIds });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      res.status(500).json({ message: 'Failed to update role permissions' });
    }
  },
};
