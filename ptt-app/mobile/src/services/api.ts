import { storage } from '../store/authStore';

// Change this to your server address
export const API_BASE = __DEV__ ? 'http://localhost:3001' : 'https://your-ptt-server.com';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getString('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  register: (phone: string, displayName: string) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, displayName }),
    }),

  login: (phone: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  updateTokens: (fcmToken?: string, apnsToken?: string) =>
    request('/auth/tokens', {
      method: 'PUT',
      body: JSON.stringify({ fcmToken, apnsToken }),
    }),

  getConversations: () => request<any[]>('/conversations'),

  findOrCreateDirect: (targetUserId: string) =>
    request<any>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  createGroup: (name: string, memberIds: string[]) =>
    request<any>('/conversations/group', {
      method: 'POST',
      body: JSON.stringify({ name, memberIds }),
    }),

  getMessages: (conversationId: string, cursor?: string) =>
    request<any[]>(`/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ''}`),

  matchContacts: (phones: string[]) =>
    request<any[]>('/contacts/match', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    }),
};
