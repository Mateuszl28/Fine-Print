import type { Analysis, LocatedClause, Report, Severity } from './schema.ts';
import { cleanLetterBody } from './letter.ts';

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

// A fee the contract says is financed (added to the loan, so repaid inside the installments)
// must not be counted again. Models sometimes do; this catches it from the contract's own words.
const FINANCED = /added to the amount financed|added to the (?:loan|principal|balance)|included in the amount financed|is financed|wird mitfinanziert|zum (?:Darlehens|Kredit)betrag hinzugerechnet|doliczon[aey]? do kwoty kredytu|se suma al importe financiado/i;

function amountPattern(amount: number) {
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

export function totalCost(items: Analysis['costItems']): number | null {
  if (items.length === 0) return null;
  const cents = items.reduce((sum, i) => sum + Math.round(i.amount * 100) * Math.max(0, i.times), 0);
  return cents / 100;
}

export function buildReport(analysis: Analysis, sourceText: string | null): Report {
  const text = (sourceText ?? analysis.transcript ?? '').replace(/\r\n/g, '\n');
  const { located, dropped } = locateQuotes(text, analysis.clauses);
  const ids = new Set(located.map((c) => c.id));
  const costItems = dropFinancedFees(text, analysis.costItems);
  const { transcript: _transcript, clauses: _clauses, ...rest } = analysis;
  return {
    ...rest,
    text,
    clauses: located,
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
