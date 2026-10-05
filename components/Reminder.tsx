'use client';

import { useState } from 'react';
import type { Report } from '@/lib/schema';
import type { Lang } from '@/lib/i18n';
import { strings } from '@/lib/i18n';
import { buildIcs, noticeDeadline } from '@/lib/ics';
import styles from './Reminder.module.css';

const today = () => new Date().toISOString().slice(0, 10);

export function Reminder({ report, lang }: { report: Report; lang: Lang }) {
  const t = strings[lang];
  const [start, setStart] = useState(today);
  const { notice, termMonths } = report;
  if (!notice || !termMonths) return null;

  const startDate = new Date(`${start}T00:00:00Z`);
  const valid = !Number.isNaN(startDate.getTime());
  const deadline = valid ? noticeDeadline(startDate, termMonths, notice.daysBeforeEnd) : null;
  const pretty = deadline?.toLocaleDateString(lang, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });

  function download() {
    if (!deadline) return;
    const ics = buildIcs({
      deadline,
      title: `${t.remindDeadline}: ${report.counterparty}`,
      description: `${report.title}\n${notice!.how}\n\nFine Print`,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `fine-print-${report.counterparty.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-notice.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className={styles.box} aria-labelledby="remind-heading">
      <h2 id="remind-heading" className={styles.heading}>
        {t.remindTitle}
      </h2>
      <p className={styles.body}>
        {t.remindBody(notice.daysBeforeEnd)} <span className={styles.how}>{notice.how}</span>
      </p>
      <div className={styles.row}>
        <label className={styles.field}>
          <span className="label">{t.remindStart}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={styles.date} />
        </label>
        {deadline && (
          <p className={styles.deadline}>
            <span className="label">{t.remindDeadline}</span>
            <strong className="hl hl-red">{pretty}</strong>
          </p>
        )}
      </div>
      <button type="button" className={styles.button} onClick={download} disabled={!deadline}>
        {t.remindButton}
      </button>
    </section>
  );
}
