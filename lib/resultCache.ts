// Remembers recent reports for pasted text (including the samples), so the same contract
// in the same language comes back instantly and doesn't cost another model call.
// In server memory only, per function instance, and never for photos or PDFs.

import { createHash } from 'node:crypto';

type Entry<T> = { value: T; expires: number };

export function createCache<T>(max: number, ttlMs: number) {
  const map = new Map<string, Entry<T>>();
  return {
    get(key: string, now = Date.now()): T | undefined {
      const e = map.get(key);
      if (!e) return undefined;
      if (e.expires <= now) {
        map.delete(key);
        return undefined;
      }
      // refresh recency
      map.delete(key);
      map.set(key, e);
      return e.value;
    },
    set(key: string, value: T, now = Date.now()) {
      map.delete(key);
      map.set(key, { value, expires: now + ttlMs });
      while (map.size > max) map.delete(map.keys().next().value!);
    },
    get size() {
      return map.size;
    },
  };
}

export function cacheKey(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex');
}
