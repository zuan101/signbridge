import type { ConversationSession } from '../conversation/types';
import { getStorageItem, setStorageItem, removeStorageItem } from '../../lib/storage';

const HISTORY_STORAGE_KEY = 'signbridge_history_v1';

export function getAllSessions(): ConversationSession[] {
  return getStorageItem<ConversationSession[]>(HISTORY_STORAGE_KEY, []);
}

export function saveSession(session: ConversationSession): boolean {
  if (!session.messages || session.messages.length === 0) return false;
  const sessions = getAllSessions();
  const existingIdx = sessions.findIndex(s => s.id === session.id);

  if (existingIdx >= 0) {
    sessions[existingIdx] = session;
  } else {
    sessions.unshift(session);
  }

  return setStorageItem(HISTORY_STORAGE_KEY, sessions);
}

export function deleteSession(id: string): boolean {
  const sessions = getAllSessions().filter(s => s.id !== id);
  return setStorageItem(HISTORY_STORAGE_KEY, sessions);
}

export function clearAllHistory(): boolean {
  return removeStorageItem(HISTORY_STORAGE_KEY);
}

export function exportAllDataAsJson(): string {
  const sessions = getAllSessions();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'SignBridge',
      version: '1.0.0',
      totalSessions: sessions.length,
      sessions,
    },
    null,
    2
  );
}
