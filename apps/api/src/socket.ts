import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from './config/env';
import { logger } from './config/logger';
import jwt from 'jsonwebtoken';
import { AuthPayload } from './middleware/auth';

let io: Server;

export function initSocketServer(httpServer: HttpServer) {
  const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];
  const configuredOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user as AuthPayload;
    logger.info(`Socket connected: User ${user.userId}`);
    
    // User joins their own room (for private messages/notifications)
    socket.join(`user:${user.userId}`);
    
    // Admin joins admin room (to receive new conversation notifications)
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
       socket.join('admins');
    }

    socket.on('join_conversation', (conversationId: string) => {
       socket.join(`conversation:${conversationId}`);
       logger.info(`User ${user.userId} joined conversation ${conversationId}`);
    });
    
    socket.on('leave_conversation', (conversationId: string) => {
       socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
       socket.to(`conversation:${conversationId}`).emit('typing', {
           conversationId,
           userId: user.userId,
           isTyping
       });
    });

    socket.on('mark_read', ({ conversationId }) => {
       // Future: update DB for read receipts, emit update
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: User ${user.userId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
