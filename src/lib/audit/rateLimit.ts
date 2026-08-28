const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit = 60, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) { buckets.set(key, { count: 1, reset: now + windowMs }); return { ok: true, remaining: limit - 1 }; }
  if (b.count >= limit) return { ok: false, remaining: 0 };
  b.count++; return { ok: true, remaining: limit - b.count };
}
