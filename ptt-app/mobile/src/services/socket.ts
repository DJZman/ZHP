import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';
import { storage } from '../store/authStore';
import { createLogger } from '../utils/logger';

const log = createLogger('socket');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    const token = storage.getString('token');
    log.debug('creating socket instance', { url: API_BASE });
    socket = io(API_BASE, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });

    socket.on('connect', () => {
      log.info('socket connected', { socketId: socket?.id });
    });

    socket.on('disconnect', (reason) => {
      log.warn('socket disconnected', { reason });
    });

    socket.on('connect_error', (err) => {
      log.error('socket connect error', { err: err.message });
    });

    socket.on('reconnect', (attempt) => {
      log.info('socket reconnected', { attempt });
    });

    socket.on('reconnect_attempt', (attempt) => {
      log.debug('socket reconnect attempt', { attempt });
    });

    socket.on('reconnect_failed', () => {
      log.error('socket reconnect failed — giving up');
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    log.info('connecting socket');
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    log.info('disconnecting socket');
    socket.disconnect();
  }
}
