/**
 * Core PTT state machine
 *
 * Orchestrates:
 *  - Socket.io floor request/release
 *  - Local mic mute/unmute on all P2P connections
 *  - Wiring hardware button events → PTT actions
 */

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { setMicEnabled, initLocalStream, startConnection, registerSignalingListeners } from '../services/webrtc';
import { usePttStore } from '../store/pttStore';
import { useAuthStore } from '../store/authStore';
import { createLogger } from '../utils/logger';

const log = createLogger('usePTT');

export function usePTT(conversationId: string | null, participants: string[]) {
  const { pttState, setPttState, setFloorHolder, setParticipants } = usePttStore();
  const { user } = useAuthStore();
  const holdingRef = useRef(false); // track whether button is currently held

  // Connect to room and establish P2P connections with existing participants
  useEffect(() => {
    if (!conversationId) return;

    log.info('joining PTT room', { conversationId, participantCount: participants.length });
    const socket = getSocket();
    socket.emit('presence:join-rooms', [conversationId]);

    // Get list of peers already in this room, then open connections
    socket.emit('signal:room-peers', conversationId, async (peerIds: string[]) => {
      log.info('room peers received', { conversationId, peerIds });
      setParticipants(peerIds);
      await initLocalStream(false);
      registerSignalingListeners();

      for (const peerId of peerIds) {
        await startConnection(peerId);
      }
    });

    socket.on('ptt:granted', ({ userId }: { userId: string; conversationId: string }) => {
      log.info('ptt:granted', { userId, isSelf: userId === user?.id });
      setFloorHolder(userId);
      if (userId === user?.id) {
        setPttState('transmitting');
        setMicEnabled(true);
      } else {
        setPttState('listening');
        setMicEnabled(false);
      }
    });

    socket.on('ptt:released', () => {
      log.info('ptt:released', { conversationId });
      setFloorHolder(null);
      setMicEnabled(false);
      setPttState('idle'); // always reset — avoids stale-closure check on pttState
    });

    socket.on('ptt:rejected', ({ currentHolder }: { currentHolder: string }) => {
      log.debug('ptt:rejected — floor taken', { currentHolder });
      setPttState('idle');
    });

    return () => {
      log.info('leaving PTT room', { conversationId });
      socket.off('ptt:granted');
      socket.off('ptt:released');
      socket.off('ptt:rejected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const requestFloor = useCallback(() => {
    if (!conversationId || holdingRef.current) return;
    if (pttState === 'transmitting') return;

    log.debug('requesting floor', { conversationId });
    holdingRef.current = true;
    setPttState('requesting');
    getSocket().emit('ptt:request', { conversationId });
  }, [conversationId, pttState, setPttState]);

  const releaseFloor = useCallback(() => {
    if (!conversationId || !holdingRef.current) return;
    log.debug('releasing floor', { conversationId });
    holdingRef.current = false;
    getSocket().emit('ptt:release', { conversationId });
    setMicEnabled(false);
    setPttState('idle');
    setFloorHolder(null);
  }, [conversationId, setPttState, setFloorHolder]);

  return { pttState, requestFloor, releaseFloor };
}
