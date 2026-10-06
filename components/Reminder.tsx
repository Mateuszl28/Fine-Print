'use client';

import { useState } from 'react';
import type { Report } from '@/lib/schema';
import type { Lang } from '@/lib/i18n';
import { strings } from '@/lib/i18n';
import { money } from '@/lib/format';
import { buildCalendar, type CalendarEvent } from '@/lib/ics';
import { contractDates, type ContractDate } from '@/lib/dates';
import styles from './Reminder.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export function Reminder({ report, lang }: { report: Report; lang: Lang }) {
  const t = strings[lang];
  const [start, setStart] = useState(today);
  const { notice, termMonths } = report;
  if (!termMonths) return null;

  const startDate = new Date(`${start}T00:00:00Z`);
  const valid = !Number.isNaN(startDate.getTime());
  const dates = valid ? contractDates(report, startDate) : [];
  // Without a notice rule, a list holding only "the term ends" isn't worth a box.
  if (!notice && dates.length < 2) return null;

  const fmt = (n: number) => money(n, report.currency, lang);
  const pretty = (d: Date) => d.toLocaleDateString(lang, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
  const textOf = (d: ContractDate) =>
    d.kind === 'price'
      ? t.datePrice(fmt(d.from), fmt(d.to))
      : d.kind === 'payment'
        ? t.datePayment(d.label, fmt(d.amount))
        : d.kind === 'notice'
          ? t.remindDeadline
          : t.dateEnd;

  function download() {
    const events: CalendarEvent[] = dates.map((d) => ({
      date: d.date,
      title: `${textOf(d)} · ${report.counterparty}`,
      description: `${report.title}${d.kind === 'notice' && notice ? `\n${notice.how}` : ''}\n\nFine Print`,
      // The deadline is the one that costs money to miss: a week's warning and a day's.
      alarms: d.kind === 'notice' ? ['-P7D', '-P1D'] : d.kind === 'end' ? [] : ['-P3D'],
    }));
    const url = URL.createObjectURL(new Blob([buildCalendar(events)], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fine-print-${report.counterparty.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-dates.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className={styles.box} aria-labelledby="remind-heading">
      <h2 id="remind-heading" className={styles.heading}>
        {notice ? t.remindTitle : t.datesTitle}
      </h2>
      {notice && (
        <p className={styles.body}>
          {t.remindBody(notice.daysBeforeEnd)} <span className={styles.how}>{notice.how}</span>
        </p>
      )}
      <div className={styles.row}>
        <label className={styles.field}>
          <span className="label">{t.remindStart}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={styles.date} />
        </label>
      </div>
      {dates.length > 0 && (
        <ol className={styles.dates}>
          {dates.map((d, i) => (
            <li key={i} data-kind={d.kind}>
              <time dateTime={d.date.toISOString().slice(0, 10)}>
                {d.kind === 'notice' ? <strong className="hl hl-red">{pretty(d.date)}</strong> : pretty(d.date)}
              </time>
              <span>{textOf(d)}</span>
            </li>
          ))}
        </ol>
      )}
      <button type="button" className={styles.button} onClick={download} disabled={dates.length === 0}>
        {dates.length > 1 ? t.remindAll : t.remindButton}
      </button>
    </section>
  );
}
