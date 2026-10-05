'use client';

import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { money } from '@/lib/format';
import { compareReports } from '@/lib/compare';
import { topClauses } from '@/lib/topClauses';
import styles from './CompareView.module.css';

type Props = {
  reports: [Report, Report];
  lang: Lang;
  onOpen: (index: 0 | 1) => void;
  onStartOver: () => void;
};

export function CompareView({ reports, lang, onOpen, onStartOver }: Props) {
  const t = strings[lang];
  const c = compareReports(reports[0], reports[1]);

  return (
    <main className={styles.page} lang={lang}>
      <nav className={styles.bar}>
        <button type="button" className={styles.back} onClick={onStartOver}>
          {t.scanAnother}
        </button>
        <span className={styles.wordmark}>Fine Print</span>
      </nav>

      <h1 className={styles.title}>{t.compareTitle}</h1>
      {!c.sameCurrency && <p className={styles.note}>{t.currencyMismatch}</p>}

      <div className={styles.cols}>
        {reports.map((r, i) => {
          const fmt = (n: number) => money(n, r.currency, lang);
          const wins = c.cheaper === i;
          return (
            <article key={i} className={`${styles.col} ${wins ? styles.winner : ''}`}>
              <p className="label">{r.counterparty}</p>
              <h2 className={styles.name}>{r.title}</h2>

              <div className={styles.badges}>
                {wins && c.difference !== null && (
                  <span className={`hl hl-green ${styles.badge}`}>
                    {t.cheaperBy(fmt(c.difference))}
                  </span>
                )}
                {c.fairer === i && <span className={`hl hl-yellow ${styles.badge}`}>{t.fairer}</span>}
                {c.difference === 0 && i === 0 && <span className={styles.badge}>{t.sameCost}</span>}
              </div>

              <dl className={styles.facts}>
                <div>
                  <dt className="label">{t.theySay}</dt>
                  <dd className={styles.said}>{r.advertised.label}</dd>
                </div>
                <div>
                  <dt className="label">{t.reallyCosts}</dt>
                  <dd className={styles.real}>
                    {r.trueCost !== null ? fmt(r.trueCost) : '—'}
                    <span className={styles.sub}>
                      {r.termMonths ? t.overMonths(r.termMonths) : t.overTerm}
                      {c.monthly[i] !== null && ` · ${fmt(c.monthly[i]!)} ${t.perMonth}`}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="label">{t.fairness}</dt>
                  <dd className={styles.score}>
                    {r.score}
                    <span>/10</span>
                  </dd>
                </div>
              </dl>

              <p className={styles.verdict}>{r.verdict}</p>

              <ul className={styles.traps}>
                {topClauses(r).map((cl) => (
                  <li key={cl.id}>
                    <span className={`hl hl-${cl.severity}`}>{cl.title}</span>
                  </li>
                ))}
              </ul>

              <button type="button" className={styles.open} onClick={() => onOpen(i as 0 | 1)}>
                {t.openFull} &rarr;
              </button>
            </article>
          );
        })}
      </div>

      <footer className={styles.footer}>{t.footer}</footer>
    </main>
  );
}
