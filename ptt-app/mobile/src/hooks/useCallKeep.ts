/**
 * CallKeep hook
 * Integrates with CallKit (iOS) and ConnectionService (Android) for native call UI.
 * Also handles incoming call:incoming socket events → native ringing screen.
 */

import { useEffect } from 'react';
import RNCallKeep from 'react-native-callkeep';
import { v4 as uuidv4 } from 'uuid'; // react-native compatible — install uuid@9
import { getSocket } from '../services/socket';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';

export function useCallKeep() {
  const { setIncomingCall, setActive, clearCall } = useCallStore();
  const { user } = useAuthStore();

  useEffect(() => {
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
        setIncomingCall(callId, callType, from, from, conversationId);
        RNCallKeep.displayIncomingCall(callId, from, from, 'generic', callType === 'video');
      },
    );

    // Native UI answered
    RNCallKeep.addEventListener('answerCall', ({ callUUID }: { callUUID: string }) => {
      const state = useCallStore.getState();
      if (state.callId !== callUUID) return;

      setActive();
      socket.emit('call:accept', {
        callId: callUUID,
        callType: state.callType,
        to: state.peerId,
      });
      RNCallKeep.setCurrentCallActive(callUUID);
    });

    // Native UI ended
    RNCallKeep.addEventListener('endCall', ({ callUUID }: { callUUID: string }) => {
      const state = useCallStore.getState();
      socket.emit('call:end', { callId: callUUID, to: state.peerId });
      clearCall();
    });

    // Remote accepted our outgoing call
    socket.on(
      'call:accepted',
      ({ callId }: { callId: string }) => {
        setActive();
        RNCallKeep.setCurrentCallActive(callId);
      },
    );

    // Remote ended / rejected
    socket.on('call:ended', ({ callId }: { callId: string }) => {
      RNCallKeep.endCall(callId);
      clearCall();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:ended');
      RNCallKeep.removeEventListener('answerCall');
      RNCallKeep.removeEventListener('endCall');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
