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
      { label: 'dues', amount: 29.99, times: 24, fromMonth: 1, everyMonths: 1, clauseId: null },
      { label: 'enrollment', amount: 49, times: 1, fromMonth: 1, everyMonths: 1, clauseId: null },
      { label: 'annual fee', amount: 59, times: 2, fromMonth: 1, everyMonths: 1, clauseId: null },
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
      score: 3, verdict: 'v', clauses: [], questions: [], glossary: [], earlyExit: null,
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
    { label: 'Monthly payments', amount: 86.5, times: 18, fromMonth: 1, everyMonths: 1, clauseId: null },
    { label: 'Opłata przygotowawcza', amount: 49, times: 1, fromMonth: 1, everyMonths: 1, clauseId: null },
    { label: 'Purchase Protection Plan', amount: 4.99, times: 18, fromMonth: 1, everyMonths: 1, clauseId: null },
  ];
  assert.deepEqual(
    dropFinancedFees(contract, items).map((i) => i.amount),
    [86.5, 4.99],
  );
});

test('fees that are not financed stay', async () => {
  const { dropFinancedFees } = await import('./checkReport.ts');
  const contract = 'ENROLLMENT FEE. A one-time enrollment fee of $49.00 is due at signing.';
  const items = [{ label: 'Enrollment', amount: 49, times: 1, fromMonth: 1, everyMonths: 1, clauseId: null }];
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

test('reads the deposit amount where the contract sets it', async () => {
  const { depositAmounts } = await import('./checkReport.ts');
  assert.deepEqual(depositAmounts('Tenant shall pay a security deposit of $1,450.00 before move-in.'), [1450]);
  assert.deepEqual(depositAmounts('Der Mieter leistet eine Kaution in Höhe von drei Nettokaltmieten (3.450,00 €).'), [3450]);
  assert.deepEqual(depositAmounts('Najemca wpłaci kaucję w wysokości 3 000 zł.'), [3000]);
  assert.deepEqual(depositAmounts('A fee of $225.00 will be deducted from the security deposit.'), []);
});

test('a deposit listed as a cost is dropped, even split into installments; deductions stay', async () => {
  const { dropRefundableDeposits } = await import('./checkReport.ts');
  const de = 'Kaution in Höhe von drei Nettokaltmieten (3.450,00 €), zahlbar in drei Raten.';
  const items = [
    { label: 'Miete', amount: 1150, times: 12, fromMonth: 1, everyMonths: 1, clauseId: null },
    { label: 'Kaution', amount: 1150, times: 3, fromMonth: 1, everyMonths: 1, clauseId: null },
  ];
  assert.deepEqual(dropRefundableDeposits(de, items).map((i) => i.label), ['Miete']);
  const rate = (n: number) => ({ label: `Kaution, ${n}. Rate`, amount: 1150, times: 1, fromMonth: n, everyMonths: 0, clauseId: null });
  assert.deepEqual(dropRefundableDeposits(de, [items[0], rate(1), rate(2), rate(3)]).map((i) => i.label), ['Miete']);
  const en = 'security deposit of $1,450.00. A carpet cleaning fee of $225.00 will be deducted from the security deposit.';
  const lease = [
    { label: 'Rent', amount: 1450, times: 12, fromMonth: 1, everyMonths: 1, clauseId: null },
    { label: 'Carpet', amount: 225, times: 1, fromMonth: 12, everyMonths: 0, clauseId: null },
  ];
  assert.equal(dropRefundableDeposits(en, lease).length, 2);
});

test('a looping model is caught, real contract text is not', async () => {
  const { LOOP } = await import('./loop.ts');
  assert.ok(LOOP.test('"title": "Mobilfunkvertrag & Ger' + '\n'.repeat(150)));
  assert.ok(!LOOP.test('Member: ' + '_'.repeat(40) + '  Start Date: ' + '_'.repeat(40)));
  assert.ok(!LOOP.test('-'.repeat(80)));
});

test('the report records what the code checked and threw out', async () => {
  const { buildReport } = await import('./checkReport.ts');
  const contract = `1. RENT. Tenant pays $1,000.00 per month for 12 months.
2. DEPOSIT. Tenant shall pay a security deposit of $1,000.00 before move-in.
3. FEE. An application fee of $50.00 is added to the amount financed.
4. ARBITRATION. Disputes go to binding arbitration.`;
  const item = (label: string, amount: number, times: number) => ({ label, amount, times, fromMonth: 1, everyMonths: times > 1 ? 1 : 0, clauseId: null });
  const c = (id: string, quote: string) => ({ id, severity: 'red' as const, quote, title: id, meaning: '', whyItMatters: '', whatToDo: '' });
  const r = buildReport(
    {
      isContract: true, transcript: null, contractType: 'lease', title: 't', termMonths: 12,
      advertised: { label: '$1,000', amount: 1000 }, currency: 'USD',
      costItems: [item('Rent', 1000, 12), item('Deposit', 1000, 1), item('Application fee', 50, 1)],
      costAssumption: '', score: 5, verdict: 'v', questions: [], counterparty: 'L', notice: null,
      clauses: [c('rent', 'Tenant pays $1,000.00 per month for 12 months.'), c('made-up', 'Tenant waives all rights forever.')],
      glossary: [{ term: 'binding arbitration', plain: 'x' }, { term: 'force majeure', plain: 'y' }],
      earlyExit: { noticeMonths: null, rules: [{ fromMonth: 1, toMonth: null, kind: 'fixed_fee', value: 999, itemIndex: null, clauseId: null }] },
      letter: { kind: 'change_request', subject: 's', body: 'b' },
    },
    contract,
  );
  assert.deepEqual(r.checks?.quotes, { shown: 1, notFound: 1, overlapping: 0 });
  assert.deepEqual(r.checks?.terms, { shown: 1, left: 1 });
  assert.deepEqual(r.checks?.removed.map((x) => x.reason), ['financed', 'deposit']);
  assert.equal(r.checks?.payments, 1);
  assert.equal(r.checks?.exit, 'rejected');
  assert.equal(r.trueCost, 12000);
});

test('items put back by the add-on follow-up are recorded', async () => {
  const { buildReport } = await import('./checkReport.ts');
  const plan = { label: 'Protection plan', amount: 4.99, times: 18, fromMonth: 1, everyMonths: 1, clauseId: null };
  const r = buildReport(
    {
      isContract: true, transcript: null, contractType: 'installment_loan', title: 't', termMonths: 18,
      advertised: { label: '$1,200', amount: 1200 }, currency: 'USD',
      costItems: [{ label: 'Payments', amount: 86.5, times: 18, fromMonth: 1, everyMonths: 1, clauseId: null }, plan],
      costAssumption: '', score: 5, verdict: 'v', questions: [], counterparty: 'L', notice: null,
      clauses: [], glossary: [], earlyExit: null, letter: { kind: 'change_request', subject: 's', body: 'b' },
    },
    'You pay 18 payments of $86.50. You are enrolled in the Plan for $4.99 per month.',
    [plan],
  );
  assert.equal(r.trueCost, 1646.82);
  assert.deepEqual(r.checks?.added, [{ label: 'Protection plan', amount: 4.99, times: 18 }]);
});

test('amounts must come from the contract: written there, or a written amount stepped up', async () => {
  const { unbackedCostItems } = await import('./checkReport.ts');
  const { samples } = await import('./samples.ts');
  const text = (id: string) => samples.find((s) => s.id === id)!.text;
  const item = (label: string, amount: number, times = 1) => ({ label, amount, times, fromMonth: 1, everyMonths: 1, clauseId: null });
  // The loan's payment is $86.50 plus the $4.99 plan; $81.51 is a subtraction the model made up.
  assert.deepEqual(unbackedCostItems(text('loan'), [item('Payments', 81.51, 18), item('Plan', 4.99, 18)]).map((i) => i.amount), [81.51]);
  assert.deepEqual(unbackedCostItems(text('loan'), [item('Payments', 86.5, 18), item('Plan', 4.99, 18)]), []);
  // The Berlin rent steps up by €60 a year: 1,210 and 1,330 are backed.
  assert.deepEqual(unbackedCostItems(text('miet'), [item('Y1', 1150), item('Y2', 1210), item('Y4', 1330), item('NK', 220)]), []);
  assert.deepEqual(unbackedCostItems(text('gym'), [item('Dues', 29.99, 24), item('Fee', 49), item('Annual', 59, 2)]), []);
});

test('a second reading swaps only the worked-out item', async () => {
  const { replaceUnbacked } = await import('./checkReport.ts');
  const item = (label: string, amount: number, times: number) => ({ label, amount, times, fromMonth: 1, everyMonths: 1, clauseId: null });
  const bad = item('Payments', 81.51, 18);
  const plan = item('Plan', 4.99, 18);
  const merged = replaceUnbacked([bad, plan], [bad], [item('Payments', 86.5, 18), item('Plan again', 4.99, 18)]);
  assert.deepEqual(merged.map((i) => [i.label, i.amount]), [['Plan', 4.99], ['Payments', 86.5]]);
});
