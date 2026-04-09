import { Server, Socket } from 'socket.io';
import { logger } from '../../logger';

const log = logger('presence');

export function registerPresenceHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Register this user as online
  presence.set(userId, socket.id);
  log.info('user online', { userId, socketId: socket.id, onlineCount: presence.size });
  io.emit('presence:online', { userId });

  // Join all conversation rooms so messages/events reach us
  socket.on('presence:join-rooms', (roomIds: string[]) => {
    roomIds.forEach((roomId) => {
      socket.join(roomId);
      log.debug('user joined room', { userId, roomId });
    });
  });

  socket.on('disconnect', () => {
    presence.delete(userId);
    log.info('user offline', { userId, onlineCount: presence.size });
    io.emit('presence:offline', { userId });
  });
}
