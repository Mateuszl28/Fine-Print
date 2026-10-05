import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, buildIcs, noticeDeadline } from './ics.ts';

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

test('adds months, clamping to the end of shorter months', () => {
  assert.equal(iso(addMonths(d('2026-01-31'), 1)), '2026-02-28');
  assert.equal(iso(addMonths(d('2026-10-05'), 24)), '2028-10-05');
});

test('notice deadline is term end minus notice days', () => {
  assert.equal(iso(noticeDeadline(d('2026-10-05'), 12, 60)), '2027-08-06');
  assert.equal(iso(noticeDeadline(d('2026-10-05'), 24, null)), '2028-10-05');
});

test('builds an all-day event with reminders and escaped text', () => {
  const ics = buildIcs({
    deadline: d('2027-08-06'),
    title: 'Last day to cancel: Harborview lease',
    description: 'Written notice; 60 days before the end, by mail.',
    now: d('2026-10-05'),
  });
  assert.match(ics, /DTSTART;VALUE=DATE:20270806\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20270807\r\n/);
  assert.match(ics, /TRIGGER:-P7D/);
  assert.match(ics, /Written notice\\; 60 days before the end\\, by mail\./);
  assert.ok(ics.split('\r\n').every((l) => l.length <= 75));
});
