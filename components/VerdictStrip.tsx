'use client';

import type { Report } from '@/lib/schema';
import styles from './VerdictStrip.module.css';

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

type Props = { report: Report; onJump: (clauseId: string) => void };

export function VerdictStrip({ report, onJump }: Props) {
  const { trueCost, currency, termMonths } = report;
  const term = termMonths ? `over ${termMonths} months` : 'over the term';

  return (
    <section className={styles.strip} aria-label="What it really costs">
      <div className={styles.numbers}>
        <div>
          <p className="label">They say</p>
          <p className={styles.said}>{report.advertised.label}</p>
        </div>
        <div>
          <p className="label">It really costs</p>
          {trueCost !== null ? (
            <p className={styles.real}>
              <span className="hl hl-red">{money(trueCost, currency)}</span>
              <span className={styles.term}>{term}</span>
            </p>
          ) : (
            <p className={styles.noMoney}>No prices in this document, so there&rsquo;s nothing to add up.</p>
          )}
        </div>
        <div className={styles.scoreBox}>
          <p className="label">Fairness</p>
          <p className={styles.score}>
            {report.score}
            <span>/10</span>
          </p>
        </div>
      </div>

      <p className={styles.verdict}>{report.verdict}</p>

      {report.costItems.length > 0 && (
        <details className={styles.breakdown}>
          <summary>How we got that number</summary>
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
                  {item.times !== 1 && `${item.times} × ${money(item.amount, currency)} = `}
                  <strong>{money(item.amount * item.times, currency)}</strong>
                </span>
              </li>
            ))}
            {trueCost !== null && (
              <li className={styles.total}>
                <span>Total</span>
                <strong>{money(trueCost, currency)}</strong>
              </li>
            )}
          </ul>
          <p className={styles.assumption}>{report.costAssumption}</p>
        </details>
      )}
    </section>
  );
}
