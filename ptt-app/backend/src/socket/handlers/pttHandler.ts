import { Server, Socket } from 'socket.io';

// Per-conversation PTT floor state
const floorState = new Map<string, string | null>(); // conversationId → userId | null

export function registerPttHandlers(io: Server, socket: Socket, userId: string) {
  socket.on('ptt:request', ({ conversationId }: { conversationId: string }) => {
    const current = floorState.get(conversationId) ?? null;

    if (current === null) {
      // Floor is free — grant it
      floorState.set(conversationId, userId);
      io.to(conversationId).emit('ptt:granted', { userId, conversationId });
    } else {
      // Floor is taken
      socket.emit('ptt:rejected', { currentHolder: current, conversationId });
    }
  });

  socket.on('ptt:release', ({ conversationId }: { conversationId: string }) => {
    const current = floorState.get(conversationId);
    if (current !== userId) return; // only the holder can release

    floorState.set(conversationId, null);
    io.to(conversationId).emit('ptt:released', { conversationId });
  });

  socket.on('disconnect', () => {
    // Release all floors held by this user
    for (const [convId, holder] of floorState.entries()) {
      if (holder === userId) {
        floorState.set(convId, null);
        io.to(convId).emit('ptt:released', { conversationId: convId });
      }
    }
  });
}
