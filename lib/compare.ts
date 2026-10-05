import type { Report } from './schema';

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
