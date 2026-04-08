import { io, Socket } from 'socket.io-client';
import { API_BASE } from './api';
import { storage } from '../store/authStore';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    const token = storage.getString('token');
    socket = io(API_BASE, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
