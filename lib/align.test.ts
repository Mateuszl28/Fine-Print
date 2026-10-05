import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignQuote, boxesFor, type OcrWord } from './align.ts';

// Two lines of a fake OCR result, 20px per word, lines 30px apart. "fee" misread as "fce".
function page(lines: string[]): OcrWord[] {
  return lines.flatMap((text, line) =>
    text.split(' ').map((t, k) => ({ text: t, x0: 10 + k * 20, x1: 28 + k * 20, y0: 10 + line * 30, y1: 30 + line * 30, line })),
  );
}

const words = page([
  '3. ONE-TIME CHARGES. A one-time activation fce of $35.00 will appear',
  'on your first bill. 4. ADMINISTRATIVE FEE. A monthly fee',
]);

test('finds a quote across a line break despite an OCR typo', () => {
  const m = alignQuote(words, 'A one-time activation fee of $35.00 will appear on your first bill.');
  assert.ok(m);
  assert.equal(words[m![0]].text, 'A');
  assert.equal(words[m![m!.length - 1]].text, 'bill.');
});

test('gives one box per line, normalised to 0–1000', () => {
  const m = alignQuote(words, 'A one-time activation fee of $35.00 will appear on your first bill.')!;
  const boxes = boxesFor(words, m, 400, 100, 0);
  assert.equal(boxes.length, 2);
  const [y0, , y1] = boxes[0].box;
  assert.ok(y0 < 110 && y1 > 290, `first line box ${boxes[0].box}`);
  assert.ok(boxes[1].box[0] > boxes[0].box[0]);
});

test('refuses quotes that are not really there', () => {
  assert.equal(alignQuote(words, 'You may cancel at any time without any penalty whatsoever.'), null);
});
