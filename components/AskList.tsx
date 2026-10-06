'use client';

import { useEffect, useState } from 'react';
import { strings, type Lang } from '@/lib/i18n';
import { emptyNotes, loadNotes, notesKey, progress, saveNotes, type AskNotes } from '@/lib/answers';
import styles from './AskList.module.css';

type Props = { questions: string[]; text: string; lang: Lang };

/** "Before you sign, ask" as a checklist for the conversation: tick what's answered, note what they said. */
export function AskList({ questions, text, lang }: Props) {
  const t = strings[lang];
  const key = notesKey(text, questions);
  const [notes, setNotes] = useState<AskNotes>(emptyNotes);
  const [draft, setDraft] = useState('');

  useEffect(() => setNotes(loadNotes(key)), [key]);

  function update(next: AskNotes) {
    setNotes(next);
    saveNotes(key, next);
  }

  const setAnswer = (i: number, patch: Partial<{ done: boolean; note: string }>) =>
    update({ ...notes, answers: { ...notes.answers, [i]: { ...(notes.answers[i] ?? { done: false, note: '' }), ...patch } } });
  const setExtra = (i: number, patch: Partial<{ done: boolean; note: string }>) =>
    update({ ...notes, extra: notes.extra.map((e, n) => (n === i ? { ...e, ...patch } : e)) });

  const rows = [
    ...questions.map((q, i) => ({ q, a: notes.answers[i] ?? { done: false, note: '' }, set: (p: Partial<{ done: boolean; note: string }>) => setAnswer(i, p), remove: null })),
    ...notes.extra.map((e, i) => ({ q: e.q, a: e, set: (p: Partial<{ done: boolean; note: string }>) => setExtra(i, p), remove: () => update({ ...notes, extra: notes.extra.filter((_, n) => n !== i) }) })),
  ];
  if (rows.length === 0) return null;
  const { done, total } = progress(notes, questions.length);

  return (
    <section className={styles.wrap} aria-labelledby="ask-heading">
      <div className={styles.head}>
        <h2 id="ask-heading" className={styles.heading}>
          {t.ask}
        </h2>
        <span className={styles.progress} aria-live="polite">
          {t.askProgress(done, total)}
        </span>
      </div>
      <ol className={styles.list}>
        {rows.map((row, i) => (
          <li key={i} data-done={row.a.done || undefined}>
            <label className={styles.question}>
              <input type="checkbox" checked={row.a.done} onChange={(e) => row.set({ done: e.target.checked })} />
              <span>{row.q}</span>
            </label>
            {(row.a.done || row.a.note) && (
              <>
                <input
                  className={styles.note}
                  value={row.a.note}
                  placeholder={t.askTheySaid}
                  aria-label={`${t.askTheySaid}: ${row.q}`}
                  maxLength={1000}
                  onChange={(e) => row.set({ note: e.target.value })}
                />
                {row.a.note && <p className={styles.printNote}>{row.a.note}</p>}
              </>
            )}
            {row.remove && (
              <button type="button" className={styles.remove} onClick={row.remove}>
                {t.askRemove}
              </button>
            )}
          </li>
        ))}
      </ol>
      <form
        className={styles.add}
        onSubmit={(e) => {
          e.preventDefault();
          const q = draft.trim();
          if (!q) return;
          update({ ...notes, extra: [...notes.extra, { q, done: false, note: '' }] });
          setDraft('');
        }}
      >
        <input
          value={draft}
          maxLength={300}
          placeholder={t.askAddPlaceholder}
          aria-label={t.askAddPlaceholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" disabled={!draft.trim()}>
          {t.askAdd}
        </button>
      </form>
      <p className={styles.local}>{t.askLocal}</p>
    </section>
  );
}
