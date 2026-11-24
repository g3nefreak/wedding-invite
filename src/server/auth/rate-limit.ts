import { AppError } from '#/server/errors'

type Window = { startedAt: number; count: number }

// Once this many keys are tracked, finished windows are cleared out so a
// flood of different addresses cannot grow memory without end.
const SWEEP_AT = 5000

// Counts requests per key in fixed windows, kept in memory. Each server
// instance counts on its own, which is accepted for version 1.
export function createRateLimiter(opts: { limit: number; windowMs: number }) {
  const windows = new Map<string, Window>()

  function sweep(now: number) {
    for (const [key, window] of windows) {
      if (now - window.startedAt >= opts.windowMs) windows.delete(key)
    }
  }

  return {
    // True when the request is allowed.
    check(key: string, now = Date.now()): boolean {
      if (windows.size >= SWEEP_AT) sweep(now)

      const window = windows.get(key)
      if (!window || now - window.startedAt >= opts.windowMs) {
        windows.set(key, { startedAt: now, count: 1 })
        return true
      }
      window.count += 1
      return window.count <= opts.limit
    },
  }
}

export type RateLimiter = ReturnType<typeof createRateLimiter>

export function assertWithinLimit(limiter: RateLimiter, key: string): void {
  if (!limiter.check(key)) {
    throw new AppError(
      'RATE_LIMITED',
      'Too many requests. Try again in a minute.',
    )
  }
}

// Behind a proxy (Vercel) the visitor's address is the first entry here.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}
