import { create } from 'zustand';

export type PTTState = 'idle' | 'requesting' | 'transmitting' | 'listening';

interface PTTStoreState {
  pttState: PTTState;
  floorHolder: string | null;       // userId currently transmitting
  activeConversationId: string | null;
  participants: string[];           // userIds in the active PTT room

  setPttState: (s: PTTState) => void;
  setFloorHolder: (userId: string | null) => void;
  setActiveConversation: (id: string | null) => void;
  setParticipants: (ids: string[]) => void;
}

export const usePttStore = create<PTTStoreState>((set) => ({
  pttState: 'idle',
  floorHolder: null,
  activeConversationId: null,
  participants: [],

  setPttState: (pttState) => set({ pttState }),
  setFloorHolder: (floorHolder) => set({ floorHolder }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setParticipants: (participants) => set({ participants }),
}));
