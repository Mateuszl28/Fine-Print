import { generateText, Output, type ModelMessage } from 'ai';
import { analysisSchema, type AnalyzeError, type Report } from '@/lib/schema';
import { buildReport } from '@/lib/checkReport';
import { STRICT_REMINDER, systemPrompt } from '@/lib/prompt';
import { isLang, type Lang } from '@/lib/i18n';
import { clientKey, createLimiter } from '@/lib/rateLimit';

export const maxDuration = 120;

// Gemini 2.5 Flash is available on the AI Gateway free tier and handles photos and PDFs.
// Set FINEPRINT_MODEL to swap in another Gateway model (e.g. google/gemini-2.5-pro).
const MODEL = process.env.FINEPRINT_MODEL ?? 'google/gemini-2.5-flash';
const MAX_TEXT = 60_000; // characters, roughly 15 pages
const MAX_FILES = 4;
const MAX_BASE64 = 5_600_000; // ~4.2 MB of file data in total

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
  const allowed = limit(clientKey(req.headers));
  if (!allowed.ok) {
    return Response.json({ error: 'rate_limited' } satisfies AnalyzeError, {
      status: 429,
      headers: { 'retry-after': String(allowed.retryAfterSeconds) },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return fail('bad_input', 400);
  }

  const lang: Lang = isLang(body.lang) ? body.lang : 'en';
  const text = body.text?.trim();
  const files = body.files ?? [];

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

    return Response.json(report satisfies Report);
  } catch (err) {
    console.error('[analyze] failed', err);
    return fail('failed', 502);
  }
}

async function analyze(
  messages: ModelMessage[],
  sourceText: string | null,
  lang: Lang,
): Promise<Report | null> {
  const { output } = await generateText({
    model: MODEL,
    system: systemPrompt(lang),
    messages,
    output: Output.object({ schema: analysisSchema }),
    maxOutputTokens: 16_000,
    temperature: 0.2,
  });
  const text = sourceText ?? output.transcript ?? '';
  if (!output.isContract || text.trim().length < 80) return null;
  return buildReport(output, sourceText);
}
