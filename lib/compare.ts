import type { Report } from './schema';
import { exitAt } from './exit.ts';

export type Comparison = {
  sameCurrency: boolean;
  /** index of the cheaper offer over its own term, null if a tie or not comparable */
  cheaper: 0 | 1 | null;
  difference: number | null;
  /** index of the higher fairness score, null on a tie */
  fairer: 0 | 1 | null;
  monthly: [number | null, number | null];
};

type Comparable = Pick<Report, 'trueCost' | 'currency' | 'score' | 'termMonths'>;

export function compareReports(a: Comparable, b: Comparable): Comparison {
  const sameCurrency = a.currency.toUpperCase() === b.currency.toUpperCase();
  const monthly: Comparison['monthly'] = [perMonth(a), perMonth(b)];

  let cheaper: Comparison['cheaper'] = null;
  let difference: number | null = null;
  if (sameCurrency && a.trueCost !== null && b.trueCost !== null) {
    // Different terms (12 vs 24 months) aren't comparable as totals; compare the monthly average instead.
    const sameTerm = a.termMonths === b.termMonths;
    const [x, y] = sameTerm ? [a.trueCost, b.trueCost] : monthly;
    if (x !== null && y !== null && x !== y) {
      cheaper = x < y ? 0 : 1;
      difference = Math.round(Math.abs(x - y) * 100) / 100;
    } else if (x !== null && x === y) {
      difference = 0;
    }
  }

  const fairer = a.score === b.score ? null : a.score > b.score ? 0 : 1;
  return { sameCurrency, cheaper, difference, fairer, monthly };
}

function perMonth(r: Comparable): number | null {
  if (r.trueCost === null || !r.termMonths) return null;
  return Math.round((r.trueCost / r.termMonths) * 100) / 100;
}

export type ExitComparison = {
  /** What leaving after `month` costs in all (paid so far + getting out); null when it can't be worked out. */
  totals: [number | null, number | null];
  /** Set when that offer doesn't let you leave yet: the month it becomes possible. */
  lockedUntil: [number | null, number | null];
  cheaper: 0 | 1 | null;
  difference: number | null;
};

type ExitComparable = Pick<Report, 'trueCost' | 'currency' | 'termMonths' | 'costItems' | 'earlyExit'>;

/** Both offers, if you leave after the same month. Null when the two can't be compared this way. */
export function compareExit(a: ExitComparable, b: ExitComparable, month: number): ExitComparison | null {
  if (a.currency.toUpperCase() !== b.currency.toUpperCase()) return null;
  const one = (r: ExitComparable) => {
    if (!r.earlyExit || !r.termMonths || month >= r.termMonths) return { total: null, locked: null };
    const e = exitAt(month, r.costItems, r.earlyExit, r.termMonths);
    return e.allowed ? { total: e.total, locked: null } : { total: null, locked: e.lockedUntil };
  };
  const [x, y] = [one(a), one(b)];
  if (x.total === null && x.locked === null) return null;
  if (y.total === null && y.locked === null) return null;
  let cheaper: ExitComparison['cheaper'] = null;
  let difference: number | null = null;
  if (x.total !== null && y.total !== null && x.total !== y.total) {
    cheaper = x.total < y.total ? 0 : 1;
    difference = Math.round(Math.abs(x.total - y.total) * 100) / 100;
  }
  return { totals: [x.total, y.total], lockedUntil: [x.locked, y.locked], cheaper, difference };
}
