import { test } from 'node:test';
import assert from 'node:assert/strict';
import { locateQuotes, totalCost } from './checkReport.ts';

const text = `5. AUTOMATIC RENEWAL. At the end of the Initial Term, this membership
automatically continues on a month-to-month basis at the then-current standard rate.

7. HOW TO CANCEL. Cancellations by phone, email, or at the front desk will not be accepted.`;

const clause = (quote: string, severity: 'red' | 'yellow' | 'green' = 'red', id = 'x') => ({
  id,
  severity,
  quote,
  title: 't',
  meaning: 'm',
  whyItMatters: 'w',
  whatToDo: 'd',
});

test('finds an exact quote', () => {
  const { located } = locateQuotes(text, [clause('Cancellations by phone, email, or at the front desk will not be accepted.')]);
  assert.equal(located.length, 1);
  const c = located[0];
  assert.equal(text.slice(c.start, c.end), 'Cancellations by phone, email, or at the front desk will not be accepted.');
});

test('tolerates line breaks, case and curly quotes', () => {
  const { located } = locateQuotes(text, [clause('this membership automatically continues on a Month-to-Month basis')]);
  assert.equal(located.length, 1);
  assert.match(text.slice(located[0].start, located[0].end), /^this membership\nautomatically continues/);
});

test('tolerates a missing final full stop and surrounding quotes', () => {
  const { located } = locateQuotes(text, [clause('"Cancellations by phone, email, or at the front desk will not be accepted"')]);
  assert.equal(located.length, 1);
});

test('spans an ellipsis', () => {
  const { located } = locateQuotes(text, [clause('At the end of the Initial Term … then-current standard rate.')]);
  assert.equal(located.length, 1);
  assert.match(text.slice(located[0].start, located[0].end), /^At the end.*standard rate\.$/s);
});

test('drops invented quotes', () => {
  const { located, dropped } = locateQuotes(text, [clause('You may cancel at any time for free.')]);
  assert.equal(located.length, 0);
  assert.equal(dropped, 1);
});

test('keeps the more serious of two overlapping highlights', () => {
  const { located, dropped } = locateQuotes(text, [
    clause('this membership automatically continues', 'yellow', 'a'),
    clause('automatically continues on a month-to-month basis', 'red', 'b'),
  ]);
  assert.deepEqual(located.map((c) => c.id), ['b']);
  assert.equal(dropped, 1);
});

test('totals cost items in cents', () => {
  assert.equal(
    totalCost([
      { label: 'dues', amount: 29.99, times: 24, clauseId: null },
      { label: 'enrollment', amount: 49, times: 1, clauseId: null },
      { label: 'annual fee', amount: 59, times: 2, clauseId: null },
    ]),
    886.76,
  );
});

test('no cost items means no total', () => {
  assert.equal(totalCost([]), null);
});

test('removes a repeated subject line from the letter body', async () => {
  const { buildReport } = await import('./checkReport.ts');
  const r = buildReport(
    {
      isContract: true, transcript: null, contractType: 'gym', title: 't', termMonths: 24,
      advertised: { label: '$1', amount: 1 }, currency: 'USD', costItems: [], costAssumption: '',
      score: 3, verdict: 'v', clauses: [], questions: [],
      counterparty: "Gym", notice: null, letter: { kind: "cancellation", subject: "Cancel", body: '[Your name]\n\nSubject: Cancel\n\nDear Gym,' },
    },
    'some contract text',
  );
  assert.equal(r.letter.body, '[Your name]\n\nDear Gym,');
});
