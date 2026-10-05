'use client';

import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { topClauses } from '@/lib/topClauses';
import styles from './TopThree.module.css';

type Props = { report: Report; lang: Lang; onJump: (clauseId: string) => void };

export function TopThree({ report, lang, onJump }: Props) {
  const top = topClauses(report);
  if (top.length === 0) return null;
  return (
    <section className={styles.wrap} aria-labelledby="top-heading">
      <h2 id="top-heading" className="label">
        {strings[lang].topThree}
      </h2>
      <ol className={styles.list}>
        {top.map((c) => (
          <li key={c.id}>
            <button type="button" className={styles.item} onClick={() => onJump(c.id)}>
              <span className={`hl hl-${c.severity} ${styles.title}`}>{c.title}</span>
              <span className={styles.why}>{c.whyItMatters}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
