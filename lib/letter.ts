// The three letters a person can ask for after reading a report. The first one comes with
// the report itself; the others are written on demand by /api/letter.

import type { Report } from './schema.ts';

export type LetterKind = 'cancellation' | 'change_request' | 'complaint';
export const LETTER_KINDS: LetterKind[] = ['cancellation', 'change_request', 'complaint'];

export type LetterRequest = {
  kind: LetterKind;
  text: string;
  counterparty: string;
  notice: Report['notice'];
  clauses: { title: string; quote: string }[];
  happened: string;
};

export type Letter = { kind: LetterKind; subject: string; body: string };

export const MAX_LETTER_TEXT = 60_000;
const MAX_CLAUSES = 10;
const MAX_HAPPENED = 600;

/** Checks and trims a request body; returns null for anything malformed. */
export function parseLetterRequest(body: unknown): LetterRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!LETTER_KINDS.includes(b.kind as LetterKind)) return null;
  const text = typeof b.text === 'string' ? b.text.trim() : '';
  if (text.length < 80 || text.length > MAX_LETTER_TEXT) return null;
  const clauses = Array.isArray(b.clauses)
    ? b.clauses
        .filter((c): c is { title: string; quote: string } =>
          Boolean(c) && typeof c.title === 'string' && typeof c.quote === 'string',
        )
        .slice(0, MAX_CLAUSES)
        .map((c) => ({ title: c.title.slice(0, 200), quote: c.quote.slice(0, 1500) }))
    : [];
  // Asking to change, or complaining about, nothing in particular makes a vague letter.
  if (b.kind !== 'cancellation' && clauses.length === 0) return null;
  const n = b.notice as Record<string, unknown> | null | undefined;
  const notice =
    n && typeof n === 'object' && typeof n.how === 'string'
      ? { how: n.how.slice(0, 500), daysBeforeEnd: typeof n.daysBeforeEnd === 'number' ? n.daysBeforeEnd : null }
      : null;
  return {
    kind: b.kind as LetterKind,
    text,
    counterparty: typeof b.counterparty === 'string' ? b.counterparty.slice(0, 200) : '',
    notice,
    clauses,
    happened: typeof b.happened === 'string' ? b.happened.trim().slice(0, MAX_HAPPENED) : '',
  };
}

export const LETTER_SYSTEM = `You write short letters from an ordinary person to the other side of an everyday contract (a gym, a landlord, a phone company, a lender).

Rules:
- First decide which language the contract itself is written in and put it in "contractLanguage". Write the whole letter (subject, body, placeholders) in that language. The person's own note may be in another language: translate it, never switch to it.
- Firm, polite, plain. Short paragraphs. No legal threats, no citing laws or regulations, no exclamation marks.
- Never invent facts: no dates, amounts, account numbers, clause numbers or events that aren't in the contract or in what the person said. Unknown details go in square-bracket placeholders written in the letter's language, e.g. [Your name], [Your address], [Date], [Account number] in English, [Ihr Name], [Ihre Adresse], [Datum] in German.
- "body" starts with the sender block (name, address), then the date, then the recipient with the address the contract gives for them (if it gives none, just a placeholder such as [Their address]), then the letter, then the sign-off and name.
- Refer to clauses the way the contract does (its number and heading) when it has them.
- Plain text, no markdown. "subject" holds the subject line; "body" must not repeat it.`;

