// Paid add-ons a contract signs you up for unless you cancel ("You are enrolled in the
// Protection Plan for $4.99 per month"). The model sometimes leaves them out of the cost;
// this finds them in the contract's own words so a focused follow-up can put them back.

import type { Analysis } from './schema.ts';
import { amountPattern } from './checkReport.ts';

const ENROLLED =
  /\b(?:you (?:are|will be|have been) (?:automatically )?(?:enrolled|signed up|subscribed) (?:in|for|to)|automatically (?:enrolled|added|included|subscribed))\b|automatisch (?:angemeldet|hinzugebucht|eingeschlossen)|zostajesz (?:automatycznie )?zapisan|automatycznie (?:zapisan|doliczan|dodan)|(?:queda|está) (?:automáticamente )?(?:inscrito|suscrito)/i;
const MONTHLY = /per month|a month|\/\s?(?:mo|month)\b|monthly|monatlich|pro monat|miesięcznie|na miesiąc|al mes|mensual(?:es)?/i;
const MONEY = /(?:[$€£]|zł|PLN|EUR|USD)\s?(\d[\d.,]*\d|\d)|(\d[\d.,]*\d|\d)\s?(?:[$€£]|zł|PLN|EUR|USD)/;

export type AddOnHint = { sentence: string; amount: number };

function toNumber(raw: string): number {
  const decimals = raw.match(/[.,](\d{2})$/);
  const whole = (decimals ? raw.slice(0, -3) : raw).replace(/[^\d]/g, '');
  return Number(whole) + (decimals ? Number(decimals[1]) / 100 : 0);
}

/** Sentences that sign the reader up for something paid monthly, with that monthly amount. */
export function defaultAddOns(text: string): AddOnHint[] {
  const sentences = text.split(/(?<=[.;!?])\s+|\n+/);
  const out: AddOnHint[] = [];
  for (const sentence of sentences) {
    if (!ENROLLED.test(sentence) || !MONTHLY.test(sentence)) continue;
    const m = sentence.match(MONEY);
    if (m) out.push({ sentence: sentence.trim(), amount: toNumber(m[1] ?? m[2]) });
  }
  return out;
}

/** The add-ons whose monthly amount isn't among the cost items at all. */
export function missingAddOns(text: string, items: Analysis['costItems']): AddOnHint[] {
  const amounts = new Set(items.map((i) => Math.round(i.amount * 100)));
  return defaultAddOns(text).filter((h) => !amounts.has(Math.round(h.amount * 100)));
}

/**
 * Keeps a proposed cost item only if it is the add-on we found: same monthly amount, paid
 * monthly, inside the term, and the amount really is in the contract.
 */
export function acceptAddOn(
  item: Analysis['costItems'][number] | null,
  hint: AddOnHint,
  termMonths: number | null,
  text: string,
): Analysis['costItems'][number] | null {
  if (!item || !termMonths) return null;
  if (Math.round(item.amount * 100) !== Math.round(hint.amount * 100)) return null;
  if (!amountPattern(item.amount).test(text)) return null;
  const times = Math.round(item.times);
  const from = Math.round(item.fromMonth);
  if (times < 1 || from < 1 || item.everyMonths !== 1 || from + times - 1 > termMonths) return null;
  return { ...item, times, fromMonth: from, everyMonths: 1, clauseId: null };
}
