import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareReports } from './compare.ts';

const r = (trueCost: number | null, score: number, termMonths: number | null = 24, currency = 'USD') => ({
  trueCost,
  score,
  termMonths,
  currency,
});

test('the higher sticker price can be the cheaper deal', () => {
  const c = compareReports(r(1798.76, 4), r(1668, 8));
  assert.equal(c.cheaper, 1);
  assert.equal(c.difference, 130.76);
  assert.equal(c.fairer, 1);
});

test('different terms compare by monthly average', () => {
  const c = compareReports(r(1200, 5, 12), r(2000, 5, 24));
  assert.deepEqual(c.monthly, [100, 83.33]);
  assert.equal(c.cheaper, 1);
  assert.equal(c.difference, 16.67);
  assert.equal(c.fairer, null);
});

test('different currencies are not compared', () => {
  const c = compareReports(r(1000, 5, 12, 'USD'), r(900, 5, 12, 'EUR'));
  assert.equal(c.sameCurrency, false);
  assert.equal(c.cheaper, null);
});

test('a missing total is not compared', () => {
  const c = compareReports(r(null, 5), r(900, 6));
  assert.equal(c.cheaper, null);
  assert.equal(c.fairer, 1);
});

test('if you leave early: the offer without an exit fee can win even when it costs more over the term', async () => {
  const { compareExit } = await import('./compare.ts');
  const item = (amount: number, times: number, fromMonth = 1) => ({ label: 'x', amount, times, fromMonth, everyMonths: 1, clauseId: null });
  const rule = (kind: 'fixed_fee' | 'free', value: number | null, toMonth: number | null = null) => ({ fromMonth: 1, toMonth, kind, value, itemIndex: null, clauseId: null });
  // A: $30 a month, but $200 to leave in year one. B: $35 a month, leave any time.
  const a = { trueCost: 720, currency: 'USD', termMonths: 24, costItems: [item(30, 24)], earlyExit: { noticeMonths: 0, rules: [rule('fixed_fee', 200, 12)] } };
  const b = { trueCost: 840, currency: 'usd', termMonths: 24, costItems: [item(35, 24)], earlyExit: { noticeMonths: 0, rules: [rule('free', null)] } };
  const early = compareExit(a, b, 6)!;
  assert.deepEqual(early.totals, [380, 210]);
  assert.equal(early.cheaper, 1);
  assert.equal(early.difference, 170);
  const late = compareExit(a, b, 18)!;
  assert.equal(late.cheaper, 0);
});

test('a lock-in is reported, and offers without exit rules are not compared', async () => {
  const { compareExit } = await import('./compare.ts');
  const item = { label: 'x', amount: 1000, times: 48, fromMonth: 1, everyMonths: 1, clauseId: null };
  const locked = { trueCost: 48000, currency: 'EUR', termMonths: 48, costItems: [item], earlyExit: { noticeMonths: 3, rules: [{ fromMonth: 1, toMonth: 48, kind: 'not_allowed' as const, value: null, itemIndex: null, clauseId: null }] } };
  const free = { ...locked, earlyExit: { noticeMonths: 0, rules: [{ fromMonth: 1, toMonth: null, kind: 'free' as const, value: null, itemIndex: null, clauseId: null }] } };
  const r = compareExit(locked, free, 10)!;
  assert.deepEqual(r.lockedUntil, [48, null]);
  assert.equal(r.cheaper, null);
  assert.equal(compareExit({ ...locked, earlyExit: null }, free, 10), null);
});
