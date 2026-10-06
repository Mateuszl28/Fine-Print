// The dates that matter in a contract, worked out from its payment schedule and a start date.
// Nothing here comes from the model directly: it reads the schedule, code does the calendar.

import type { Report } from './schema.ts';
import { paymentMonths } from './exit.ts';
import { addMonths, noticeDeadline } from './ics.ts';

export type ContractDate =
  | { kind: 'price'; date: Date; month: number; from: number; to: number }
  | { kind: 'payment'; date: Date; month: number; label: string; amount: number }
  | { kind: 'notice'; date: Date }
  | { kind: 'end'; date: Date };

const cents = (n: number) => Math.round(n * 100);

/** What is charged every month in month m (the recurring part only, not one-offs or yearly fees). */
function monthlyLevel(items: Report['costItems'], m: number): number {
  return items
    .filter((i) => i.everyMonths === 1)
    .reduce((sum, i) => sum + (paymentMonths(i).includes(m) ? cents(i.amount) : 0), 0);
}

export function contractDates(report: Pick<Report, 'costItems' | 'termMonths' | 'notice'>, start: Date): ContractDate[] {
  const term = report.termMonths;
  if (!term || term < 1) return [];
  const items = report.costItems;
  const scheduled = items.length > 0 && items.every((i) => typeof i.fromMonth === 'number' && typeof i.everyMonths === 'number');
  const out: ContractDate[] = [];
  const dateOf = (month: number) => addMonths(start, month - 1);

  if (scheduled) {
    // The monthly price changing: a promotion ending, rent stepping up.
    for (let m = 2; m <= term; m++) {
      const before = monthlyLevel(items, m - 1);
      const now = monthlyLevel(items, m);
      if (before > 0 && now > 0 && before !== now) out.push({ kind: 'price', date: dateOf(m), month: m, from: before / 100, to: now / 100 });
    }
    // Yearly fees and other payments that aren't monthly, after signing.
    for (const item of items.filter((i) => i.everyMonths !== 1)) {
      for (const m of paymentMonths(item)) {
        if (m > 1 && m <= term) out.push({ kind: 'payment', date: dateOf(m), month: m, label: item.label, amount: item.amount });
      }
    }
  }
  if (report.notice) out.push({ kind: 'notice', date: noticeDeadline(start, term, report.notice.daysBeforeEnd) });
  out.push({ kind: 'end', date: addMonths(start, term) });

  // Same day: the deadline first, it's the one that costs money to miss.
  const order = { notice: 0, price: 1, payment: 2, end: 3 };
  return out.sort((a, b) => a.date.getTime() - b.date.getTime() || order[a.kind] - order[b.kind]);
}
