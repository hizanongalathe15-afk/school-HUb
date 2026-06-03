import { Request, Response, NextFunction } from 'express';

interface RuntimeSample {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}

const MAX_SAMPLES = 2000;
const samples: RuntimeSample[] = [];

export function runtimeMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    samples.push({
      timestamp: Date.now(),
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });

    if (samples.length > MAX_SAMPLES) {
      samples.splice(0, samples.length - MAX_SAMPLES);
    }
  });

  next();
}

function bucketSamples(windowMinutes: number) {
  const now = Date.now();
  const minuteMs = 60 * 1000;
  const buckets = Array.from({ length: windowMinutes }, (_, index) => {
    const start = now - (windowMinutes - index) * minuteMs;
    const end = start + minuteMs;
    const rows = samples.filter((sample) => sample.timestamp >= start && sample.timestamp < end);
    const responseTotal = rows.reduce((sum, sample) => sum + sample.durationMs, 0);
    return {
      startedAt: new Date(start).toISOString(),
      requestCount: rows.length,
      averageResponseMs: rows.length ? Math.round((responseTotal / rows.length) * 100) / 100 : 0,
      errorCount: rows.filter((sample) => sample.statusCode >= 500).length,
    };
  });

  return buckets;
}

export const runtimeMetricsService = {
  getSummary(windowMinutes = 30) {
    const buckets = bucketSamples(windowMinutes);
    const recent = samples.slice(-1)[0];
    const windowStart = Date.now() - windowMinutes * 60 * 1000;
    const inWindow = samples.filter((sample) => sample.timestamp >= windowStart);
    const responseTotal = inWindow.reduce((sum, sample) => sum + sample.durationMs, 0);

    return {
      buckets,
      requestCounts: buckets.map((bucket) => bucket.requestCount),
      responseTimes: buckets.map((bucket) => bucket.averageResponseMs),
      totalRequests: inWindow.length,
      averageResponseMs: inWindow.length ? Math.round((responseTotal / inWindow.length) * 100) / 100 : 0,
      errorCount: inWindow.filter((sample) => sample.statusCode >= 500).length,
      lastRequestAt: recent ? new Date(recent.timestamp).toISOString() : null,
    };
  },
};
