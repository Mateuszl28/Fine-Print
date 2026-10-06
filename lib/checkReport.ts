import type { Analysis, LocatedClause, LocatedTerm, Report, Severity } from './schema.ts';
import { cleanLetterBody } from './letter.ts';
import { checkExitPlan } from './exit.ts';

const rank: Record<Severity, number> = { red: 3, yellow: 2, green: 1 };

// Fold the text so a quote still matches when the model changed curly quotes, dashes,
// line breaks or letter case. `map[i]` is the original index of folded char i.
function fold(input: string): { folded: string; map: number[] } {
  let folded = '';
  const map: number[] = [];
  let lastWasSpace = true;
  for (let i = 0; i < input.length; i++) {
    let ch = input[i];
    if (/\s/.test(ch)) {
      if (lastWasSpace) continue;
      ch = ' ';
      lastWasSpace = true;
    } else {
      lastWasSpace = false;
      if (/[‘’‚′]/.test(ch)) ch = "'";
      else if (/[“”„″]/.test(ch)) ch = '"';
      else if (/[‐‑‒–—―]/.test(ch)) ch = '-';
      else ch = ch.toLowerCase();
    }
    folded += ch;
    map.push(i);
  }
  return { folded, map };
}

function trimQuote(q: string): string {
  return q.trim().replace(/^["'“”‘’(\[]+|["'“”‘’)\]]+$/g, '').trim();
}

function findRange(
  text: ReturnType<typeof fold>,
  quote: string,
): { start: number; end: number } | null {
  // A quote may skip text with an ellipsis: match the first and last pieces in order.
  const pieces = trimQuote(quote)
    .split(/\s*(?:\.\.\.|…|\[\.\.\.\])\s*/)
    .map((p) => fold(p).folded.trim())
    .filter((p) => p.length > 0);
  if (pieces.length === 0) return null;

  const first = pieces[0];
  let at = text.folded.indexOf(first);
  if (at === -1) {
    // Models often drop or add the final full stop.
    const loose = first.replace(/[.;:,]$/, '');
    if (loose.length < 12) return null;
    at = text.folded.indexOf(loose);
    if (at === -1) return null;
    pieces[0] = loose;
  }
  let endFolded = at + pieces[0].length;
  for (const piece of pieces.slice(1)) {
    const next = text.folded.indexOf(piece, endFolded);
    if (next === -1) return null;
    endFolded = next + piece.length;
  }
  return { start: text.map[at], end: text.map[endFolded - 1] + 1 };
}

export function locateQuotes(
  text: string,
  clauses: Analysis['clauses'],
): { located: LocatedClause[]; dropped: number } {
  const folded = fold(text);
  const found: LocatedClause[] = [];
  let dropped = 0;
  for (const clause of clauses) {
    const range = findRange(folded, clause.quote);
    if (range) found.push({ ...clause, ...range, boxes: [] });
    else dropped++;
  }

  // Overlapping highlights can't both be drawn; keep the more serious one.
  const bySeverity = [...found].sort((a, b) => rank[b.severity] - rank[a.severity]);
  const kept: LocatedClause[] = [];
  for (const c of bySeverity) {
    const clash = kept.some((k) => c.start < k.end && k.start < c.end);
    if (clash) dropped++;
    else kept.push(c);
  }
  kept.sort((a, b) => a.start - b.start);
  return { located: kept, dropped };
}

const isWordChar = (ch: string | undefined) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);

/**
 * Finds each explained word where it first appears as a whole word. Words the model can't
 * back up are dropped, and so is a word that would straddle the edge of a highlight.
 */
export function locateTerms(text: string, glossary: Analysis['glossary'], clauses: LocatedClause[]): LocatedTerm[] {
  const folded = fold(text);
  const found: LocatedTerm[] = [];
  const seen = new Set<string>();
  for (const g of glossary) {
    const needle = fold(trimQuote(g.term)).folded.trim();
    if (needle.length < 2 || seen.has(needle)) continue;
    let from = 0;
    let range: { start: number; end: number } | null = null;
    while (from <= folded.folded.length) {
      const at = folded.folded.indexOf(needle, from);
      if (at === -1) break;
      const start = folded.map[at];
      const end = folded.map[at + needle.length - 1] + 1;
      const straddles = clauses.some((c) => (start < c.start && end > c.start) || (start < c.end && end > c.end));
      if (!isWordChar(text[start - 1]) && !isWordChar(text[end]) && !straddles) {
        range = { start, end };
        break;
      }
      from = at + 1;
    }
    if (!range) continue;
    if (found.some((f) => range.start < f.end && f.start < range.end)) continue;
    seen.add(needle);
    found.push({ term: text.slice(range.start, range.end), plain: g.plain, ...range });
  }
  return found.sort((a, b) => a.start - b.start).slice(0, 10);
}

// A fee the contract says is financed (added to the loan, so repaid inside the installments)
// must not be counted again. Models sometimes do; this catches it from the contract's own words.
const FINANCED = /added to the amount financed|added to the (?:loan|principal|balance)|included in the amount financed|is financed|wird mitfinanziert|zum (?:Darlehens|Kredit)betrag hinzugerechnet|doliczon[aey]? do kwoty kredytu|se suma al importe financiado/i;

export function amountPattern(amount: number) {
  const whole = Math.trunc(amount);
  const cents = Math.round((amount - whole) * 100);
  // "1,200" may be written 1,200 / 1.200 / 1 200; cents are optional ("$49" or "$49.00")
  const w = whole.toLocaleString('en-US').replace(/,/g, '[,.\\s]?');
  return new RegExp(`(?<![\\d.,])${w}(?:[.,]${String(cents).padStart(2, '0')})?(?![\\d])`);
}

export function dropFinancedFees(text: string, items: Analysis['costItems']): Analysis['costItems'] {
  const sentences = text.split(/(?<=[.;])\s+|\n+/);
  const financed = sentences.filter((s) => FINANCED.test(s));
  if (financed.length === 0) return items;
  return items.filter((i) => !(i.times === 1 && financed.some((s) => amountPattern(i.amount).test(s))));
}

// Where the contract sets the deposit: "security deposit of $1,450.00", "Kaution in Höhe von drei
// Nettokaltmieten (3.450,00 €)", "kaucję w wysokości 3 000 zł". The amount follows within a few words.
const DEPOSIT = /(?:security deposit|deposit) of|Kaution in Höhe von|Mietsicherheit (?:in Höhe )?von|kaucj[aęi] w wysokości|(?:depósito|fianza) de/gi;

function parseAmount(raw: string): number {
  const decimals = raw.match(/[.,](\d{2})$/);
  const whole = (decimals ? raw.slice(0, -3) : raw).replace(/[^\d]/g, '');
  return Number(whole) + (decimals ? Number(decimals[1]) / 100 : 0);
}

export function depositAmounts(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(DEPOSIT)) {
    const after = text.slice(m.index! + m[0].length, m.index! + m[0].length + 80);
    const num = after.match(/\d[\d.,  ]*\d|\d/);
    if (num) out.push(parseAmount(num[0].trim()));
  }
  return out;
}

