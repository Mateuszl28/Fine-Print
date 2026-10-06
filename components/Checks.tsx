'use client';

import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { money } from '@/lib/format';
import styles from './Checks.module.css';

type Mark = 'ok' | 'out' | 'minus';
const SYMBOL: Record<Mark, string> = { ok: '✓', out: '✕', minus: '−' };

/** What the code verified and threw out for this report: the model writes, code checks. */
export function Checks({ report, lang }: { report: Report; lang: Lang }) {
  const c = report.checks;
  if (!c) return null;
  const t = strings[lang];
  const fmt = (n: number) => money(n, report.currency, lang);

  const rows: [Mark, string][] = [[c.quotes.shown > 0 ? 'ok' : 'out', t.checkQuotes(c.quotes.shown)]];
  if (c.quotes.notFound > 0) rows.push(['out', t.checkQuotesMissing(c.quotes.notFound)]);
  if (c.quotes.overlapping > 0) rows.push(['out', t.checkOverlap(c.quotes.overlapping)]);
  if (c.terms.shown > 0) rows.push(['ok', t.checkTerms(c.terms.shown)]);
  if (c.terms.left > 0) rows.push(['out', t.checkTermsLeft(c.terms.left)]);
  if (c.payments > 0) rows.push(['ok', t.checkTotal(c.payments)]);
  for (const r of c.removed) {
    const what = `${r.label} (${r.times > 1 ? `${r.times} × ` : ''}${fmt(r.amount)})`;
    rows.push(['minus', r.reason === 'deposit' ? t.checkRemovedDeposit(what) : t.checkRemovedFinanced(what)]);
  }
  if (c.exit === 'checked') rows.push(['ok', t.checkExitOk]);
  if (c.exit === 'rejected') rows.push(['out', t.checkExitRejected]);

  return (
    <section className={styles.wrap} aria-labelledby="checks-heading">
      <h2 id="checks-heading" className={styles.heading}>
        {t.checksTitle}
      </h2>
      <p className={styles.lede}>{t.checksLede}</p>
      <ul className={styles.list}>
        {rows.map(([mark, text], i) => (
          <li key={i} data-mark={mark}>
            <span className={styles.mark} aria-hidden="true">
              {SYMBOL[mark]}
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