export function letterPrompt(r: LetterRequest): string {
  const clauseList = r.clauses.map((c, i) => `${i + 1}. ${c.title}\n   "${c.quote}"`).join('\n');
  const notice = r.notice
    ? `The contract's notice rule: ${r.notice.how}${r.notice.daysBeforeEnd ? ` (${r.notice.daysBeforeEnd} days before the end of the term)` : ''}.`
    : 'The contract states no notice rule.';
  const to = r.counterparty || 'the other party';

  const task = {
    cancellation: `Write a cancellation / non-renewal notice to ${to}. Follow the contract's own required method, address and notice period exactly, and ask for written confirmation of the end date. ${notice}`,
    change_request: `The person hasn't signed yet (or is about to renew). Write to ${to} asking to change the clauses below. For each one, name it, say in one sentence what is unfair about it for the person, and propose one specific, reasonable alternative. Ask for the agreed changes in writing before signing.\n\nClauses to change:\n${clauseList}`,
    complaint: `The person has already signed and something went wrong. Write a complaint to ${to} that points to the clauses below, states what happened, and asks for one specific remedy, with a reply within [14 days].\n\nClauses involved:\n${clauseList}\n\n${
      r.happened
        ? `What happened, in the person's own words (possibly in another language: translate it into the contract's language and don't add to it):\n"""${r.happened}"""`
        : 'The person didn\'t say what happened: use a placeholder such as [What happened, with dates] where the facts go.'
    }`,
  }[r.kind];

  const language = guessLanguage(r.text);
  const reminder = language
    ? `The contract is written in ${language}. Write the whole letter in ${language}.`
    : "Remember: the whole letter is in the contract's language.";
  return `${task}\n\nThe contract:\n"""\n${r.text}\n"""\n\n${reminder}`;
}

export const LETTER_STRICT = {
  amounts: 'Your previous letter mentioned amounts that are not in the contract or in what the person said. Use only amounts from those, or a placeholder.',
  language: (lang: string) => `Your previous letter was not in ${lang}. The contract is in ${lang}, so the whole letter must be in ${lang}, including placeholders.`,
};

// The subject is shown above the letter; models like to repeat it in the body too.
export function cleanLetterBody(body: string): string {
  return body.replace(/^[ \t]*(subject|re|betreff|temat|asunto|тема):.*\n+/gim, '').trim();
}

const CURRENCY = String.raw`(?:[$€£₴]|zł|PLN|EUR|USD|GBP|UAH|грн|Kč|CHF)`;
const NUMBER = String.raw`\d[\d.,  ]*\d|\d`;
const MONEY = new RegExp(
  String.raw`${CURRENCY}\s?(${NUMBER})|(${NUMBER})\s?${CURRENCY}`,
  'gi',
);

function digits(s: string): string {
  // "1.200,00" / "1,200.00" / "1 200" → "1200"; trailing zero cents don't count as different.
  return s.replace(/[^\d.,]/g, '').replace(/[.,]00$/, '').replace(/[.,\s]/g, '');
}

/**
 * Money amounts in the letter that appear nowhere in the contract or the person's own words.
 * The model writes the letter; this checks it didn't make up a number.
 */
export function unbackedAmounts(body: string, ...sources: string[]): string[] {
  const known = new Set<string>();
  for (const src of sources) {
    for (const m of src.matchAll(/\d[\d.,  ]*\d|\d/g)) {
      // "1 200" is one number, but "29.99 24" is two: keep both readings.
      known.add(digits(m[0]));
      for (const part of m[0].split(/[  ]+/)) known.add(digits(part));
    }
  }
  const out: string[] = [];
  for (const m of body.matchAll(MONEY)) {
    const n = digits(m[1] ?? m[2]);
    if (n && !known.has(n)) out.push(m[0].trim());
  }
  return out;
}

// Common short words per language. Enough to tell which language a contract or a letter is in;
// the model is then told the answer, and the letter is checked against it afterwards.
const STOPWORDS: Record<string, string[]> = {
  English: ['the', 'and', 'of', 'to', 'you', 'your', 'is', 'will', 'be', 'for', 'this', 'any', 'with', 'by', 'are', 'that', 'my', 'i'],
  German: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'den', 'für', 'von', 'eine', 'des', 'wird', 'zu', 'ich', 'sie', 'bei', 'auf'],
  Polish: ['i', 'w', 'na', 'się', 'nie', 'z', 'do', 'jest', 'oraz', 'że', 'lub', 'przez', 'od', 'umowy', 'proszę', 'mnie', 'jak', 'po'],
  Spanish: ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'las', 'del', 'por', 'para', 'con', 'una', 'se', 'mi', 'su', 'al', 'es', 'lo', 'como'],
  French: ['le', 'la', 'les', 'de', 'et', 'des', 'du', 'est', 'en', 'pour', 'que', 'une', 'dans', 'vous', 'je', 'au', 'aux', 'sur', 'pas', 'nous'],
  Italian: ['il', 'di', 'che', 'e', 'la', 'per', 'del', 'della', 'non', 'un', 'una', 'sono', 'gli', 'con', 'sul', 'nel', 'alla', 'questo'],
  Portuguese: ['o', 'de', 'que', 'e', 'do', 'da', 'em', 'para', 'os', 'não', 'uma', 'com', 'dos', 'as', 'ao', 'na', 'meu', 'seu'],
  Dutch: ['de', 'het', 'een', 'en', 'van', 'is', 'niet', 'voor', 'met', 'op', 'zijn', 'dat', 'aan', 'wordt', 'ik', 'u', 'uw', 'bij'],
  Ukrainian: ['і', 'та', 'не', 'на', 'що', 'до', 'від', 'за', 'або', 'договору', 'є', 'це', 'як', 'якщо', 'мене', 'мій', 'прошу', 'щодо'],
  Russian: ['и', 'не', 'на', 'что', 'по', 'от', 'за', 'или', 'договора', 'это', 'как', 'если', 'быть', 'для', 'меня', 'прошу', 'мой', 'это'],
};

/** The language a text is most likely written in, or null when it's too short or unclear. */
export function guessLanguage(text: string): string | null {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 20) return null;
  const counts = new Map<string, number>();
  for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  const scores = Object.entries(STOPWORDS)
    .map(([lang, list]) => [lang, list.reduce((n, w) => n + (counts.get(w) ?? 0), 0)] as const)
    .sort((a, b) => b[1] - a[1]);
  const [[best, top], [, second]] = scores;
  // Needs a clear lead: a few percent of all words, and well ahead of the runner-up.
  return top >= words.length * 0.05 && top >= second * 1.3 ? best : null;
}

/**
 * What's wrong with a written letter, as instructions for one more try. Empty when it's fine.
 * Checked in code: made-up amounts, the wrong language, and a letter cut off mid-sentence.
 */
export function letterProblems(letter: Pick<Letter, 'body'>, request: LetterRequest): string[] {
  const problems: string[] = [];
  if (unbackedAmounts(letter.body, request.text, request.happened).length > 0) problems.push(LETTER_STRICT.amounts);
  const want = guessLanguage(request.text);
  const got = guessLanguage(letter.body);
  if (want && got && want !== got) problems.push(LETTER_STRICT.language(want));
  const lastLine = letter.body.trim().split('\n').pop() ?? '';
  if (letter.body.trim().length < 150 || /[,:;(\-–]$/.test(lastLine.trim())) {
    problems.push('Your previous letter was cut off. Write the complete letter, through the sign-off and name.');
  }
  return problems;
}