/** A refundable deposit isn't a cost. Models sometimes list it anyway, e.g. as three installments. */
export function dropRefundableDeposits(text: string, items: Analysis['costItems']): Analysis['costItems'] {
  const deposits = depositAmounts(text).map((d) => Math.round(d * 100));
  if (deposits.length === 0) return items;
  const total = (i: Analysis['costItems'][number]) => Math.round(i.amount * 100) * Math.max(0, i.times);
  // ...or as separate one-off items of the same amount that add up to it ("1st, 2nd, 3rd installment").
  const split = new Set<number>();
  for (const one of items.filter((i) => i.times === 1)) {
    const same = items.filter((i) => i.times === 1 && i.amount === one.amount);
    if (same.length >= 2 && deposits.includes(Math.round(one.amount * 100) * same.length)) split.add(one.amount);
  }
  return items.filter((i) => !deposits.includes(total(i)) && !(i.times === 1 && split.has(i.amount)));
}

export function totalCost(items: Analysis['costItems']): number | null {
  if (items.length === 0) return null;
  const cents = items.reduce((sum, i) => sum + Math.round(i.amount * 100) * Math.max(0, i.times), 0);
  return cents / 100;
}

export function buildReport(analysis: Analysis, sourceText: string | null): Report {
  const text = (sourceText ?? analysis.transcript ?? '').replace(/\r\n/g, '\n');
  const { located, dropped } = locateQuotes(text, analysis.clauses);
  const ids = new Set(located.map((c) => c.id));
  const costItems = dropRefundableDeposits(text, dropFinancedFees(text, analysis.costItems));
  const { transcript: _transcript, clauses: _clauses, glossary, earlyExit, ...rest } = analysis;
  // Exit rules point at cost items by index; dropping a financed fee shifts the indexes.
  const exitRules = (earlyExit?.rules ?? []).flatMap((r) => {
    if (r.itemIndex === null) return [{ ...r, clauseId: r.clauseId && ids.has(r.clauseId) ? r.clauseId : null }];
    const kept = costItems.indexOf(analysis.costItems[r.itemIndex]);
    return kept === -1 ? [] : [{ ...r, itemIndex: kept, clauseId: r.clauseId && ids.has(r.clauseId) ? r.clauseId : null }];
  });
  const exitPlan =
    analysis.contractType === 'installment_loan' || !earlyExit
      ? null
      : checkExitPlan({ ...earlyExit, rules: exitRules }, costItems, analysis.termMonths, (n) => amountPattern(n).test(text));
  if (earlyExit && !exitPlan && analysis.contractType !== 'installment_loan') {
    console.warn('[report] exit rules dropped', JSON.stringify({ earlyExit, costItems, termMonths: analysis.termMonths }));
  }
  return {
    ...rest,
    text,
    clauses: located,
    terms: locateTerms(text, glossary ?? [], located),
    earlyExit: exitPlan,
    costItems: costItems.map((i) => ({
      ...i,
      clauseId: i.clauseId && ids.has(i.clauseId) ? i.clauseId : null,
    })),
    letter: { ...analysis.letter, body: cleanLetterBody(analysis.letter.body) },
    trueCost: totalCost(costItems),
    score: Math.min(10, Math.max(0, Math.round(analysis.score))),
    droppedQuotes: dropped,
  };
}
