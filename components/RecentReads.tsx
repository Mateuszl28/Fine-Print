'use client';

import type { HistoryEntry } from '@/lib/history';
import { money } from '@/lib/format';
import type { Lang } from '@/lib/i18n';
import { ui } from '@/lib/ui';
import styles from './RecentReads.module.css';

type Props = {
  entries: HistoryEntry[];
  onOpen: (e: HistoryEntry) => void;
  onForget: (id: string) => void;
  onForgetAll: () => void;
  lang: Lang;
};

export function RecentReads({ entries, onOpen, onForget, onForgetAll, lang }: Props) {
  const u = ui[lang];
  if (entries.length === 0) return null;
  return (
    <section className={styles.wrap} aria-labelledby="recent-heading">
      <div className={styles.head}>
        <h2 id="recent-heading" className="label">
          {u.recentHeading}
        </h2>
        <button type="button" className={styles.link} onClick={onForgetAll}>
          {u.forgetAll}
        </button>
      </div>
      <ul className={styles.list}>
        {entries.map((e) => (
          <li key={e.id} className={styles.item}>
            <button type="button" className={styles.open} onClick={() => onOpen(e)}>
              <span className={styles.title}>{e.report.counterparty || e.report.title}</span>
              <span className={styles.meta}>
                {e.report.title}
                {e.report.trueCost !== null && <> · {money(e.report.trueCost, e.report.currency, e.lang)}</>} ·{' '}
                {e.report.score}/10 ·{' '}
                {new Date(e.savedAt).toLocaleDateString(e.lang, { day: 'numeric', month: 'short' })}
              </span>
            </button>
            <button
              type="button"
              className={styles.forget}
              onClick={() => onForget(e.id)}
              aria-label={`${u.forget}: ${e.report.counterparty || e.report.title}`}
            >
              {u.forget}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
