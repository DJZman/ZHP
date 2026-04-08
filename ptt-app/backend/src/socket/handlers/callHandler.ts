import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export type CallType = 'voice' | 'video';

export function registerCallHandlers(
  io: Server,
  socket: Socket,
  userId: string,
  presence: Map<string, string>,
) {
  // Caller initiates a call to another user or group
  socket.on(
    'call:invite',
    ({
      to,
      conversationId,
      callType,
      callId,
    }: {
      to: string; // target userId (direct) or conversationId (group)
      conversationId: string;
      callType: CallType;
      callId: string;
    }) => {
      const targetSocketId = presence.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:incoming', {
          from: userId,
          conversationId,
          callType,
          callId,
        });
      }
      // TODO: send push notification if targetSocketId is null (offline peer)
    },
  );

  // Callee accepts
  socket.on(
    'call:accept',
    ({ callId, callType, to }: { callId: string; callType: CallType; to: string }) => {
      const callerSocketId = presence.get(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { callId, callType, from: userId });
      }
    },
  );

  // Either side declines / hangs up
  socket.on('call:end', ({ callId, to }: { callId: string; to: string }) => {
    const peerSocketId = presence.get(to);
    if (peerSocketId) {
      io.to(peerSocketId).emit('call:ended', { callId, from: userId });
    }
  });

  // Text messages
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
      // Persist to DB (import prisma lazily to avoid circular dep)
      const { prisma } = await import('../../index');
      const message = await prisma.message.create({
        data: { conversationId, senderId: userId, body, type },
        include: { sender: { select: { id: true, displayName: true, avatarUrl: true } } },
      });

      // Broadcast to all members in the room
      io.to(conversationId).emit('message:receive', message);
    },
  );
}
