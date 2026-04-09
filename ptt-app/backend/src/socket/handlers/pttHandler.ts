import { Server, Socket } from 'socket.io';
import { logger } from '../../logger';

const log = logger('ptt');

// Per-conversation PTT floor state
const floorState = new Map<string, string | null>(); // conversationId → userId | null

export function registerPttHandlers(io: Server, socket: Socket, userId: string) {
  socket.on('ptt:request', ({ conversationId }: { conversationId: string }) => {
    const current = floorState.get(conversationId) ?? null;

    if (current === null) {
      // Floor is free — grant it
      floorState.set(conversationId, userId);
      log.info('ptt:granted', { userId, conversationId });
      io.to(conversationId).emit('ptt:granted', { userId, conversationId });
    } else {
      log.debug('ptt:rejected — floor taken', { requester: userId, holder: current, conversationId });
      socket.emit('ptt:rejected', { currentHolder: current, conversationId });
    }
  });

  socket.on('ptt:release', ({ conversationId }: { conversationId: string }) => {
    const current = floorState.get(conversationId);
    if (current !== userId) {
      log.warn('ptt:release ignored — not the floor holder', { userId, holder: current, conversationId });
      return;
    }

    floorState.set(conversationId, null);
    log.info('ptt:released', { userId, conversationId });
    io.to(conversationId).emit('ptt:released', { conversationId });
  });

  socket.on('disconnect', () => {
    // Auto-release all floors held by this user on disconnect
    for (const [convId, holder] of floorState.entries()) {
      if (holder === userId) {
        floorState.set(convId, null);
        log.info('ptt:released on disconnect', { userId, conversationId: convId });
        io.to(convId).emit('ptt:released', { conversationId: convId });
      }
    }
  });
}
