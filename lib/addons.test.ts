import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptAddOn, defaultAddOns, missingAddOns } from './addons.ts';
import { samples } from './samples.ts';

const loan = samples.find((s) => s.id === 'loan')!.text;
const item = (label: string, amount: number, times: number, fromMonth = 1, everyMonths = 1) => ({ label, amount, times, fromMonth, everyMonths, clauseId: null });

test('finds the auto-enrolled protection plan in the loan sample, and nothing in the others', () => {
  assert.deepEqual(defaultAddOns(loan).map((h) => h.amount), [4.99]);
  for (const s of samples.filter((x) => x.id !== 'loan')) assert.deepEqual(defaultAddOns(s.text), [], s.id);
});

test('an enrollment fee or an arbitration opt-out is not an add-on', () => {
  assert.deepEqual(defaultAddOns('A one-time enrollment fee of $49.00 is due at signing.'), []);
  assert.deepEqual(defaultAddOns('You may opt out of arbitration within 30 days. Plans start at $10 per month.'), []);
});

test('other languages', () => {
  assert.equal(defaultAddOns('Sie werden automatisch angemeldet für den Schutzbrief zu 3,99 € monatlich.')[0]?.amount, 3.99);
  assert.equal(defaultAddOns('Zostajesz automatycznie zapisany do ubezpieczenia za 9,99 zł miesięcznie.')[0]?.amount, 9.99);
});

test('only missing when no cost item has that amount', () => {
  assert.equal(missingAddOns(loan, [item('Payments', 86.5, 18)]).length, 1);
  assert.equal(missingAddOns(loan, [item('Payments', 86.5, 18), item('Plan', 4.99, 18)]).length, 0);
});

test('a proposed item is kept only if it is that add-on and fits the term', () => {
  const hint = defaultAddOns(loan)[0];
  assert.ok(acceptAddOn(item('Protection plan', 4.99, 18), hint, 18, loan));
  assert.equal(acceptAddOn(item('Protection plan', 5.99, 18), hint, 18, loan), null);
  assert.equal(acceptAddOn(item('Protection plan', 4.99, 24), hint, 18, loan), null);
  assert.equal(acceptAddOn(item('Protection plan', 4.99, 1, 1, 0), hint, 18, loan), null);
  assert.equal(acceptAddOn(null, hint, 18, loan), null);
});
