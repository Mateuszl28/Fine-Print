// Builds the calendar reminder for the last day to give notice. Pure, so it's testable.

/** Adds months the way contracts count them: Jan 31 + 1 month = Feb 28/29. */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return d;
}

/** Last day to send notice: end of the minimum term minus the notice period. */
export function noticeDeadline(start: Date, termMonths: number, daysBeforeEnd: number | null): Date {
  const end = addMonths(start, termMonths);
  return new Date(end.getTime() - (daysBeforeEnd ?? 0) * 86_400_000);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '');

function escape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (m) => `\\${m}`);
}

/** RFC 5545 lines must be folded at 75 octets. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

export type CalendarEvent = { date: Date; title: string; description: string; /** e.g. ['-P7D', '-P1D'] */ alarms: string[] };

/** One all-day event per date, each with its own reminders. */
export function buildCalendar(events: CalendarEvent[], now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fine Print//Contract dates//EN', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const next = new Date(e.date.getTime() + 86_400_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:fineprint-${ymd(e.date)}-${Math.abs(hash(e.title))}@fineprint`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${escape(e.title)}`,
      `DESCRIPTION:${escape(e.description)}`,
    );
    for (const trigger of e.alarms) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escape(e.title)}`, `TRIGGER:${trigger}`, 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function buildIcs(opts: { deadline: Date; title: string; description: string; now?: Date }): string {
  return buildCalendar([{ date: opts.deadline, title: opts.title, description: opts.description, alarms: ['-P7D', '-P1D'] }], opts.now);
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
