// Makes the samples' reports once, with the real model, and saves the ones that pass their checks
// to public/samples/ so the app can open a sample without calling the AI.
//
//   FINEPRINT_FRESH=1 npm start          (in one terminal: a local production server)
//   npm run samples                      (in another)
//
// Requests are spaced out to stay under the AI Gateway free tier's 5 requests a minute.

import { mkdirSync, writeFileSync } from 'node:fs';
import { samples, phonePlanB } from '../lib/samples.ts';

const BASE = process.env.FINEPRINT_URL ?? 'http://localhost:3000';
const SPACING_MS = Number(process.env.SPACING_MS ?? 25_000);
const LANGS = ['en', 'pl', 'uk', 'es', 'de'];
// Totals worked out by hand from each sample's own terms.
const EXPECTED: Record<string, number> = {
  gym: 886.76,
  lease: 19054.4,
  phone: 1798.76,
  loan: 1646.82,
  miet: 70080,
  'phone-b': 1668,
};

const outDir = new URL('../public/samples/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
const only = process.argv.slice(2); // e.g. `npm run samples -- loan.es gym`

type Report = { text: string; trueCost: number | null; clauses: unknown[]; checks?: { quotes: { notFound: number }; unbacked?: unknown[] } };

function problems(id: string, r: Report): string[] {
  const out: string[] = [];
  if (r.trueCost !== EXPECTED[id]) out.push(`total ${r.trueCost}, expected ${EXPECTED[id]}`);
  if (r.clauses.length < 4) out.push(`only ${r.clauses.length} clauses`);
  if ((r.checks?.quotes.notFound ?? 0) > 1) out.push(`${r.checks!.quotes.notFound} quotes not found`);
  if ((r.checks?.unbacked?.length ?? 0) > 0) out.push('amounts not in the contract');
  return out;
}

const results: string[] = [];
for (const sample of [...samples, phonePlanB]) {
  for (const lang of LANGS) {
    const name = `${sample.id}.${lang}`;
    if (only.length && !only.some((o) => name === o || sample.id === o)) continue;
    let saved = false;
    for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
      const res = await fetch(`${BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(attempt > 1 && { 'x-fineprint-fresh': '1' }) },
        body: JSON.stringify({ lang, text: sample.text }),
      });
      const cached = res.headers.get('x-fineprint-cache') === 'hit';
      const body = (await res.json()) as Report & { error?: string };
      const issues = res.ok ? problems(sample.id, body) : [`HTTP ${res.status} ${body.error}`];
      if (issues.length === 0) {
        writeFileSync(new URL(`${name}.json`, outDir), JSON.stringify(body));
        results.push(`ok    ${name}  ${body.trueCost}`);
        console.log(`ok    ${name}  ${body.trueCost}${cached ? ' (cache)' : ''}`);
        saved = true;
      } else {
        console.log(`retry ${name}  attempt ${attempt}: ${issues.join('; ')}`);
      }
      if (!cached) await sleep(SPACING_MS);
    }
    if (!saved) results.push(`FAIL  ${name}`);
  }
}
console.log('\n' + results.join('\n'));
if (results.some((r) => r.startsWith('FAIL'))) process.exitCode = 1;
