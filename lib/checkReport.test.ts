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
      score: 3, verdict: 'v', clauses: [], questions: [], glossary: [],
      counterparty: "Gym", notice: null, letter: { kind: "cancellation", subject: "Cancel", body: '[Your name]\n\nSubject: Cancel\n\nDear Gym,' },
    },
    'some contract text',
  );
  assert.equal(r.letter.body, '[Your name]\n\nDear Gym,');
});


test('a fee financed into the installments is not counted twice', async () => {
  const { dropFinancedFees } = await import('./checkReport.ts');
  const contract = 'Payment schedule: 18 monthly payments of $86.50.\n2. ORIGINATION FEE. An origination fee of $49.00 is added to the Amount Financed and is non-refundable.\n4. AUTOPAY. A returned payment fee of $30.00 applies.';
  const items = [
    { label: 'Monthly payments', amount: 86.5, times: 18, clauseId: null },
    { label: 'Opłata przygotowawcza', amount: 49, times: 1, clauseId: null },
    { label: 'Purchase Protection Plan', amount: 4.99, times: 18, clauseId: null },
  ];
  assert.deepEqual(
    dropFinancedFees(contract, items).map((i) => i.amount),
    [86.5, 4.99],
  );
});

test('fees that are not financed stay', async () => {
  const { dropFinancedFees } = await import('./checkReport.ts');
  const contract = 'ENROLLMENT FEE. A one-time enrollment fee of $49.00 is due at signing.';
  const items = [{ label: 'Enrollment', amount: 49, times: 1, clauseId: null }];
  assert.equal(dropFinancedFees(contract, items).length, 1);
});

test('explained words are found as whole words, once, and only if they are really there', async () => {
  const { locateTerms } = await import('./checkReport.ts');
  const contract = 'The Initial Term is 24 months. Disputes go to binding arbitration. Arbitration is final.';
  const terms = locateTerms(contract, [
    { term: 'arbitration', plain: 'A private judge instead of a court.' },
    { term: 'Initial Term', plain: 'The first, locked-in period.' },
    { term: 'liquidated damages', plain: 'Not in this contract.' },
    { term: 'Term', plain: 'Duplicate inside "Initial Term".' },
  ], []);
  assert.deepEqual(terms.map((t) => t.term), ['Initial Term', 'arbitration']);
  assert.equal(contract.slice(terms[1].start, terms[1].end), 'arbitration');
});

test('a word is not matched inside a longer word', async () => {
  const { locateTerms } = await import('./checkReport.ts');
  const terms = locateTerms('Kaution und Kautionskonto.', [{ term: 'Kautionskonto', plain: 'x' }, { term: 'Kaut', plain: 'y' }], []);
  assert.deepEqual(terms.map((t) => t.term), ['Kautionskonto']);
});

test('a word never straddles the edge of a highlight', async () => {
  const { locateTerms } = await import('./checkReport.ts');
  const contract = 'You agree to binding arbitration of all disputes.';
  const clause = { ...{ id: 'a', severity: 'yellow' as const, quote: '', title: '', meaning: '', whyItMatters: '', whatToDo: '' }, start: 0, end: 27, boxes: [] };
  // "binding arbitration" crosses the end of the highlight (index 27); "arbitration" alone doesn't fit either.
  const terms = locateTerms(contract, [{ term: 'binding arbitration', plain: 'x' }, { term: 'disputes', plain: 'y' }], [clause]);
  assert.deepEqual(terms.map((t) => t.term), ['disputes']);
});
