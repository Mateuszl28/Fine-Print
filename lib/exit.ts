// What it costs to get out early. The model only reads the rules off the contract
// (when each payment falls, what leaving triggers); every number here is added up in code.

import type { Analysis } from './schema.ts';

export type CostItem = Analysis['costItems'][number];
export type ExitRule = NonNullable<Analysis['earlyExit']>['rules'][number];
export type ExitPlan = { noticeMonths: number; rules: ExitRule[] };

export type ExitResult =
  | { allowed: false; /** You can't leave before the end of this month. */ lockedUntil: number }
  | {
      allowed: true;
      /** Month the payments stop: the month you leave plus any notice period. */
      lastMonth: number;
      paid: number;
      fee: number;
      /** The rules that cost something here, in order. */
      charged: { rule: ExitRule; amount: number }[];
      total: number;
      /** No rule covers this month, so the contract doesn't put a price on leaving then. */
      unstated: boolean;
    };

const cents = (n: number) => Math.round(n * 100);

/** The months (1-based) in which an item is paid. */
export function paymentMonths(item: CostItem): number[] {
  const times = Math.max(0, Math.round(item.times));
  const from = Math.max(1, Math.round(item.fromMonth ?? 1));
  const every = Math.max(0, Math.round(item.everyMonths ?? (times > 1 ? 1 : 0)));
  if (times === 0) return [];
  if (every === 0) return [from];
  return Array.from({ length: times }, (_, k) => from + k * every);
}

function paidThrough(item: CostItem, month: number): number {
  return paymentMonths(item).filter((m) => m <= month).length * cents(item.amount);
}

function remainingAfter(item: CostItem, month: number): number {
  return paymentMonths(item).filter((m) => m > month).length * cents(item.amount);
}

export function exitAt(month: number, items: CostItem[], plan: ExitPlan, termMonths: number): ExitResult {
  const rules = plan.rules.filter((r) => r.fromMonth <= month && (r.toMonth === null || month <= r.toMonth));

  const blocked = rules.filter((r) => r.kind === 'not_allowed');
  if (blocked.length > 0) {
    // Leaving becomes possible at the end of the last month any blocking rule covers.
    const until = Math.max(...plan.rules.filter((r) => r.kind === 'not_allowed').map((r) => r.toMonth ?? termMonths));
    return { allowed: false, lockedUntil: Math.min(until, termMonths) };
  }

  const lastMonth = Math.min(termMonths, month + Math.max(0, Math.round(plan.noticeMonths)));
  const paid = items.reduce((sum, item) => sum + paidThrough(item, lastMonth), 0);

  const charged: { rule: ExitRule; amount: number }[] = [];
  for (const rule of rules) {
    const item = rule.itemIndex !== null ? items[rule.itemIndex] : undefined;
    const value = rule.value ?? 0;
    let amount = 0;
    if (rule.kind === 'fixed_fee') amount = cents(value);
    else if (rule.kind === 'months_of_payment' && item) amount = Math.round(value * cents(item.amount));
    else if (rule.kind === 'share_of_remaining_percent' && item) amount = Math.round((value / 100) * remainingAfter(item, lastMonth));
    else if (rule.kind === 'remaining_of_item' && item) amount = remainingAfter(item, lastMonth);
    if (amount > 0) charged.push({ rule, amount: amount / 100 });
  }
  const fee = charged.reduce((s, c) => s + cents(c.amount), 0);
  return {
    allowed: true,
    lastMonth,
    paid: paid / 100,
    fee: fee / 100,
    charged,
    total: (paid + fee) / 100,
    unstated: rules.length === 0,
  };
}

/**
 * Keeps only the rules we can stand behind: their numbers appear in the contract, they point at
 * a real cost item, and their months fit the term. Returns null when nothing usable is left.
 */
export function checkExitPlan(
  raw: Analysis['earlyExit'],
  items: CostItem[],
  termMonths: number | null,
  appearsInText: (n: number) => boolean,
): ExitPlan | null {
  if (!raw || !termMonths || termMonths < 2 || items.length === 0) return null;
  // Every payment has to fall inside the term (or the month after, for a final one), or the schedule is wrong.
  if (items.some((i) => paymentMonths(i).some((m) => m > termMonths + 1))) return null;
  const rules = raw.rules.filter((r) => {
    if (!Number.isFinite(r.fromMonth) || r.fromMonth < 1 || r.fromMonth > termMonths) return false;
    if (r.toMonth !== null && r.toMonth < r.fromMonth) return false;
    const needsItem = r.kind === 'months_of_payment' || r.kind === 'share_of_remaining_percent' || r.kind === 'remaining_of_item';
    if (needsItem && (r.itemIndex === null || !items[r.itemIndex])) return false;
    const needsValue = r.kind === 'fixed_fee' || r.kind === 'months_of_payment' || r.kind === 'share_of_remaining_percent';
    if (needsValue && (r.value === null || r.value <= 0 || !appearsInText(r.value))) return false;
    return true;
  });
  if (rules.length === 0) return null;
  const notice = raw.noticeMonths && raw.noticeMonths > 0 && appearsInText(raw.noticeMonths) ? Math.round(raw.noticeMonths) : 0;
  return { noticeMonths: notice, rules };
}
