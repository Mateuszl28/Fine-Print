'use client';

import { Fragment } from 'react';
import type { LocatedClause } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import styles from './HighlightedDoc.module.css';

type Props = {
  text: string;
  clauses: LocatedClause[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  lang: Lang;
};

export function HighlightedDoc({ text, clauses, selectedId, onSelect, lang }: Props) {
  const t = strings[lang];
  const severityName = { red: t.tagRed, yellow: t.tagYellow, green: t.tagGreen };
  // Clauses arrive sorted and non-overlapping, so the text splits cleanly around them.
  const parts: React.ReactNode[] = [];
  let at = 0;
  for (const c of clauses) {
    if (c.start > at) parts.push(<Fragment key={`t${at}`}>{text.slice(at, c.start)}</Fragment>);
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
        {text.slice(c.start, c.end)}
      </mark>,
    );
    at = c.end;
  }
  if (at < text.length) parts.push(<Fragment key={`t${at}`}>{text.slice(at)}</Fragment>);

  return (
    <article className={styles.sheet} aria-label="Your contract, with marked clauses">
      <div className={styles.text}>{parts}</div>
    </article>
  );
}
