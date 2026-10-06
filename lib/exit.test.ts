import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkExitPlan, exitAt, paymentMonths, type CostItem, type ExitRule } from './exit.ts';

const item = (amount: number, times: number, fromMonth = 1, everyMonths = 1): CostItem => ({
  label: 'x', amount, times, fromMonth, everyMonths, clauseId: null,
});
const rule = (r: Partial<ExitRule> & Pick<ExitRule, 'kind'>): ExitRule => ({
  fromMonth: 1, toMonth: null, value: null, itemIndex: null, clauseId: null, ...r,
});

test('payment months follow the schedule', () => {
  assert.deepEqual(paymentMonths(item(59, 2, 6, 12)), [6, 18]);
  assert.deepEqual(paymentMonths(item(49, 1, 1, 0)), [1]);
  assert.equal(paymentMonths(item(29.99, 24)).length, 24);
});

test('gym: 50% of the dues left, after 30 days of notice', () => {
  // dues $29.99 × 24, enrollment $49 at signing, $59 a year from month 6
  const items = [item(29.99, 24), item(49, 1, 1, 0), item(59, 2, 6, 12)];
  const r = exitAt(6, items, { noticeMonths: 1, rules: [rule({ kind: 'share_of_remaining_percent', value: 50, itemIndex: 0 })] }, 24);
  assert.ok(r.allowed);
  // payments through month 7: 7 × 29.99 + 49 + 59 = 317.93; left: 17 × 29.99 = 509.83 → half = 254.92 (rounded to the cent)
  assert.equal(r.paid, 317.93);
  assert.equal(r.fee, 254.92);
  assert.equal(r.total, 572.85);
});

test('phone: a fee in the first year, plus the device balance throughout', () => {
  const items = [item(35, 12), item(50, 12, 13), item(27.5, 24)];
  const plan = {
    noticeMonths: 0,
    rules: [
      rule({ kind: 'fixed_fee', value: 200, toMonth: 12 }),
      rule({ kind: 'remaining_of_item', itemIndex: 2 }),
    ],
  };
  const early = exitAt(10, items, plan, 24);
  assert.ok(early.allowed);
  assert.equal(early.fee, 200 + 14 * 27.5);
  const late = exitAt(20, items, plan, 24);
  assert.ok(late.allowed);
  assert.equal(late.fee, 4 * 27.5);
});

test('lease: two months’ rent', () => {
  const r = exitAt(5, [item(1450, 12)], { noticeMonths: 2, rules: [rule({ kind: 'months_of_payment', value: 2, itemIndex: 0 })] }, 12);
  assert.ok(r.allowed);
  assert.equal(r.paid, 7 * 1450);
  assert.equal(r.fee, 2900);
});

test('a lock-in says when leaving becomes possible', () => {
  const plan = { noticeMonths: 3, rules: [rule({ kind: 'not_allowed', toMonth: 48 }), rule({ kind: 'free', fromMonth: 49 })] };
  assert.deepEqual(exitAt(12, [item(1150, 60)], plan, 60), { allowed: false, lockedUntil: 48 });
  const r = exitAt(49, [item(1150, 60)], plan, 60);
  assert.ok(r.allowed);
  assert.equal(r.lastMonth, 52);
  assert.equal(r.fee, 0);
});

test('a month no rule covers is marked as unstated', () => {
  const r = exitAt(3, [item(10, 12)], { noticeMonths: 0, rules: [rule({ kind: 'fixed_fee', value: 50, fromMonth: 6 })] }, 12);
  assert.ok(r.allowed && r.unstated);
});

test('rules whose numbers are not in the contract, or that point nowhere, are dropped', () => {
  const inText = (n: number) => [50, 200, 2].includes(n);
  const items = [item(29.99, 24)];
  const raw = {
    noticeMonths: 7,
    rules: [
      rule({ kind: 'share_of_remaining_percent', value: 50, itemIndex: 0 }),
      rule({ kind: 'fixed_fee', value: 999 }),
      rule({ kind: 'remaining_of_item', itemIndex: 5 }),
      rule({ kind: 'free', fromMonth: 40 }),
    ],
  };
  const plan = checkExitPlan(raw, items, 24, inText);
  assert.ok(plan);
  assert.equal(plan.rules.length, 1);
  assert.equal(plan.noticeMonths, 0);
});

test('no plan without a term, or when the schedule runs past it', () => {
  const raw = { noticeMonths: null, rules: [rule({ kind: 'free' })] };
  assert.equal(checkExitPlan(raw, [item(10, 12)], null, () => true), null);
  assert.equal(checkExitPlan(raw, [item(10, 30)], 12, () => true), null);
  assert.equal(checkExitPlan(null, [item(10, 12)], 12, () => true), null);
});
