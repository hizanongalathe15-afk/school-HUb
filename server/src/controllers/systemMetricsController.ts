import { Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import { authSessionService } from '../services/authSessionService.js';
import { PrismaClient } from '@prisma/client';
import { runtimeMetricsService } from '../services/runtimeMetricsService.js';

const prisma = new PrismaClient();
let previousCpuSnapshot: ReturnType<typeof os.cpus> | null = null;
let previousNetworkSnapshot: Array<{ name: string; rx: number; tx: number; errors: number }> | null = null;

function canViewSystemMetrics(role?: string) {
  return role === 'ADMIN' || role === 'PRINCIPAL';
}

function readStorageMetrics() {
  try {
    const stats = fs.statfsSync(process.cwd());
    const total = Number(stats.blocks) * Number(stats.bsize);
    const free = Number(stats.bavail) * Number(stats.bsize);
    const used = Math.max(0, total - free);
    return {
      total,
      used,
      free,
      usage: total > 0 ? Math.round((used / total) * 1000) / 10 : 0
    };
  } catch {
    return {
      total: 0,
      used: 0,
      free: 0,
      usage: 0
    };
  }
}

function readCpuUsage() {
  const cpus = os.cpus();
  if (!previousCpuSnapshot) {
    previousCpuSnapshot = cpus;
    const loadUsage = Math.min(100, Math.round((os.loadavg()[0] / Math.max(1, cpus.length)) * 1000) / 10);
    return {
      overall: loadUsage,
      perCore: cpus.map(() => loadUsage)
    };
  }

  const perCore = cpus.map((cpu, index) => {
    const previous = previousCpuSnapshot?.[index];
    if (!previous) return 0;
    const idle = cpu.times.idle - previous.times.idle;
    const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0) -
      Object.values(previous.times).reduce((sum, value) => sum + value, 0);
    return total > 0 ? Math.round(((total - idle) / total) * 1000) / 10 : 0;
  });

  previousCpuSnapshot = cpus;
  const overall = perCore.length ? Math.round((perCore.reduce((sum, value) => sum + value, 0) / perCore.length) * 10) / 10 : 0;
  return { overall, perCore };
}

function readNetworkInterfaces() {
  try {
    const raw = fs.readFileSync('/proc/net/dev', 'utf8');
    return raw
      .split('\n')
      .slice(2)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [namePart, valuesPart] = line.split(':');
        const values = valuesPart.trim().split(/\s+/).map(Number);
        return {
          name: namePart.trim(),
          ip: Object.values(os.networkInterfaces()).flat().find((entry) => entry?.internal === false)?.address || '',
          rx: values[0] || 0,
          tx: values[8] || 0,
          errors: (values[2] || 0) + (values[10] || 0)
        };
      });
  } catch {
    return Object.entries(os.networkInterfaces()).map(([name, entries]) => ({
      name,
      ip: entries?.find((entry) => entry.family === 'IPv4')?.address || '',
      rx: 0,
      tx: 0,
      errors: 0
    }));
  }
}

function readNetworkMetrics() {
  const interfaces = readNetworkInterfaces();
  const previous = previousNetworkSnapshot;
  previousNetworkSnapshot = interfaces.map((entry) => ({ name: entry.name, rx: entry.rx, tx: entry.tx, errors: entry.errors }));

  const totals = interfaces.reduce((sum, entry) => ({
    rx: sum.rx + entry.rx,
    tx: sum.tx + entry.tx,
    errors: sum.errors + entry.errors
  }), { rx: 0, tx: 0, errors: 0 });

  const previousTotals = previous?.reduce((sum, entry) => ({
    rx: sum.rx + entry.rx,
    tx: sum.tx + entry.tx,
    errors: sum.errors + entry.errors
  }), { rx: 0, tx: 0, errors: 0 });

  return {
    interfaces,
    download: previousTotals ? Math.max(0, totals.rx - previousTotals.rx) : 0,
    upload: previousTotals ? Math.max(0, totals.tx - previousTotals.tx) : 0,
    errors: totals.errors
  };
}

