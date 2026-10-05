// A shared report travels inside the link's #fragment, which browsers never send to a
// server. So sharing doesn't break "nothing is stored": the link is the only copy.

import type { Report } from './schema';
import { isLang, type Lang } from './i18n.ts';

export type SharedReport = { v: 1; lang: Lang; report: Report };

const PREFIX = 'r=';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeShare(report: Report, lang: Lang): Promise<string> {
  const payload: SharedReport = { v: 1, lang, report };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return PREFIX + toBase64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

/** Returns null for anything that isn't a valid shared report, so a mangled link just shows the start screen. */
export async function decodeShare(hash: string): Promise<SharedReport | null> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!h.startsWith(PREFIX)) return null;
  try {
    const json = await pipe(fromBase64Url(h.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
    const data = JSON.parse(new TextDecoder().decode(json));
    if (data?.v !== 1 || !isLang(data.lang) || typeof data.report?.text !== 'string' || !Array.isArray(data.report?.clauses)) {
      return null;
    }
    return data as SharedReport;
  } catch {
    return null;
  }
}
