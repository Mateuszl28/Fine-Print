// Recent reports, kept in this browser only (localStorage). Never sent anywhere.

import type { Report } from './schema';
import type { Lang } from './i18n';

export type HistoryEntry = { id: string; savedAt: number; lang: Lang; report: Report };

const KEY = 'fineprint.history';
const MAX = 8;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(list) ? list.filter((e) => e?.report?.text && e.id) : [];
  } catch {
    return [];
  }
}

function save(list: HistoryEntry[]) {
  // If storage is full, drop the oldest until it fits.
  for (let n = list.length; n >= 0; n--) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, n)));
      return list.slice(0, n);
    } catch {}
  }
  return [];
}

export function addToHistory(report: Report, lang: Lang): HistoryEntry[] {
  const entry: HistoryEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, savedAt: Date.now(), lang, report };
  // Same contract read again (e.g. in another language) replaces the older copy.
  const rest = loadHistory().filter((e) => !(e.report.text === report.text && e.lang === lang));
  return save([entry, ...rest].slice(0, MAX));
}

export function removeFromHistory(id: string): HistoryEntry[] {
  return save(loadHistory().filter((e) => e.id !== id));
}

export function clearHistory(): HistoryEntry[] {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return [];
}
