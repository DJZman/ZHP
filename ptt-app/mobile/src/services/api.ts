import { storage } from '../store/authStore';
import { createLogger } from '../utils/logger';

const log = createLogger('api');

// Change this to your server address
export const API_BASE = __DEV__ ? 'http://localhost:3001' : 'https://zapptt.up.railway.app';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getString('token');
  const url = `${API_BASE}${path}`;

  log.debug('request', { method: options.method ?? 'GET', path });

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    log.error('request failed', { path, status: res.status, error: err.error });
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  log.debug('response ok', { path, status: res.status });
  return res.json() as Promise<T>;
}

export const api = {
  register: (phone: string, displayName: string) => {
    log.info('register', { phone });
    return request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, displayName }),
    });
  },

  login: (phone: string) => {
    log.info('login', { phone });
    return request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  updateTokens: (fcmToken?: string, apnsToken?: string) =>
    request('/auth/tokens', {
      method: 'PUT',
      body: JSON.stringify({ fcmToken, apnsToken }),
    }),

  getConversations: () => {
    log.debug('getConversations');
    return request<any[]>('/conversations');
  },

  findOrCreateDirect: (targetUserId: string) => {
    log.info('findOrCreateDirect', { targetUserId });
    return request<any>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  },

  createGroup: (name: string, memberIds: string[]) => {
    log.info('createGroup', { name, memberCount: memberIds.length });
    return request<any>('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ name, memberIds }),
    });
  },

  getMessages: (conversationId: string, cursor?: string) => {
    log.debug('getMessages', { conversationId, cursor });
    return request<any[]>(`/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ''}`);
  },

  matchContacts: (phones: string[]) => {
    log.info('matchContacts', { phoneCount: phones.length });
    return request<any[]>('/contacts/match', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    });
  },
};
