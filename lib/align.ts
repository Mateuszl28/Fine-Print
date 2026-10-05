// Places a quote on a photo using the words OCR found there. Pure, so it's testable.
// The model's own boxes are guesses; these come from where the words actually are.

import type { PhotoBox } from './schema';

export type OcrWord = { text: string; x0: number; y0: number; x1: number; y1: number; line: number };

const norm = (s: string) => s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');

function tokens(s: string) {
  return s.split(/\s+/).map(norm).filter(Boolean);
}

/** Equal, or one edit apart for longer words (OCR often swaps a letter: "fee" / "fce", "$29.99" / "529.99"). */
function same(a: string, b: string) {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Best local alignment of the quote's words against the OCR words (Smith–Waterman on tokens).
 * Returns the indexes of OCR words that matched, or null if too little of the quote was found.
 */
export function alignQuote(words: OcrWord[], quote: string, minShare = 0.6): number[] | null {
  const q = tokens(quote);
  const w = words.map((x) => norm(x.text));
  if (q.length === 0 || w.length === 0) return null;

  const MATCH = 2;
  const MISS = -1;
  const GAP = -1;
  const cols = w.length + 1;
  const score = new Int32Array((q.length + 1) * cols);
  let best = 0;
  let bestAt = 0;
  for (let i = 1; i <= q.length; i++) {
    for (let j = 1; j <= w.length; j++) {
      const diag = score[(i - 1) * cols + j - 1] + (w[j - 1] && same(q[i - 1], w[j - 1]) ? MATCH : MISS);
      const up = score[(i - 1) * cols + j] + GAP;
      const left = score[i * cols + j - 1] + GAP;
      const v = Math.max(0, diag, up, left);
      score[i * cols + j] = v;
      if (v > best) {
        best = v;
        bestAt = i * cols + j;
      }
    }
  }
  if (best === 0) return null;

  // Walk back from the best cell, collecting matched OCR words.
  const matched: number[] = [];
  let i = Math.floor(bestAt / cols);
  let j = bestAt % cols;
  while (i > 0 && j > 0 && score[i * cols + j] > 0) {
    const here = score[i * cols + j];
    const isMatch = w[j - 1] && same(q[i - 1], w[j - 1]);
    if (here === score[(i - 1) * cols + j - 1] + (isMatch ? MATCH : MISS)) {
      if (isMatch) matched.push(j - 1);
      i--;
      j--;
    } else if (here === score[(i - 1) * cols + j] + GAP) {
      i--;
    } else {
      j--;
    }
  }
  if (matched.length < Math.max(2, Math.ceil(q.length * minShare))) return null;
  return matched.sort((a, b) => a - b);
}

/** One box per text line the matched words sit on, normalised to 0–1000 like the model's boxes. */
export function boxesFor(words: OcrWord[], matched: number[], width: number, height: number, image: number): PhotoBox[] {
  const lines = new Map<number, { x0: number; y0: number; x1: number; y1: number }>();
  // Include unmatched words between the first and last match on a line, so a line reads as one mark.
  const first = matched[0];
  const last = matched[matched.length - 1];
  for (let k = first; k <= last; k++) {
    const wd = words[k];
    if (!wd.text.trim()) continue;
    const l = lines.get(wd.line);
    if (l) {
      l.x0 = Math.min(l.x0, wd.x0);
      l.y0 = Math.min(l.y0, wd.y0);
      l.x1 = Math.max(l.x1, wd.x1);
      l.y1 = Math.max(l.y1, wd.y1);
    } else lines.set(wd.line, { x0: wd.x0, y0: wd.y0, x1: wd.x1, y1: wd.y1 });
  }
  const pad = 0.003; // a hair of padding so the mark looks drawn, not clipped
  return [...lines.values()].map((b) => ({
    image,
    box: [
      Math.max(0, Math.round((b.y0 / height - pad) * 1000)),
      Math.max(0, Math.round((b.x0 / width - pad) * 1000)),
      Math.min(1000, Math.round((b.y1 / height + pad) * 1000)),
      Math.min(1000, Math.round((b.x1 / width + pad) * 1000)),
    ],
  }));
}
