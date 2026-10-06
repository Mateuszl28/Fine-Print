import type { AnalyzeError, Report } from './schema';
import type { Lang } from './i18n';

export type ContractInput =
  | { kind: 'text'; text: string; label?: string }
  | { kind: 'files'; files: { mediaType: string; data: string; name: string }[] };

export type AnalyzeResult = { ok: true; report: Report } | { ok: false; error: AnalyzeError['error'] };

export async function analyzeContract(
  input: ContractInput,
  lang: Lang,
  signal: AbortSignal,
): Promise<AnalyzeResult> {
  const body =
    input.kind === 'text'
      ? { lang, text: input.text }
      : { lang, files: input.files.map(({ mediaType, data }) => ({ mediaType, data })) };
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (res.status === 413) return { ok: false, error: 'too_long' };
    if (res.status === 429) return { ok: false, error: 'rate_limited' };
    if (res.status === 503) return { ok: false, error: 'busy' };
    const json = await res.json().catch(() => null);
    if (!res.ok || !json) return { ok: false, error: json?.error ?? 'failed' };
    return { ok: true, report: json as Report };
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return { ok: false, error: 'failed' };
  }
}
