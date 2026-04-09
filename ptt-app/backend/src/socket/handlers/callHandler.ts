import { Server, Socket } from 'socket.io';
import { prisma } from '../../prisma';
import { logger } from '../../logger';

const log = logger('call');

export type CallType = 'voice' | 'video';

export function registerCallHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Caller initiates a call to another user
  socket.on(
    'call:invite',
    ({
      to,
      conversationId,
      callType,
      callId,
    }: {
      to: string;
      conversationId: string;
      callType: CallType;
      callId: string;
    }) => {
      const targetSocketId = presence.get(to);
      log.info('call:invite', { from: userId, to, callType, callId, targetOnline: !!targetSocketId });

      if (targetSocketId) {
        io.to(targetSocketId).emit('call:incoming', {
          from: userId,
          conversationId,
          callType,
          callId,
        });
      } else {
        // TODO: send VoIP push notification via APNs/FCM when peer is offline
        log.warn('call:invite — target offline, push not yet implemented', { to, callId });
      }
    },
  );

  // Callee accepts
  socket.on(
    'call:accept',
    ({ callId, callType, to }: { callId: string; callType: CallType; to: string }) => {
      const callerSocketId = presence.get(to);
      log.info('call:accept', { from: userId, to, callType, callId });
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { callId, callType, from: userId });
      } else {
        log.warn('call:accept — caller no longer online', { callId, to });
      }
    },
  );

  // Either side hangs up
  socket.on('call:end', ({ callId, to }: { callId: string; to: string }) => {
    const peerSocketId = presence.get(to);
    log.info('call:end', { from: userId, to, callId });
    if (peerSocketId) {
      io.to(peerSocketId).emit('call:ended', { callId, from: userId });
    }
  });

  // Text messages (persisted to DB and broadcast to room)
  socket.on(
    'message:send',
    async ({
      conversationId,
      body,
      type = 'TEXT',
    }: {
      conversationId: string;
      body: string;
      type?: 'TEXT' | 'PTT_CLIP' | 'SYSTEM';
    }) => {
      log.debug('message:send', { userId, conversationId, type, bodyLen: body.length });
      try {
        const message = await prisma.message.create({
          data: { conversationId, senderId: userId, body, type },
          include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
        });
        io.to(conversationId).emit('message:receive', message);
        log.debug('message persisted and broadcast', { messageId: message.id, conversationId });
      } catch (err: any) {
        log.error('message:send db error', { err: err.message, userId, conversationId });
        socket.emit('message:error', { conversationId, error: 'Failed to send message' });
      }
    },
  );
}
