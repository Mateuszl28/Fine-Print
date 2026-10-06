import { generateText, NoObjectGeneratedError, Output, streamText, type ModelMessage } from 'ai';
import { z } from 'zod';
import { analysisSchema, earlyExitSchema, type Analysis, type AnalyzeError, type Report } from '@/lib/schema';
import { buildReport, replaceUnbacked, unbackedCostItems } from '@/lib/checkReport';
import { addOnPrompt, costsPrompt, EXIT_PROMPT, STRICT_REMINDER, systemPrompt } from '@/lib/prompt';
import { acceptAddOn, missingAddOns } from '@/lib/addons';
import { isLang, type Lang } from '@/lib/i18n';
import { clientKey, createLimiter } from '@/lib/rateLimit';
import { cacheKey, createCache } from '@/lib/resultCache';
import { getCache } from '@vercel/functions';
import { LOOP } from '@/lib/loop';

export const maxDuration = 120;

// Gemini 2.5 Flash is available on the AI Gateway free tier and handles photos and PDFs.
// Set FINEPRINT_MODEL to swap in another Gateway model (e.g. google/gemini-2.5-pro).
const MODEL = process.env.FINEPRINT_MODEL ?? 'google/gemini-2.5-flash';
// Tokens Gemini may spend "thinking" before answering. Measured on the four samples:
// default ≈ 27–35 s; 0 ≈ 12–14 s but miscounted a loan fee; 512 ≈ 12–13 s with every total right.
const THINKING_BUDGET: number | null = process.env.FINEPRINT_THINKING ? Number(process.env.FINEPRINT_THINKING) : 512;
const MAX_TEXT = 60_000; // characters, roughly 15 pages
const MAX_FILES = 4;
const MAX_BASE64 = 5_600_000; // ~4.2 MB of file data in total

// Same pasted contract + language within a day → same report, instantly, at no cost.
// Two levels: this instance's memory, then Vercel's Runtime Cache, which every instance
// in the region shares (locally it falls back to memory too).
const DAY = 24 * 60 * 60;
const CACHE_VERSION = 'v12';
const local = createCache<Report>(200, DAY * 1000);
const shared = getCache({ namespace: 'fineprint-report' });

async function cachedReport(key: string): Promise<Report | undefined> {
  const hit = local.get(key);
  if (hit) return hit;
  try {
    const remote = (await shared.get(key)) as Report | null | undefined;
    if (remote) local.set(key, remote);
    return remote ?? undefined;
  } catch {
    return undefined;
  }
}

async function remember(key: string, report: Report) {
  local.set(key, report);
  try {
    await shared.set(key, report, { ttl: DAY, name: 'report' });
  } catch (err) {
    console.error('[analyze] runtime cache set failed', err);
  }
}

// 20 analyses an hour per address: plenty for a person (or a judge), not for a script.
const limit = createLimiter(20, 60 * 60 * 1000);

type Body = {
  lang?: string;
  text?: string;
  files?: { mediaType: string; data: string }[];
};

