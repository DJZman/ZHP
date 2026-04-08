import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import authRouter from './routes/auth';
import conversationsRouter from './routes/conversations';
import contactsRouter from './routes/contacts';

import { registerPresenceHandlers } from './socket/handlers/presenceHandler';
import { registerSignalingHandlers } from './socket/handlers/signalingHandler';
import { registerPttHandlers } from './socket/handlers/pttHandler';
import { registerCallHandlers } from './socket/handlers/callHandler';

export const prisma = new PrismaClient();
export const presence = new Map<string, string>(); // userId → socketId

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/conversations', conversationsRouter);
app.use('/contacts', contactsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket'],
});

// JWT middleware for Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('No token'));
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { userId: string };
    socket.data.userId = payload.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId: string = socket.data.userId;
  console.log(`[Socket] connected userId=${userId} socketId=${socket.id}`);

  registerPresenceHandlers(io, socket, userId, presence);
  registerSignalingHandlers(io, socket, userId, presence);
  registerPttHandlers(io, socket, userId);
  registerCallHandlers(io, socket, userId, presence);

  socket.on('disconnect', () => {
    presence.delete(userId);
    console.log(`[Socket] disconnected userId=${userId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`PTT signaling server running on port ${PORT}`);
});
