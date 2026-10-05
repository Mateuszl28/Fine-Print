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
