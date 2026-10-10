/** In-memory cache for today's sessions. Populated by Home, read by Reading and Chat. */
import { localDateString } from './date';

export interface CachedSession {
  id: string;
  category: string;
  source_title: string;
  reading_content: string;
  completed: boolean;
}

let sessionsCache: CachedSession[] = [];
let cacheDate: string = '';

export function setSessions(sessions: CachedSession[]): void {
  sessionsCache = sessions;
  cacheDate = localDateString();
}

export function getSession(id: string): CachedSession | undefined {
  if (cacheDate !== localDateString()) return undefined;
  return sessionsCache.find((s) => s.id === id);
}

export function getSessionByIndex(index: number): CachedSession | undefined {
  if (cacheDate !== localDateString()) return undefined;
  return sessionsCache[index];
}
