import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase } from './database/connection';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// ─── Route imports ────────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes';
import propertyRoutes from './modules/properties/property.routes';
import mediaRoutes from './modules/media/media.routes';
import adminRoutes from './modules/admin/admin.routes';
import projectRoutes from './modules/projects/project.routes';
import blogRoutes from './modules/blogs/blog.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import chatRoutes from './modules/chat/chat.routes';
import groupRoutes from './modules/groups/group.routes';
import webrtcRoutes from './modules/webrtc/webrtc.routes';
import usersRoutes from './modules/users/users.routes';

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
import { initSocketServer } from './socket';
initSocketServer(httpServer);

// ─── Security middleware ──────────────────────────────────────────────────────

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }),
);

const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];
const configuredOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── General rate limiter ─────────────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  },
});
app.use(generalLimiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }),
  );
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/webrtc', webrtcRoutes);
app.use('/api/v1/users', usersRoutes);
// Future routes will be added here as modules are implemented

// ─── 404 + Error handling ─────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────

async function start() {
  try {
    await connectDatabase();
    
    // Automatically run database migrations on startup (without closing pool)
    const { runMigrations } = await import('./database/migrate');
    await runMigrations(false);
    
    // Automatically run seed script and admin creation (without closing pool)
    const { runSeed } = await import('./database/seed');
    await runSeed(false);

    const { createAdminUser } = await import('./database/create-admin');
    await createAdminUser(false);
    
    httpServer.listen(env.PORT, '0.0.0.0', () => {
      logger.info(`🚀 API server running on http://127.0.0.1:${env.PORT} and http://localhost:${env.PORT}`);
      logger.info(`📝 Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

start();

export { app, httpServer };
