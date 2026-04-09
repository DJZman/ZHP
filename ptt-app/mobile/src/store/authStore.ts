import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'ptt-auth' });

export interface AuthUser {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
}

// Rehydrate from MMKV synchronously at startup
const savedToken = storage.getString('token') ?? null;
const savedUser = storage.getString('user') ? JSON.parse(storage.getString('user')!) : null;

export const useAuthStore = create<AuthState>((set) => ({
  token: savedToken,
  user: savedUser,
  setAuth: (token, user) => {
    storage.set('token', token);
    storage.set('user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    storage.delete('token');
    storage.delete('user');
    set({ token: null, user: null });
  },
}));
