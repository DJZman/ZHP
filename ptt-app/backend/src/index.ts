import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import authRouter from './routes/auth';
import conversationsRouter from './routes/conversations';
import contactsRouter from './routes/contacts';

import { registerPresenceHandlers } from './socket/handlers/presenceHandler';
import { registerSignalingHandlers } from './socket/handlers/signalingHandler';
import { registerPttHandlers } from './socket/handlers/pttHandler';
import { registerCallHandlers } from './socket/handlers/callHandler';
import { logger } from './logger';

const log = logger('server');

// Re-export prisma from dedicated module so routes can import from either place
export { prisma } from './prisma';
export const presence = new Map<string, string>(); // userId → socketId

const PORT = parseInt(process.env.PORT || '3001', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const app = express();
app.use(cors());
app.use(express.json());

// HTTP request logging middleware
app.use((req, _res, next) => {
  log.debug('http request', { method: req.method, path: req.path });
  next();
});

app.use('/auth', authRouter);
app.use('/conversations', conversationsRouter);
app.use('/contacts', contactsRouter);

app.get('/health', (_req, res) => {
  log.debug('health check');
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket'],
});

// JWT middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) {
    log.warn('socket auth rejected: no token', { socketId: socket.id });
    return next(new Error('No token'));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    socket.data.userId = payload.userId;
    log.debug('socket auth ok', { userId: payload.userId, socketId: socket.id });
    next();
  } catch (err: any) {
    log.warn('socket auth rejected: invalid token', { socketId: socket.id, err: err.message });
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId: string = socket.data.userId;
  log.info('socket connected', { userId, socketId: socket.id });

  registerPresenceHandlers(io, socket, userId, presence);
  registerSignalingHandlers(io, socket, userId, presence);
  registerPttHandlers(io, socket, userId);
  registerCallHandlers(io, socket, userId, presence);

  socket.on('disconnect', (reason) => {
    presence.delete(userId);
    log.info('socket disconnected', { userId, socketId: socket.id, reason });
  });
});

httpServer.listen(PORT, () => {
  log.info('PTT signaling server started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });
});
