import { Server, Socket } from 'socket.io';

export function registerPresenceHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Register this user as online
  presence.set(userId, socket.id);
  io.emit('presence:online', { userId });

  // Join all conversation rooms so messages/events reach us
  socket.on('presence:join-rooms', (roomIds: string[]) => {
    roomIds.forEach((roomId) => socket.join(roomId));
  });

  socket.on('disconnect', () => {
    presence.delete(userId);
    io.emit('presence:offline', { userId });
  });
}
