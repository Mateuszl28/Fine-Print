import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeShare, encodeShare } from './share.ts';
import type { Report } from './schema.ts';

const report = {
  isContract: true,
  contractType: 'gym',
  title: 'Gym membership · 24-month term',
  counterparty: 'IronHouse',
  notice: { daysBeforeEnd: 30, how: 'Certified mail' },
  termMonths: 24,
  advertised: { label: '$29.99 / month', amount: 29.99 },
  currency: 'USD',
  costItems: [{ label: 'Dues', amount: 29.99, times: 24, clauseId: null }],
  costAssumption: 'Full term.',
  score: 3,
  verdict: 'Fine if you never want to leave.',
  questions: ['Can you lock the price?'],
  letter: { kind: 'cancellation', subject: 'Cancel', body: 'Dear IronHouse — żółć, ünïcödé.' },
  text: 'A contract. '.repeat(400),
  clauses: [],
  trueCost: 719.76,
  droppedQuotes: 0,
} as unknown as Report;

test('a report survives the trip through a link', async () => {
  const hash = await encodeShare(report, 'pl');
  assert.match(hash, /^r=[A-Za-z0-9_-]+$/);
  const back = await decodeShare('#' + hash);
  assert.deepEqual(back, { v: 1, lang: 'pl', report });
});

test('compression keeps links short', async () => {
  const hash = await encodeShare(report, 'en');
  assert.ok(hash.length < JSON.stringify(report).length / 4, `link is ${hash.length} chars`);
});

test('anything else decodes to null', async () => {
  assert.equal(await decodeShare(''), null);
  assert.equal(await decodeShare('#section-2'), null);
  assert.equal(await decodeShare('#r=not-really-a-report'), null);
});
