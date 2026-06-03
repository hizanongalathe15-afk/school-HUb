import type { NextFunction, Request, Response } from 'express';

interface StoredResponse {
  statusCode: number;
  body: unknown;
  contentType?: string | number | string[];
  createdAt: number;
}

const IDEMPOTENCY_HEADER = 'x-offline-action-id';
const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 5000;
const replayCache = new Map<string, StoredResponse>();
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function cacheKey(req: Request, actionId: string) {
  const userId = (req as any).user?.id || 'anonymous';
  return `${userId}:${req.method}:${req.originalUrl}:${actionId}`;
}

function pruneCache() {
  const now = Date.now();
  for (const [key, value] of replayCache.entries()) {
    if (now - value.createdAt > TTL_MS) {
      replayCache.delete(key);
    }
  }

  while (replayCache.size > MAX_ENTRIES) {
    const oldest = replayCache.keys().next().value;
    if (!oldest) break;
    replayCache.delete(oldest);
  }
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const actionId = req.header(IDEMPOTENCY_HEADER);
  if (!actionId) {
    next();
    return;
  }

  pruneCache();

  const key = cacheKey(req, actionId);
  const cached = replayCache.get(key);
  if (cached) {
    res.setHeader('X-Offline-Action-Replayed', 'true');
    if (cached.contentType) {
      res.setHeader('Content-Type', cached.contentType);
    }
    res.status(cached.statusCode).json(cached.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode < 500) {
      replayCache.set(key, {
        statusCode: res.statusCode,
        body,
        contentType: res.getHeader('Content-Type'),
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}