function fail(error: AnalyzeError['error'], status: number) {
  return Response.json({ error } satisfies AnalyzeError, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail('bad_input', 400);
  }

  const lang: Lang = isLang(body.lang) ? body.lang : 'en';
  const text = body.text?.trim();
  const files = body.files ?? [];

  // Cached answers cost nothing, so they don't count against the hourly limit.
  // Bump CACHE_VERSION whenever the prompt or the checker changes what a report contains.
  const key = text ? cacheKey(CACHE_VERSION, MODEL, String(THINKING_BUDGET), lang, text) : null;
  const cached = key ? await cachedReport(key) : undefined;
  if (cached) return Response.json(cached, { headers: { 'x-fineprint-cache': 'hit' } });

  const allowed = limit(clientKey(req.headers));
  if (!allowed.ok) {
    return Response.json({ error: 'rate_limited' } satisfies AnalyzeError, {
      status: 429,
      headers: { 'retry-after': String(allowed.retryAfterSeconds) },
    });
  }

  if (!text && files.length === 0) return fail('bad_input', 400);
  if (text && text.length > MAX_TEXT) return fail('too_long', 413);
  if (files.length > MAX_FILES) return fail('too_long', 413);
  if (files.reduce((n, f) => n + f.data.length, 0) > MAX_BASE64) return fail('too_long', 413);
  if (files.some((f) => !/^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(f.mediaType))) {
    return fail('bad_input', 400);
  }

  const content: Extract<ModelMessage, { role: 'user' }>['content'] = text
    ? [{ type: 'text', text: `Here is the contract text:\n\n${text}` }]
    : [
        { type: 'text', text: 'Here is the contract (photo or PDF). Transcribe it, then analyze it.' },
        ...files.map((f) => ({ type: 'file' as const, mediaType: f.mediaType, data: f.data })),
      ];

  try {
    const messages: ModelMessage[] = [{ role: 'user', content }];
    let report = await analyze(messages, text ?? null, lang);
    if (!report) return fail('not_a_contract', 422);

    // If most quotes didn't survive the check, ask once more, more strictly.
    if (report.clauses.length < 2 && report.droppedQuotes > 0) {
      const retry = await analyze(
        [...messages, { role: 'user', content: STRICT_REMINDER }],
        text ?? null,
        lang,
      );
      if (retry && retry.clauses.length > report.clauses.length) report = retry;
    }

    if (key) await remember(key, report);
    return Response.json(report satisfies Report);
  } catch (err) {
    console.error('[analyze] failed', err);
    // The AI Gateway's per-minute limit (5 a minute on the free tier): say "try again in a minute".
    if (/RateLimit/i.test(`${(err as Error)?.name} ${(err as { lastError?: Error })?.lastError?.name} ${err}`)) {
      return fail('busy', 503);
    }
    return fail('failed', 502);
  }
}

async function analyze(
  messages: ModelMessage[],
  sourceText: string | null,
  lang: Lang,
): Promise<Report | null> {
  let output;
  try {
    output = await generate(messages, lang, 0);
  } catch (err) {
    // At temperature 0 Gemini now and then gets stuck repeating one character (seen: a German
    // title followed by thousands of newlines), and a stream can break off mid-answer. Either way
    // the answer is unusable; one more try, a little warmer, almost always comes back whole.
    if (!(err instanceof Looping) && !NoObjectGeneratedError.isInstance(err)) throw err;
    console.warn('[analyze] unusable answer, retrying warmer:', err instanceof Looping ? 'looping' : 'cut off');
    output = await generate(messages, lang, 0.4);
  }
  const text = sourceText ?? output.transcript ?? '';
  if (!output.isContract || text.trim().length < 80) return null;

  // An amount that isn't in the contract was worked out, not read (seen: a loan payment with an
  // add-on subtracted from it). Ask for the costs again from the contract's own numbers.
  let reread: Analysis['costItems'] = [];
  const unbacked = unbackedCostItems(text, output.costItems);
  if (unbacked.length > 0) {
    const replacements = await askCosts(text, output.costItems, unbacked).catch((err) => {
      console.error('[analyze] cost re-read failed', err);
      return null;
    });
    const again = replacements && replacements.length > 0 ? replaceUnbacked(output.costItems, unbacked, replacements) : null;
    const fixed = again !== null && unbackedCostItems(text, again).length === 0;
    console.info('[analyze] cost re-read', JSON.stringify({ unbacked: unbacked.map((i) => i.amount), fixed }));
    if (fixed) {
      reread = unbacked;
      output = { ...output, costItems: again };
    }
  }

  // An add-on the contract signs you up for, missing from the cost: ask about that one clause.
  const added: Analysis['costItems'] = [];
  if (output.termMonths && output.termMonths >= 1) {
    for (const hint of missingAddOns(text, output.costItems).slice(0, 2)) {
      const item = await askAddOn(lang, output.termMonths, output.costItems, hint.sentence).catch((err) => {
        console.error('[analyze] add-on follow-up failed', err);
        return null;
      });
      const kept = acceptAddOn(item, hint, output.termMonths, text);
      console.info('[analyze] add-on follow-up', JSON.stringify({ amount: hint.amount, proposed: item, kept: Boolean(kept) }));
      if (kept) added.push(kept);
    }
    if (added.length > 0) output = { ...output, costItems: [...output.costItems, ...added] };
  }
  const report = buildReport(output, sourceText, added, reread);

  // The model said there are exit terms, but they didn't check out (a number it worked out
  // itself, a missing amount). One short, focused question usually gets them right.
  const worthAsking =
    !report.earlyExit &&
    output.earlyExit !== null &&
    output.contractType !== 'installment_loan' &&
    (output.termMonths ?? 0) >= 2 &&
    output.costItems.length > 0;
  if (worthAsking) {
    const earlyExit = await askExitRules(text, output.costItems).catch((err) => {
      console.error('[analyze] exit rules retry failed', err);
      return null;
    });
    if (earlyExit) {
      const second = buildReport({ ...output, earlyExit }, sourceText, added, reread);
      if (second.earlyExit) return second;
    }
  }
  return report;
}

