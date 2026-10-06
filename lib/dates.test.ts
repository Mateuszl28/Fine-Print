import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractDates } from './dates.ts';
import { buildCalendar } from './ics.ts';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);
const item = (label: string, amount: number, times: number, fromMonth = 1, everyMonths = 1) => ({ label, amount, times, fromMonth, everyMonths, clauseId: null });

test('phone: the promo ends in month 13, then notice and the end of the term', () => {
  const dates = contractDates(
    {
      termMonths: 24,
      notice: { daysBeforeEnd: 30, how: 'by phone' },
      costItems: [item('Activation', 35, 1, 1, 0), item('Plan, promo', 35, 12), item('Plan', 50, 12, 13), item('Device', 27.5, 24)],
    },
    d('2026-10-15'),
  );
  assert.deepEqual(
    dates.map((x) => [x.kind, iso(x.date)]),
    [['price', '2027-10-15'], ['notice', '2028-09-15'], ['end', '2028-10-15']],
  );
  const price = dates[0];
  assert.ok(price.kind === 'price' && price.from === 62.5 && price.to === 77.5);
});

test('gym: a yearly fee after signing shows up, the one at signing does not', () => {
  const dates = contractDates(
    { termMonths: 24, notice: null, costItems: [item('Dues', 29.99, 24), item('Annual fee', 59, 2, 1, 12)] },
    d('2026-01-31'),
  );
  assert.deepEqual(dates.map((x) => [x.kind, iso(x.date)]), [['payment', '2027-01-31'], ['end', '2028-01-31']]);
});

test('stepped rent rises every year', () => {
  const dates = contractDates(
    {
      termMonths: 36,
      notice: null,
      costItems: [item('Rent y1', 1150, 12), item('Rent y2', 1210, 12, 13), item('Rent y3', 1270, 12, 25), item('Costs', 220, 36)],
    },
    d('2026-11-01'),
  );
  assert.deepEqual(dates.filter((x) => x.kind === 'price').map((x) => iso(x.date)), ['2027-11-01', '2028-11-01']);
});

test('no schedule (older report): only the deadline and the end', () => {
  const old = { label: 'x', amount: 10, times: 12, clauseId: null } as never;
  const dates = contractDates({ termMonths: 12, notice: { daysBeforeEnd: 60, how: '' }, costItems: [old] }, d('2026-10-05'));
  assert.deepEqual(dates.map((x) => x.kind), ['notice', 'end']);
});

test('a calendar holds every date with its own reminders', () => {
  const ics = buildCalendar(
    [
      { date: d('2027-10-15'), title: 'Price goes up', description: '', alarms: ['-P3D'] },
      { date: d('2028-09-15'), title: 'Last day to cancel', description: '', alarms: ['-P7D', '-P1D'] },
    ],
    d('2026-10-05'),
  );
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.equal(ics.match(/BEGIN:VALARM/g)?.length, 3);
});
