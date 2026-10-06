// What the other side answered to "Before you sign, ask", noted by the reader at the counter.
// Kept in this browser only, per contract; never sent anywhere.

export type Answer = { done: boolean; note: string };
export type AskNotes = { answers: Record<string, Answer>; extra: { q: string; done: boolean; note: string }[] };

const PREFIX = 'fineprint.answers.';
const MAX_NOTE = 1000;
const MAX_EXTRA = 10;

export const emptyNotes = (): AskNotes => ({ answers: {}, extra: [] });

/** One key per contract (and its questions), so a reopened report finds its notes again. */
export function notesKey(text: string, questions: string[]): string {
  let h = 0;
  for (const s of [text, ...questions]) for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return PREFIX + (h >>> 0).toString(36);
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function loadNotes(key: string, store: Store = localStorage): AskNotes {
  try {
    const raw = store.getItem(key);
    const v = raw ? (JSON.parse(raw) as AskNotes) : null;
    if (!v || typeof v.answers !== 'object' || !Array.isArray(v.extra)) return emptyNotes();
    return v;
  } catch {
    return emptyNotes();
  }
}

export function saveNotes(key: string, notes: AskNotes, store: Store = localStorage) {
  const clean: AskNotes = {
    answers: Object.fromEntries(
      Object.entries(notes.answers)
        .filter(([, a]) => a.done || a.note.trim())
        .map(([k, a]) => [k, { done: a.done, note: a.note.slice(0, MAX_NOTE) }]),
    ),
    extra: notes.extra.slice(0, MAX_EXTRA).map((e) => ({ q: e.q.slice(0, 300), done: e.done, note: e.note.slice(0, MAX_NOTE) })),
  };
  try {
    if (Object.keys(clean.answers).length === 0 && clean.extra.length === 0) store.removeItem(key);
    else store.setItem(key, JSON.stringify(clean));
  } catch {
    // Private mode or full storage: the notes still work for this visit.
  }
}

/** How many questions (the report's and the reader's own) have been answered. */
export function progress(notes: AskNotes, questionCount: number): { done: number; total: number } {
  const done =
    Array.from({ length: questionCount }, (_, i) => notes.answers[i]?.done).filter(Boolean).length +
    notes.extra.filter((e) => e.done).length;
  return { done, total: questionCount + notes.extra.length };
}
