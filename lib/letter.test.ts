import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanLetterBody, letterPrompt, parseLetterRequest, unbackedAmounts } from './letter.ts';

const text = `3. MONTHLY DUES. Member agrees to pay $29.99 per month for 24 months.
4. ANNUAL FEE. A $49.00 annual maintenance fee is charged on the 60th day.
7. HOW TO CANCEL. Cancellations must be sent by certified mail to P.O. Box 7781.`;

const clause = { title: 'Cancelling takes a stamp', quote: 'Cancellations must be sent by certified mail to P.O. Box 7781.' };

test('accepts a well-formed change request', () => {
  const r = parseLetterRequest({ kind: 'change_request', text, counterparty: 'IronHouse', notice: null, clauses: [clause] });
  assert.ok(r);
  assert.equal(r.kind, 'change_request');
  assert.equal(r.clauses.length, 1);
  assert.equal(r.happened, '');
});

test('rejects unknown kinds, short text, and a change request with no clauses', () => {
  assert.equal(parseLetterRequest({ kind: 'threat', text, clauses: [clause] }), null);
  assert.equal(parseLetterRequest({ kind: 'cancellation', text: 'too short' }), null);
  assert.equal(parseLetterRequest({ kind: 'change_request', text, clauses: [] }), null);
  assert.equal(parseLetterRequest(null), null);
});

test('a cancellation needs no clauses, and a bad notice is ignored', () => {
  const r = parseLetterRequest({ kind: 'cancellation', text, notice: { how: 42 } });
  assert.ok(r);
  assert.equal(r.notice, null);
});

test('caps what the person typed', () => {
  const r = parseLetterRequest({ kind: 'complaint', text, clauses: [clause], happened: 'x'.repeat(5000) });
  assert.equal(r?.happened.length, 600);
});

test('the complaint prompt carries the clauses and the person’s words', () => {
  const r = parseLetterRequest({ kind: 'complaint', text, clauses: [clause], happened: 'They charged me twice in May.' })!;
  const p = letterPrompt(r);
  assert.match(p, /certified mail to P\.O\. Box 7781/);
  assert.match(p, /charged me twice in May/);
});

test('strips a repeated subject line in any report language', () => {
  assert.equal(cleanLetterBody('Temat: Wypowiedzenie\n\nSzanowni Państwo,'), 'Szanowni Państwo,');
  assert.equal(cleanLetterBody('[Your name]\nSubject: Cancel\n\nDear Gym,'), '[Your name]\nDear Gym,');
});

test('finds amounts the contract never mentions', () => {
  assert.deepEqual(unbackedAmounts('I was charged $49 and $29.99 each month.', text), []);
  assert.deepEqual(unbackedAmounts('Please refund the $120 fee.', text), ['$120']);
  assert.deepEqual(unbackedAmounts('Proszę o zwrot 1 200 zł.', 'Kaucja: 1.200,00 zł'), []);
  assert.deepEqual(unbackedAmounts('Please refund €60.', text, 'they took 60 euros'), []);
});

test('tells the language of a contract or a letter', async () => {
  const { guessLanguage } = await import('./letter.ts');
  assert.equal(guessLanguage(text + ' ' + text), 'English');
  assert.equal(
    guessLanguage('Der Mieter zahlt die Miete bis zum dritten Werktag. Die Kaution wird nicht verzinst und ist für die Dauer des Mietverhältnisses bei dem Vermieter. Das gilt auch für den Fall, dass die Wohnung von der Mieterin genutzt wird.'),
    'German',
  );
  assert.equal(
    guessLanguage('Estimados señores: Les escribo en referencia a mi contrato de membresía. Me cobraron la cuota anual dos veces en el mes de marzo y solicito la devolución del cobro duplicado por favor, con una respuesta en un plazo de 14 días.'),
    'Spanish',
  );
  assert.equal(guessLanguage('Too short.'), null);
});

test('flags a letter in the wrong language or cut off mid-sentence', async () => {
  const { letterProblems } = await import('./letter.ts');
  const req = parseLetterRequest({ kind: 'complaint', text: text + '\n' + text, clauses: [clause], happened: 'Me cobraron dos veces.' })!;
  const good = '[Your name]\n[Your address]\n\nDear IronHouse,\n\nYou charged the $49.00 annual fee twice this year. Please refund the second charge to my account and confirm it to me in writing within [14 days].\n\nSincerely,\n[Your name]';
  assert.deepEqual(letterProblems({ body: good }, req), []);
  const spanish = '[Su nombre]\n\nEstimados señores:\n\nLes escribo en referencia a mi contrato de membresía. Me cobraron la cuota anual dos veces en el mes de marzo y solicito la devolución del cobro duplicado, con una respuesta en un plazo de [14 días].\n\nAtentamente,\n[Su nombre]';
  assert.equal(letterProblems({ body: spanish }, req).length, 1);
  assert.equal(letterProblems({ body: good.split('Please')[0] + 'According to clause 3,' }, req).length, 1);
});
