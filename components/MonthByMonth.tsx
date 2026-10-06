'use client';

import type { Report } from '@/lib/schema';
import { strings, type Lang } from '@/lib/i18n';
import { monthlySchedule } from '@/lib/exit';
import { PaymentChart } from './PaymentChart';
import styles from './ExitCost.module.css';

/** The payment chart on its own, for contracts without an exit calculator (loans, for one). */
export function MonthByMonth({ report, lang }: { report: Report; lang: Lang }) {
  const months = monthlySchedule(report.costItems, report.termMonths, report.trueCost);
  // Eighteen equal bars say nothing the true cost doesn't; show it only when the amounts change.
  if (!months || new Set(months.map((m) => m.total)).size < 2) return null;
  return (
    <section className={styles.box} aria-labelledby="month-by-month">
      <h2 id="month-by-month" className={styles.heading}>
        {strings[lang].monthByMonth}
      </h2>
      <PaymentChart months={months} currency={report.currency} lang={lang} />
    </section>
  );
}
