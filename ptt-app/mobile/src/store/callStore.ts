import { create } from 'zustand';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'incoming' | 'outgoing' | 'active';

interface CallStoreState {
  status: CallStatus;
  callId: string | null;
  callType: CallType | null;
  peerId: string | null;       // userId of the other party
  peerName: string | null;
  conversationId: string | null;

  setIncomingCall: (callId: string, callType: CallType, peerId: string, peerName: string, conversationId: string) => void;
  setOutgoingCall: (callId: string, callType: CallType, peerId: string, peerName: string, conversationId: string) => void;
  setActive: () => void;
  clearCall: () => void;
}

export const useCallStore = create<CallStoreState>((set) => ({
  status: 'idle',
  callId: null,
  callType: null,
  peerId: null,
  peerName: null,
  conversationId: null,

  setIncomingCall: (callId, callType, peerId, peerName, conversationId) =>
    set({ status: 'incoming', callId, callType, peerId, peerName, conversationId }),

  setOutgoingCall: (callId, callType, peerId, peerName, conversationId) =>
    set({ status: 'outgoing', callId, callType, peerId, peerName, conversationId }),

  setActive: () => set({ status: 'active' }),

  clearCall: () =>
    set({ status: 'idle', callId: null, callType: null, peerId: null, peerName: null, conversationId: null }),
}));
