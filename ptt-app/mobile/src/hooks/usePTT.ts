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

export function usePTT(conversationId: string | null, participants: string[]) {
  const { pttState, setPttState, setFloorHolder, setParticipants } = usePttStore();
  const { user } = useAuthStore();
  const holdingRef = useRef(false); // track whether physical button is currently held

  // Connect to room and establish P2P connections with existing participants
  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    socket.emit('presence:join-rooms', [conversationId]);

    // Get list of peers already in this room
    socket.emit('signal:room-peers', conversationId, async (peerIds: string[]) => {
      setParticipants(peerIds);
      await initLocalStream(false);
      registerSignalingListeners();

      // Open a peer connection to every existing participant
      for (const peerId of peerIds) {
        await startConnection(peerId);
      }
    });

    // When a new participant joins, open a connection to them
    socket.on('ptt:granted', ({ userId }: { userId: string; conversationId: string }) => {
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
      setFloorHolder(null);
      setMicEnabled(false);
      if (pttState !== 'idle') setPttState('idle');
    });

    socket.on('ptt:rejected', () => {
      setPttState('idle');
    });

    return () => {
      socket.off('ptt:granted');
      socket.off('ptt:released');
      socket.off('ptt:rejected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const requestFloor = useCallback(() => {
    if (!conversationId || holdingRef.current) return;
    if (pttState === 'transmitting') return;

    holdingRef.current = true;
    setPttState('requesting');
    getSocket().emit('ptt:request', { conversationId });
  }, [conversationId, pttState, setPttState]);

  const releaseFloor = useCallback(() => {
    if (!conversationId || !holdingRef.current) return;
    holdingRef.current = false;
    getSocket().emit('ptt:release', { conversationId });
    setMicEnabled(false);
    setPttState('idle');
    setFloorHolder(null);
  }, [conversationId, setPttState, setFloorHolder]);

  return { pttState, requestFloor, releaseFloor };
}
