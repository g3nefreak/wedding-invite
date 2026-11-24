import { expect, it } from 'vitest'
import { createRateLimiter } from '#/server/auth/rate-limit'

it('allows up to the limit, then refuses, then resets', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
  expect([rl.check('a', 0), rl.check('a', 1), rl.check('a', 2)]).toEqual([
    true,
    true,
    false,
  ])
  expect(rl.check('a', 1001)).toBe(true)
  expect(rl.check('b', 2)).toBe(true)
})
