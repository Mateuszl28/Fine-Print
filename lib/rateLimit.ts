// A small sliding-window limiter kept in the server's memory. On Vercel each function
// instance has its own memory, so this is a speed bump against someone hammering the
// public URL (and the AI credits behind it), not a hard guarantee.

export type Limiter = (key: string, now?: number) => { ok: boolean; retryAfterSeconds: number };

export function createLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return (key, now = Date.now()) => {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000) };
    }
    recent.push(now);
    hits.set(key, recent);
    // keep the map from growing forever
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    return { ok: true, retryAfterSeconds: 0 };
  };
}

export function clientKey(headers: Headers): string {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}
