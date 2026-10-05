'use client';

import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import styles from './VerdictStrip.module.css';

function money(n: number, currency: string, lang: Lang) {
  try {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang, {
      style: 'currency',
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

type Props = { report: Report; lang: Lang; onJump: (clauseId: string) => void };

export function VerdictStrip({ report, lang, onJump }: Props) {
  const t = strings[lang];
  const { trueCost, currency, termMonths } = report;
  const term = termMonths ? t.overMonths(termMonths) : t.overTerm;
  const fmt = (n: number) => money(n, currency, lang);

  return (
    <section className={styles.strip} aria-label="What it really costs">
      <div className={styles.numbers}>
        <div>
          <p className="label">{t.theySay}</p>
          <p className={styles.said}>{report.advertised.label}</p>
        </div>
        <div>
          <p className="label">{t.reallyCosts}</p>
          {trueCost !== null ? (
            <p className={styles.real}>
              <span className="hl hl-red">{fmt(trueCost)}</span>
              <span className={styles.term}>{term}</span>
            </p>
          ) : (
            <p className={styles.noMoney}>{t.noPrices}</p>
          )}
        </div>
        <div className={styles.scoreBox}>
          <p className="label">{t.fairness}</p>
          <p className={styles.score}>
            {report.score}
            <span>/10</span>
          </p>
        </div>
      </div>

      <p className={styles.verdict}>{report.verdict}</p>

      {report.costItems.length > 0 && (
        <details className={styles.breakdown}>
          <summary>{t.howWeGotIt}</summary>
          <ul>
            {report.costItems.map((item, i) => (
              <li key={i}>
                {item.clauseId ? (
                  <button type="button" className={styles.itemLink} onClick={() => onJump(item.clauseId!)}>
                    {item.label}
                  </button>
                ) : (
                  <span>{item.label}</span>
                )}
                <span className={styles.calc}>
                  {item.times !== 1 && `${item.times} × ${fmt(item.amount)} = `}
                  <strong>{fmt(item.amount * item.times)}</strong>
                </span>
              </li>
            ))}
            {trueCost !== null && (
              <li className={styles.total}>
                <span>{t.total}</span>
                <strong>{fmt(trueCost)}</strong>
              </li>
            )}
          </ul>
          <p className={styles.assumption}>{report.costAssumption}</p>
        </details>
      )}
    </section>
  );
}
