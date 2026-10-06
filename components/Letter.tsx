'use client';

import { useEffect, useRef, useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { LETTER_KINDS, type Letter as LetterT, type LetterKind } from '@/lib/letter';
import styles from './Letter.module.css';

type Status = 'idle' | 'working' | 'failed' | 'busy';

export function Letter({ report, lang }: { report: Report; lang: Lang }) {
  const t = strings[lang];
  const [kind, setKind] = useState<LetterKind>(report.letter.kind);
  const [letters, setLetters] = useState<Partial<Record<LetterKind, LetterT>>>({
    [report.letter.kind]: report.letter,
  });
  // Traps first; if there are none, the watch-outs.
  const choices = report.clauses.filter((c) => c.severity !== 'green');
  // A change request starts with every trap ticked; a complaint is usually about one thing, so nothing.
  const [pickedBy, setPickedBy] = useState<Record<'change_request' | 'complaint', Set<string>>>(() => {
    const red = choices.filter((c) => c.severity === 'red');
    return { change_request: new Set((red.length ? red : choices).map((c) => c.id)), complaint: new Set() };
  });
  const picked = kind === 'cancellation' ? new Set<string>() : pickedBy[kind];
  const [happened, setHappened] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const letter = letters[kind];
  const needsClauses = kind !== 'cancellation';
  const heading = { cancellation: t.letterCancel, change_request: t.letterChange, complaint: t.letterComplaint }[kind];
  const kindLabel = { cancellation: t.kindCancel, change_request: t.kindChange, complaint: t.kindComplaint };

  function choose(k: LetterKind) {
    abort.current?.abort();
    setStatus('idle');
    setKind(k);
  }

  function toggle(id: string) {
    if (kind === 'cancellation') return;
    setPickedBy((prev) => {
      const next = new Set(prev[kind]);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [kind]: next };
    });
  }

  async function write() {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus('working');
    const forKind = kind;
    try {
      const res = await fetch('/api/letter', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          kind: forKind,
          text: report.text,
          counterparty: report.counterparty,
          notice: report.notice,
          clauses: needsClauses
            ? choices.filter((c) => picked.has(c.id)).map(({ title, quote }) => ({ title, quote }))
            : [],
          happened: forKind === 'complaint' ? happened : '',
        }),
      });
      if (res.status === 429) return setStatus('busy');
      const json = (await res.json().catch(() => null)) as LetterT | null;
      if (!res.ok || !json?.body) return setStatus('failed');
      setLetters((prev) => ({ ...prev, [forKind]: json }));
      setStatus('idle');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setStatus('failed');
    }
  }

  function redo() {
    setLetters((prev) => ({ ...prev, [kind]: undefined }));
  }

  async function copy() {
    if (!letter) return;
    const full = `${t.subject}: ${letter.subject}\n\n${letter.body}`;
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      // Older browsers / insecure origins: fall back to a hidden textarea
      const ta = document.createElement('textarea');
      ta.value = full;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const working = status === 'working';

  return (
    <section className={styles.wrap} aria-labelledby="letter-heading">
      <div className={styles.kinds} role="group" aria-label={t.letterKinds}>
        {LETTER_KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => choose(k)}>
            {kindLabel[k]}
          </button>
        ))}
      </div>

      <div className={styles.head}>
        <h2 id="letter-heading" className={styles.heading}>
          {heading}
        </h2>
        {letter && (
          <button type="button" className={styles.copy} onClick={copy}>
            {copied ? t.copied : t.copy}
          </button>
        )}
      </div>

      {letter ? (
        <>
          <div className={styles.paper}>
            <p className={styles.subject}>
              <span className="label">{t.subject}</span> {letter.subject}
            </p>
            <pre className={styles.body}>{letter.body}</pre>
          </div>
          <p className={styles.tip}>
            {t.letterTip}
            {needsClauses && choices.length > 0 && (
              <>
                {' '}
                <button type="button" className={styles.linkish} onClick={redo}>
                  {t.letterRedo}
                </button>
              </>
            )}
          </p>
        </>
      ) : (
        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            write();
          }}
        >
          {needsClauses && (
            <fieldset className={styles.pick} disabled={working}>
              <legend>{t.letterPick}</legend>
              {choices.map((c) => (
                <label key={c.id} className={styles.option}>
                  <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
                  <span className={`hl hl-${c.severity}`}>{c.title}</span>
                </label>
              ))}
            </fieldset>
          )}
          {kind === 'complaint' && (
            <label className={styles.happened}>
              <span>{t.letterHappened}</span>
              <textarea
                value={happened}
                maxLength={600}
                rows={3}
                placeholder={t.letterHappenedHint}
                disabled={working}
                onChange={(e) => setHappened(e.target.value)}
              />
            </label>
          )}
          <button
            type="submit"
            className={styles.write}
            disabled={working || (needsClauses && picked.size === 0)}
          >
            {working ? t.letterWriting : t.letterWrite}
          </button>
          {status === 'failed' && <p className={styles.error}>{t.letterFailed}</p>}
          {status === 'busy' && <p className={styles.error}>{t.letterBusy}</p>}
        </form>
      )}

      <span className="sr-only" aria-live="polite">
        {copied ? t.copied : working ? t.letterWriting : ''}
      </span>
    </section>
  );
}
