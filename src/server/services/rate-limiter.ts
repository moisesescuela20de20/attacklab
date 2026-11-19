// Limitador simple en memoria: cuenta eventos por clave dentro de una ventana de tiempo.
export function createRateLimiter(maxEvents: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>();
  return {
    /** Devuelve los segundos que faltan para poder reintentar, o 0 si está permitido. */
    retryAfter(key: string): number {
      const recent = (hits.get(key) ?? []).filter((t) => now() - t < windowMs);
      hits.set(key, recent);
      if (recent.length < maxEvents) return 0;
      return Math.ceil((recent[0]! + windowMs - now()) / 1000);
    },
    record(key: string): void {
      const list = hits.get(key) ?? [];
      list.push(now());
      hits.set(key, list);
    },
    reset(key: string): void {
      hits.delete(key);
    },
  };
}
export type RateLimiter = ReturnType<typeof createRateLimiter>;