async function readDatabaseMetrics() {
  const fallback = { size: 0, connections: 0, queriesPerSecond: 0, slowQueries: 0, hitRatio: 0 };
  try {
    const [sizeRows, connectionRows, statRows] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ size: bigint | number }>>('select pg_database_size(current_database()) as size'),
      prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>('select count(*)::bigint as count from pg_stat_activity where datname = current_database()'),
      prisma.$queryRawUnsafe<Array<{ xact_commit: bigint | number; xact_rollback: bigint | number; blks_hit: bigint | number; blks_read: bigint | number }>>(
        'select xact_commit, xact_rollback, blks_hit, blks_read from pg_stat_database where datname = current_database()'
      )
    ]);

    const stats = statRows[0];
    const hits = Number(stats?.blks_hit || 0);
    const reads = Number(stats?.blks_read || 0);
    const commits = Number(stats?.xact_commit || 0);
    const rollbacks = Number(stats?.xact_rollback || 0);

    return {
      size: Number(sizeRows[0]?.size || 0),
      connections: Number(connectionRows[0]?.count || 0),
      queriesPerSecond: 0,
      slowQueries: rollbacks,
      hitRatio: hits + reads > 0 ? Math.round((hits / (hits + reads)) * 1000) / 10 : 0,
      transactions: commits + rollbacks
    };
  } catch {
    return fallback;
  }
}

function formatDuration(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function browserName(userAgent = '') {
  if (/Firefox/i.test(userAgent)) return 'Firefox';
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome|CriOS/i.test(userAgent)) return 'Chrome';
  if (/Safari/i.test(userAgent)) return 'Safari';
  if (/curl/i.test(userAgent)) return 'cURL';
  if (/node/i.test(userAgent)) return 'Node.js';
  return 'Unknown browser';
}

function deviceName(userAgent = '') {
  if (/iPhone|Android.*Mobile/i.test(userAgent)) return 'Mobile phone';
  if (/iPad|Tablet/i.test(userAgent)) return 'Tablet';
  if (/curl|node/i.test(userAgent)) return 'API client';
  return 'Desktop or laptop';
}