const costsSchema = z.object({ replacements: analysisSchema.shape.costItems });

async function askCosts(text: string, items: Analysis['costItems'], unbacked: Analysis['costItems']) {
  const list = items.map((i) => `- ${i.label}: ${i.amount} × ${i.times}, from month ${i.fromMonth}, every ${i.everyMonths}`).join('\n');
  const { output } = await generateText({
    model: MODEL,
    prompt: `${costsPrompt(list, unbacked.map((i) => `${i.amount} (${i.label})`).join(', '))}\n\nThe contract:\n---\n${text}\n---`,
    output: Output.object({ schema: costsSchema }),
    maxOutputTokens: 3_000,
    temperature: 0,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 512 } } },
  });
  return output.replacements;
}

const addOnSchema = z.object({
  item: z
    .object({ label: z.string(), amount: z.number(), times: z.number(), fromMonth: z.number(), everyMonths: z.number() })
    .nullable(),
});

async function askAddOn(lang: Lang, termMonths: number, items: Analysis['costItems'], sentence: string) {
  const list = items.map((i) => `- ${i.label}: ${i.amount} × ${i.times}`).join('\n');
  const { output } = await generateText({
    model: MODEL,
    prompt: addOnPrompt(lang, termMonths, list, sentence),
    output: Output.object({ schema: addOnSchema }),
    maxOutputTokens: 1_000,
    temperature: 0,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
  });
  return output.item ? { ...output.item, clauseId: null } : null;
}

async function askExitRules(text: string, items: Analysis['costItems']) {
  const list = items
    .map((i, n) => `${n}: ${i.label} — ${i.amount} × ${i.times}, from month ${i.fromMonth}, every ${i.everyMonths} months`)
    .join('\n');
  const { output } = await generateText({
    model: MODEL,
    system: EXIT_PROMPT.replace('{{ITEMS}}', list),
    prompt: `Here is the contract text:\n\n${text}`,
    output: Output.object({ schema: z.object({ earlyExit: earlyExitSchema }) }),
    maxOutputTokens: 2_000,
    temperature: 0,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 512 } } },
  });
  return output.earlyExit;
}


class Looping extends Error {}


/** Streams the analysis so a stuck model is caught in a second instead of after a minute of junk. */
async function generate(messages: ModelMessage[], lang: Lang, temperature: number) {
  const stop = new AbortController();
  const result = streamText({
    model: MODEL,
    system: systemPrompt(lang),
    messages,
    output: Output.object({ schema: analysisSchema }),
    maxOutputTokens: 16_000,
    temperature,
    abortSignal: stop.signal,
    // The stream keeps going on errors; result.output then fails to parse and analyze() retries.
    onError: ({ error }) => console.error('[analyze] stream error', error),
    ...(THINKING_BUDGET !== null && {
      providerOptions: { google: { thinkingConfig: { thinkingBudget: THINKING_BUDGET } } },
    }),
  });
  let tail = '';
  for await (const delta of result.textStream) {
    tail = (tail + delta).slice(-800);
    if (LOOP.test(tail)) {
      stop.abort();
      throw new Looping();
    }
  }
  return await result.output;
}
