'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LocatedClause, LocatedTerm } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import styles from './HighlightedDoc.module.css';

type Props = {
  text: string;
  clauses: LocatedClause[];
  terms?: LocatedTerm[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  lang: Lang;
};

export function HighlightedDoc({ text, clauses, terms = [], selectedId, onSelect, lang }: Props) {
  const t = strings[lang];
  const severityName = { red: t.tagRed, yellow: t.tagYellow, green: t.tagGreen };
  const [openTerm, setOpenTerm] = useState<number | null>(null);
  const [bubbleAt, setBubbleAt] = useState<{ top: number; left: number } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // Place the explanation just under the word, kept inside the sheet.
  useLayoutEffect(() => {
    if (openTerm === null || !textRef.current) return setBubbleAt(null);
    const word = textRef.current.querySelector<HTMLElement>(`[data-term="${openTerm}"]`);
    if (!word) return;
    const box = textRef.current.getBoundingClientRect();
    const rect = word.getClientRects()[0] ?? word.getBoundingClientRect();
    const width = Math.min(300, box.width);
    const left = Math.max(0, Math.min(rect.left - box.left, box.width - width));
    setBubbleAt({ top: rect.bottom - box.top + 6, left });
  }, [openTerm]);

  // Tapping anywhere else, or Escape, closes it.
  useEffect(() => {
    if (openTerm === null) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest('[data-term], [data-bubble]')) {
        setOpenTerm(null);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [openTerm]);

  // Plain text between from and to, with any explained words in it made tappable.
  function withTerms(from: number, to: number): React.ReactNode[] {
    const out: React.ReactNode[] = [];
    let at = from;
    terms.forEach((term, i) => {
      if (term.start < from || term.end > to) return;
      if (term.start > at) out.push(<Fragment key={`p${at}`}>{text.slice(at, term.start)}</Fragment>);
      out.push(
        <span
          key={`w${term.start}`}
          data-term={i}
          className={`${styles.term} ${openTerm === i ? styles.termOpen : ''}`}
          role="button"
          tabIndex={0}
          aria-expanded={openTerm === i}
          onClick={(e) => {
            e.stopPropagation();
            setOpenTerm(openTerm === i ? null : i);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              setOpenTerm(openTerm === i ? null : i);
            }
          }}
        >
          {text.slice(term.start, term.end)}
        </span>,
      );
      at = term.end;
    });
    if (at < to) out.push(<Fragment key={`p${at}`}>{text.slice(at, to)}</Fragment>);
    return out;
  }

  // Clauses arrive sorted and non-overlapping, so the text splits cleanly around them.
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const c of clauses) {
    if (c.start > at) parts.push(<Fragment key={`t${at}`}>{withTerms(at, c.start)}</Fragment>);
    parts.push(
      <mark
        key={c.id}
        id={`clause-${c.id}`}
        className={`hl hl-${c.severity} ${styles.mark} ${selectedId === c.id ? styles.selected : ''}`}
        role="button"
        tabIndex={0}
        aria-pressed={selectedId === c.id}
        aria-label={`${severityName[c.severity]}: ${c.title}`}
        onClick={() => onSelect(c.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(c.id);
          }
        }}
      >
        {withTerms(c.start, c.end)}
      </mark>,
    );
    at = c.end;
  }
  if (at < text.length) parts.push(<Fragment key={`t${at}`}>{withTerms(at, text.length)}</Fragment>);

  const open = openTerm !== null ? terms[openTerm] : null;

  return (
    <article className={styles.sheet} aria-label="Your contract, with marked clauses">
      <div className={styles.text} ref={textRef}>
        {parts}
        {open && (
          <span
            data-bubble
            role="status"
            className={styles.bubble}
            style={bubbleAt ? { top: bubbleAt.top, left: bubbleAt.left } : { visibility: 'hidden' }}
          >
            <strong>{open.term}</strong> {open.plain}
          </span>
        )}
      </div>
    </article>
  );
}