function locationFromIp(ip = '') {
  if (ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') return 'Localhost';
  if (/^(::ffff:)?(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(ip)) return 'Private network';
  return 'Public network IP';
}

export const systemMetricsController = {
  get: async (req: Request, res: Response) => {
    const started = process.hrtime.bigint();
    const user = (req as any).user as { userId: string; role: string; sessionId?: string };
    if (!canViewSystemMetrics(user?.role)) {
      return res.status(403).json({ message: 'Only admin or principal can view system metrics.' });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, firstName: true, lastName: true }
    });
    const adminCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'PRINCIPAL'] }, isActive: true }
    });
    const sessionMeta = await authSessionService.enrichUserSessions(user.userId, {
      email: viewer?.email,
      accountName: viewer ? `${viewer.firstName} ${viewer.lastName}` : undefined
    });
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const loadAverage = os.loadavg();
    const cores = Math.max(1, os.cpus().length);
    const cpu = readCpuUsage();
    const cpuUsage = cpu.overall;
    const totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024);
    const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);
    const usedMemoryMb = Math.max(0, totalMemoryMb - freeMemoryMb);
    const memoryUsage = totalMemoryMb > 0 ? Math.round((usedMemoryMb / totalMemoryMb) * 1000) / 10 : 0;
    const storage = readStorageMetrics();
    const runtime = runtimeMetricsService.getSummary(30);
    const network = readNetworkMetrics();
    const database = await readDatabaseMetrics();
    const uptimeSeconds = Math.round(process.uptime());
    const bootTime = new Date(Date.now() - uptimeSeconds * 1000);
    const healthIssues = [
      cpuUsage > 80 ? `High CPU usage: ${cpuUsage}%` : '',
      memoryUsage > 85 ? `High memory usage: ${memoryUsage}%` : '',
      storage.usage > 90 ? `High server storage usage: ${storage.usage}%` : '',
      database.connections > 80 ? `High database connection count: ${database.connections}` : '',
      elapsedMs > 750 ? `Slow metrics response: ${Math.round(elapsedMs)}ms` : ''
    ].filter(Boolean);
    const healthStatus = healthIssues.length > 1 ? 'critical' : healthIssues.length === 1 ? 'warning' : 'healthy';
    const healthScore = Math.max(0, 100 - healthIssues.length * 20);

    res.json({
      server: {
        status: 'online',
        responseMs: Math.round(elapsedMs * 100) / 100,
        uptimeSeconds,
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        loadAverage,
        platform: `${os.platform()} ${os.release()}`
      },
      health: {
        status: healthStatus,
        issues: healthIssues,
        score: healthScore
      },
      system: {
        cpu: {
          usage: cpuUsage,
          cores,
          model: os.cpus()[0]?.model || 'Unknown CPU',
          speed: os.cpus()[0]?.speed || 0,
          processes: os.loadavg()[0],
          loadAvg1: loadAverage[0],
          loadAvg5: loadAverage[1],
          loadAvg15: loadAverage[2],
          perCore: cpu.perCore
        },
        memory: {
          total: totalMemoryMb,
          used: usedMemoryMb,
          free: freeMemoryMb,
          usage: memoryUsage,
          swapTotal: 0,
          swapUsed: 0,
          swapFree: 0,
          buffered: 0,
          cached: 0
        },
        storage: {
          ...storage,
          disks: [{ name: 'root', total: storage.total, used: storage.used, free: storage.free, usage: storage.usage }]
        },
        network: {
          download: network.download,
          upload: network.upload,
          latency: Math.round(elapsedMs),
          packetsIn: network.interfaces.reduce((sum, item) => sum + item.rx, 0),
          packetsOut: network.interfaces.reduce((sum, item) => sum + item.tx, 0),
          errors: network.errors,
          interfaces: network.interfaces
        },
        database,
        uptime: uptimeSeconds,
        loadAverage,
        timestamp: new Date().toISOString(),
        requestsPerMinute: runtime.requestCounts,
        responseTime: runtime.responseTimes,
        runtime
      },
      wakeTime: {
        bootTime: bootTime.toISOString(),
        uptime: formatDuration(uptimeSeconds),
        lastRestart: bootTime.toISOString(),
        totalUptime: formatDuration(uptimeSeconds),
        currentTime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Server local time'
      },
      request: {
        ip: req.ip,
        userAgent: req.get('user-agent') || 'Unknown device',
        acceptedLanguage: req.get('accept-language') || 'Unknown'
      },
      account: {
        email: viewer?.email || '',
        accountName: viewer ? `${viewer.firstName} ${viewer.lastName}` : '',
        loginCount: sessionMeta.loginCount,
        adminCount,
        activeSessions: sessionMeta.sessions.filter((session) => !session.revokedAt).map((session) => ({
          ...session,
          isCurrent: session.id === user.sessionId,
          browser: browserName(session.userAgent),
          deviceName: deviceName(session.userAgent),
          location: locationFromIp(session.ip)
        })),
        revokedSessions: sessionMeta.sessions.filter((session) => session.revokedAt)
      }
    });
  },

  logoutOthers: async (req: Request, res: Response) => {
    const user = (req as any).user as { userId: string; role: string; sessionId?: string };
    if (!canViewSystemMetrics(user?.role)) {
      return res.status(403).json({ message: 'Only admin or principal can manage system metric sessions.' });
    }

    const meta = await authSessionService.revokeOthers(user.userId, user.sessionId);
    res.json({ message: 'Other device sessions revoked.', data: meta });
  },

  logoutSelected: async (req: Request, res: Response) => {
    const user = (req as any).user as { userId: string; role: string; sessionId?: string };
    if (!canViewSystemMetrics(user?.role)) {
      return res.status(403).json({ message: 'Only admin or principal can manage system metric sessions.' });
    }

    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
    const meta = await authSessionService.revokeSelected(user.userId, ids, user.sessionId);
    res.json({ message: 'Selected device sessions revoked. Current session was preserved.', data: meta });
  },

  clearInactive: async (req: Request, res: Response) => {
    const user = (req as any).user as { userId: string; role: string; sessionId?: string };
    if (!canViewSystemMetrics(user?.role)) {
      return res.status(403).json({ message: 'Only admin or principal can manage system metric sessions.' });
    }

    const minutes = Number(req.body.minutes || 30);
    const meta = await authSessionService.revokeInactive(user.userId, user.sessionId, Number.isFinite(minutes) ? minutes : 30);
    res.json({ message: 'Inactive admin sessions cleared. Current session was preserved.', data: meta });
  },

  clearAllSessions: async (req: Request, res: Response) => {
    const user = (req as any).user as { userId: string; role: string; sessionId?: string };
    if (!canViewSystemMetrics(user?.role)) {
      return res.status(403).json({ message: 'Only admin or principal can manage system metric sessions.' });
    }

    const meta = await authSessionService.revokeAll(user.userId, user.sessionId);
    res.json({ message: 'All other admin sessions cleared. Current session was preserved.', data: meta });
  }
};
