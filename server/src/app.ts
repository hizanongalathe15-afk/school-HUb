import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './routes/index.js';
import { runtimeMetricsMiddleware } from './services/runtimeMetricsService.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
const allowedOrigin = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
  if (!origin || configuredOrigins.includes(origin) || localDevOrigin.test(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'server/uploads')));
app.use(runtimeMetricsMiddleware);
app.use(idempotencyMiddleware);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
  skip: (req) => req.method === 'GET' && req.path.startsWith('/api/dashboard/modules/'),
  message: 'Too many requests from this IP',
});
app.use(limiter);

app.use('/api', routes);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ message: 'Upload is too large. Use a smaller image/video or an external media URL.' });
    return;
  }

  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
