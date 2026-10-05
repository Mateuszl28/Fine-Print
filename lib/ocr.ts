// Runs in the browser: reads the person's photos with Tesseract (on the device, nothing
// is uploaded) and places each verified quote where its words actually are.

import type { LocatedClause, PhotoBox } from './schema';
import { alignQuote, boxesFor, type OcrWord } from './align';

/** Tesseract language packs to load, guessed from the contract text the model transcribed. */
export function ocrLangs(text: string): string {
  if (/[Ѐ-ӿ]/.test(text)) return 'ukr+eng';
  if (/[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(text)) return 'pol+eng';
  if (/[äöüßÄÖÜ]/.test(text)) return 'deu+eng';
  if (/[ñáéíóú¿¡]/i.test(text)) return 'spa+eng';
  return 'eng';
}

function size(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function placeOnPhotos(
  photos: { mediaType: string; data: string }[],
  clauses: LocatedClause[],
  contractText: string,
): Promise<Map<string, PhotoBox[]>> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(ocrLangs(contractText));
  const placed = new Map<string, PhotoBox[]>();
  try {
    for (let image = 0; image < photos.length; image++) {
      const url = `data:${photos[image].mediaType};base64,${photos[image].data}`;
      const { width, height } = await size(url);
      const { data } = await worker.recognize(url, {}, { blocks: true });
      const words: OcrWord[] = [];
      let line = 0;
      for (const b of data.blocks ?? [])
        for (const p of b.paragraphs)
          for (const l of p.lines) {
            for (const w of l.words) words.push({ text: w.text, ...w.bbox, line });
            line++;
          }
      for (const c of clauses) {
        if (placed.has(c.id)) continue;
        const matched = alignQuote(words, c.quote);
        if (matched) placed.set(c.id, boxesFor(words, matched, width, height, image));
      }
    }
  } finally {
    await worker.terminate();
  }
  return placed;
}
