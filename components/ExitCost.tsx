'use client';

import { useId, useState } from 'react';
import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { money } from '@/lib/format';
import { exitAt } from '@/lib/exit';
import styles from './ExitCost.module.css';

type Props = { report: Report; lang: Lang; onJump: (clauseId: string) => void };

export function ExitCost({ report, lang, onJump }: Props) {
  const t = strings[lang];
  const id = useId();
  const plan = report.earlyExit;
  const term = report.termMonths ?? 0;
  // Start a quarter of the way in: early enough that leaving usually still costs something.
  const [month, setMonth] = useState(() => Math.max(1, Math.round(term / 4)));
  if (!plan || term < 2 || report.trueCost === null) return null;

  const fmt = (n: number) => money(n, report.currency, lang);
  const r = exitAt(month, report.costItems, plan, term);
  // A lock-in for the whole term: one sentence says it all, a slider would only repeat it.
  const lockedThroughout = !r.allowed && r.lockedUntil >= term - 1;
  const titleOf = (clauseId: string | null) => report.clauses.find((c) => c.id === clauseId)?.title;

  return (
    <section className={styles.box} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.heading}>
        {t.exitTitle}
      </h2>

      {!lockedThroughout && (
      <label className={styles.slider} htmlFor={`${id}-m`}>
        <span>{t.exitSlider(month)}</span>
        <input
          id={`${id}-m`}
          type="range"
          min={1}
          max={term - 1}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        />
      </label>
      )}

      {!r.allowed ? (
        <p className={styles.blocked}>{t.exitNotAllowed(r.lockedUntil)}</p>
      ) : (
        <dl className={styles.sum} aria-live="polite">
          <div>
            <dt>{t.exitPaid}</dt>
            <dd>
              {fmt(r.paid)}
              {r.lastMonth > month && <small>{t.exitNotice(r.lastMonth - month)}</small>}
            </dd>
          </div>
          <div>
            <dt>{t.exitFee}</dt>
            <dd>
              {r.fee > 0 ? <span className="hl hl-red">{fmt(r.fee)}</span> : fmt(0)}
              {r.charged.map(({ rule, amount }, i) => {
                const title = titleOf(rule.clauseId);
                const label = `${t.exitKinds[rule.kind as keyof typeof t.exitKinds]} · ${fmt(amount)}`;
                return (
                  <small key={i}>
                    {title ? (
                      <button type="button" className={styles.link} onClick={() => onJump(rule.clauseId!)}>
                        {label}
                      </button>
                    ) : (
                      label
                    )}
                  </small>
                );
              })}
              {r.fee === 0 && <small>{r.unstated ? t.exitUnstated : t.exitFree}</small>}
            </dd>
          </div>
          <div className={styles.total}>
            <dt>{t.exitTotal}</dt>
            <dd>{fmt(r.total)}</dd>
          </div>
          <div className={styles.full}>
            <dt>{t.exitVsFull(term)}</dt>
            <dd>{fmt(report.trueCost)}</dd>
          </div>
        </dl>
      )}

      <p className={styles.note}>{t.exitNote}</p>
    </section>
  );
}
