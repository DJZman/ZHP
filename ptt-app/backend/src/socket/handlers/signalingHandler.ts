import { Server, Socket } from 'socket.io';

// Relay WebRTC offer/answer/ICE between peers — the server never inspects media.
export function registerSignalingHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Relay an SDP offer or answer to a specific peer
  socket.on('signal:offer', ({ to, offer }: { to: string; offer: RTCSessionDescriptionInit }) => {
    const targetSocketId = presence.get(to);
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('signal:offer', { from: userId, offer });
  });

  socket.on('signal:answer', ({ to, answer }: { to: string; answer: RTCSessionDescriptionInit }) => {
    const targetSocketId = presence.get(to);
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('signal:answer', { from: userId, answer });
  });

  socket.on(
    'signal:ice',
    ({ to, candidate }: { to: string; candidate: RTCIceCandidateInit }) => {
      const targetSocketId = presence.get(to);
      if (!targetSocketId) return;
      io.to(targetSocketId).emit('signal:ice', { from: userId, candidate });
    },
  );

  // For group sessions: request list of current participants in a room
  socket.on(
    'signal:room-peers',
    (conversationId: string, callback: (peers: string[]) => void) => {
      const room = io.sockets.adapter.rooms.get(conversationId);
      if (!room) return callback([]);

      // Map socketIds back to userIds (iterate presence map)
      const peerUserIds: string[] = [];
      for (const [uid, sid] of presence.entries()) {
        if (room.has(sid) && uid !== userId) peerUserIds.push(uid);
      }
      callback(peerUserIds);
    },
  );
}
