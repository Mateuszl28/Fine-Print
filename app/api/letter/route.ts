import { generateText, Output } from 'ai';
import { z } from 'zod';
import {
  cleanLetterBody,
  LETTER_SYSTEM,
  letterPrompt,
  letterProblems,
  parseLetterRequest,
  type Letter,
  type LetterRequest,
} from '@/lib/letter';
import { clientKey, createLimiter } from '@/lib/rateLimit';
import { cacheKey, createCache } from '@/lib/resultCache';
import type { AnalyzeError } from '@/lib/schema';

export const maxDuration = 60;

const MODEL = process.env.FINEPRINT_MODEL ?? 'google/gemini-2.5-flash';

const letterSchema = z.object({
  // Named first so the model settles the language before it writes a word of the letter.
  contractLanguage: z.string().describe('The language the contract text is written in, e.g. "German"'),
  subject: z.string(),
  body: z.string(),
});

// Same contract, same letter, same choices → the same letter, without another model call.
const cache = createCache<Letter>(200, 24 * 60 * 60 * 1000);
// Letters are short and cheap, but still cost something: 30 an hour per address.
const limit = createLimiter(30, 60 * 60 * 1000);

function fail(error: AnalyzeError['error'], status: number) {
  return Response.json({ error } satisfies AnalyzeError, { status });
}

export async function POST(req: Request) {
  const request = parseLetterRequest(await req.json().catch(() => null));
  if (!request) return fail('bad_input', 400);

  const key = cacheKey('letter-v3', MODEL, JSON.stringify(request));
  const cached = cache.get(key);
  if (cached) return Response.json(cached, { headers: { 'x-fineprint-cache': 'hit' } });

  const allowed = limit(clientKey(req.headers));
  if (!allowed.ok) {
    return Response.json({ error: 'rate_limited' } satisfies AnalyzeError, {
      status: 429,
      headers: { 'retry-after': String(allowed.retryAfterSeconds) },
    });
  }

  try {
    let letter = await write(request, []);
    // Made-up amounts, the wrong language or a cut-off letter: say what's wrong and ask once more.
    let problems = letterProblems(letter, request);
    if (problems.length > 0) {
      const retry = await write(request, problems);
      const retryProblems = letterProblems(retry, request);
      if (retryProblems.length <= problems.length) [letter, problems] = [retry, retryProblems];
    }
    if (problems.length > 0) console.warn('[letter] still has problems', problems);
    else cache.set(key, letter);
    return Response.json(letter);
  } catch (err) {
    console.error('[letter] failed', err);
    return fail('failed', 502);
  }
}

async function write(request: LetterRequest, fix: string[]): Promise<Letter> {
  const { output } = await generateText({
    model: MODEL,
    system: LETTER_SYSTEM,
    prompt: [letterPrompt(request), ...fix].join('\n\n'),
    output: Output.object({ schema: letterSchema }),
    maxOutputTokens: 4_000,
    temperature: 0,
    // A letter needs no long deliberation; this keeps it to a few seconds.
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 0 } } },
  });
  return { kind: request.kind, subject: output.subject.trim(), body: cleanLetterBody(output.body) };
}
