/**
 * CallKeep hook
 * Integrates with CallKit (iOS) and ConnectionService (Android) for native call UI.
 * Also handles incoming call:incoming socket events → native ringing screen.
 */

import { useEffect } from 'react';
import RNCallKeep from 'react-native-callkeep';
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/callStore';
import { createLogger } from '../utils/logger';

const log = createLogger('callKeep');

export function useCallKeep() {
  const { setIncomingCall, setActive, clearCall } = useCallStore();

  useEffect(() => {
    log.info('setting up CallKeep');
    RNCallKeep.setup({
      ios: {
        appName: 'PTT Walkie',
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
        supportsVideo: true,
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription: 'Allow PTT Walkie to manage calls',
        cancelButton: 'Cancel',
        okButton: 'OK',
        imageName: 'phone_account_icon',
        additionalPermissions: [],
      },
    });

    const socket = getSocket();

    // Incoming call from remote peer
    socket.on(
      'call:incoming',
      ({
        from,
        conversationId,
        callType,
        callId,
      }: {
        from: string;
        conversationId: string;
        callType: 'voice' | 'video';
        callId: string;
      }) => {
        log.info('incoming call', { from, callType, callId, conversationId });
        setIncomingCall(callId, callType, from, from, conversationId);
        RNCallKeep.displayIncomingCall(callId, from, from, 'generic', callType === 'video');
      },
    );

    // Native UI answered
    RNCallKeep.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
      const state = useCallStore.getState();
      log.info('call answered via native UI', { callUUID, peerId: state.peerId });
      if (state.callId !== callUUID) {
        log.warn('answerCall UUID mismatch — ignoring', { callUUID, stateCallId: state.callId });
        return;
      }

      setActive();
      socket.emit('call:accept', {
        callId: callUUID,
        callType: state.callType,
        to: state.peerId,
      });
      RNCallKeep.setCurrentCallActive(callUUID);
    });

    // Native UI ended / rejected
    RNCallKeep.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
      const state = useCallStore.getState();
      log.info('call ended via native UI', { callUUID, peerId: state.peerId });
      socket.emit('call:end', { callId: callUUID, to: state.peerId });
      clearCall();
    });

    // Remote accepted our outgoing call
    socket.on(
      'call:accepted',
      ({ callId, callType, from }: { callId: string; callType: string; from: string }) => {
        log.info('call accepted by remote', { callId, callType, from });
        setActive();
        RNCallKeep.setCurrentCallActive(callId);
      },
    );

    // Remote ended / rejected
    socket.on('call:ended', ({ callId, from }: { callId: string; from: string }) => {
      log.info('call ended by remote', { callId, from });
      RNCallKeep.endCall(callId);
      clearCall();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:ended');
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
      log.info('CallKeep listeners removed');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
