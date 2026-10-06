'use client';

import { useEffect, useRef, useState } from 'react';
import { strings, type Lang } from '@/lib/i18n';
import { money } from '@/lib/format';
import { scheduleRuns, type MonthPayments } from '@/lib/exit';
import styles from './PaymentChart.module.css';

type Props = {
  months: MonthPayments[];
  currency: string;
  lang: Lang;
  /** When the exit slider is in play: payments stop after lastMonth, and the exit cost lands on it. */
  leave?: { lastMonth: number; fee: number } | null;
};

const H = 170;
const M = { top: 10, right: 6, bottom: 24, left: 46 };

// 0 / 50 / 100 rather than 0 / 43.7 / 87.4.
function niceStep(max: number) {
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  return ([1, 2, 2.5, 5, 10].find((s) => s * pow >= raw) ?? 10) * pow;
}

export function PaymentChart({ months, currency, lang, leave }: Props) {
  const t = strings[lang];
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmt = (n: number) => money(n, currency, lang);
  const fee = leave?.fee ?? 0;
  const peak = Math.max(...months.map((m) => m.total + (leave && m.month === leave.lastMonth ? fee : 0)));
  const step = niceStep(peak);
  const top = Math.ceil(peak / step) * step || step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = H - M.top - M.bottom;
  const band = plotW / months.length;
  const barW = Math.max(2, Math.min(24, band - 2));
  const y = (v: number) => M.top + plotH - (v / top) * plotH;
  const labelEvery = months.length > 36 ? 12 : months.length > 12 ? 6 : 3;

  // A column with a 4px rounded top and a square foot on the baseline.
  function column(x: number, y0: number, y1: number) {
    const h = y0 - y1;
    if (h <= 0) return '';
    const r = Math.min(4, barW / 2, h);
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + barW - r} Q${x + barW},${y1} ${x + barW},${y1 + r} V${y0} Z`;
  }

  const hovered = hover !== null ? months[hover] : null;
  const after = (m: number) => leave != null && m > leave.lastMonth;

  return (
    <figure className={styles.figure}>
      <div ref={wrap} className={styles.plot} onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={t.monthByMonth}>
            {ticks.map((v) => (
              <g key={v}>
                <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} className={styles.grid} />
                <text x={M.left - 6} y={y(v)} className={styles.tick} textAnchor="end" dominantBaseline="middle">
                  {fmt(v)}
                </text>
              </g>
            ))}
            {months.map((m, i) => {
              const x = M.left + i * band + (band - barW) / 2;
              const withFee = leave && m.month === leave.lastMonth && fee > 0;
              return (
                <g key={m.month} className={after(m.month) ? styles.after : undefined}>
                  <path d={column(x, y(0), y(m.total))} className={styles.bar} />
                  {withFee && <path d={column(x, y(m.total) - 2, y(m.total + fee))} className={styles.fee} />}
                  {(m.month === 1 || m.month % labelEvery === 0) && (
                    <text x={x + barW / 2} y={H - 6} className={styles.tick} textAnchor="middle">
                      {m.month}
                    </text>
                  )}
                  {/* hit target: the whole band, top to bottom */}
                  <rect
                    x={M.left + i * band}
                    y={M.top}
                    width={band}
                    height={plotH}
                    className={styles.hit}
                    onPointerEnter={() => setHover(i)}
                    onPointerDown={() => setHover(i)}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {hovered && (
          <div
            className={styles.tip}
            style={{ left: Math.min(Math.max(M.left + (hover! + 0.5) * band, 90), width - 90) }}
            role="status"
          >
            <strong>{t.monthN(hovered.month)}</strong>
            {hovered.parts.map((p, i) => (
              <span key={i}>
                {p.label} <b>{fmt(p.amount)}</b>
              </span>
            ))}
            {leave && hovered.month === leave.lastMonth && fee > 0 && (
              <span>
                {t.chartExit} <b>{fmt(fee)}</b>
              </span>
            )}
            {hovered.parts.length > 1 && (
              <span className={styles.tipTotal}>
                {t.total} <b>{fmt(hovered.total)}</b>
              </span>
            )}
            {after(hovered.month) && <em>{t.chartAfter}</em>}
          </div>
        )}
      </div>

      {leave && (
        <figcaption className={styles.legend}>
          <span>
            <i className={styles.keyBar} /> {t.chartRegular}
          </span>
          {fee > 0 && (
            <span>
              <i className={styles.keyFee} /> {t.chartExit}
            </span>
          )}
          <span>
            <i className={`${styles.keyBar} ${styles.keyAfter}`} /> {t.chartAfter}
          </span>
        </figcaption>
      )}

      <details className={styles.table}>
        <summary>{t.chartTable}</summary>
        <table>
          <tbody>
            {scheduleRuns(months).map((r) => (
              <tr key={r.from}>
                <th scope="row">{r.from === r.to ? t.monthN(r.from) : t.monthsRange(r.from, r.to)}</th>
                <td>{fmt(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
