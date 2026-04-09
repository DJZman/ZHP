import { Server, Socket } from 'socket.io';
import { logger } from '../../logger';

const log = logger('signaling');

// Relay WebRTC offer/answer/ICE between peers — the server never inspects media.
export function registerSignalingHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Relay an SDP offer to a specific peer
  socket.on('signal:offer', ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
    const targetSocketId = presence.get(to);
    if (!targetSocketId) {
      log.warn('signal:offer target not online', { from: userId, to });
      return;
    }
    log.debug('signal:offer relayed', { from: userId, to });
    io.to(targetSocketId).emit('signal:offer', { from: userId, offer });
  });

  socket.on('signal:answer', ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
    const targetSocketId = presence.get(to);
    if (!targetSocketId) {
      log.warn('signal:answer target not online', { from: userId, to });
      return;
    }
    log.debug('signal:answer relayed', { from: userId, to });
    io.to(targetSocketId).emit('signal:answer', { from: userId, answer });
  });

  socket.on(
    'signal:ice',
    ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
      const targetSocketId = presence.get(to);
      if (!targetSocketId) {
        log.debug('signal:ice target not online (may have disconnected)', { from: userId, to });
        return;
      }
      io.to(targetSocketId).emit('signal:ice', { from: userId, candidate });
    },
  );

  // For group sessions: return list of current participants in a room
  socket.on(
    'signal:room-peers',
    (conversationId: string, callback: (peers: string[]) => void) => {
      const room = io.sockets.adapter.rooms.get(conversationId);
      if (!room) {
        log.debug('signal:room-peers — room empty', { userId, conversationId });
        return callback([]);
      }

      const peerUserIds: string[] = [];
      for (const [uid, sid] of presence.entries()) {
        if (room.has(sid) && uid !== userId) peerUserIds.push(uid);
      }
      log.debug('signal:room-peers', { userId, conversationId, peers: peerUserIds });
      callback(peerUserIds);
    },
  );
}
