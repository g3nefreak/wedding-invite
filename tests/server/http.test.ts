import { expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AppError } from '#/server/errors'
import { handle, ok } from '#/server/http'

it('ok wraps data', async () => {
  expect(await ok({ a: 1 }).json()).toEqual({ ok: true, data: { a: 1 } })
})

it('handle maps AppError', async () => {
  const res = await handle(async () => {
    throw new AppError('REPLY_CLOSED', 'Replies are closed')
  })
  expect(res.status).toBe(409)
  expect(await res.json()).toEqual({
    ok: false,
    error: { code: 'REPLY_CLOSED', message: 'Replies are closed' },
  })
})

it('handle maps a failed zod check to 400', async () => {
  const res = await handle(async () => {
    z.strictObject({ a: z.string() }).parse({ a: 1 })
    return ok(null)
  })
  expect(res.status).toBe(400)
  expect((await res.json()).error.code).toBe('VALIDATION')
})

it('handle hides unknown errors', async () => {
  // The real error is logged on the server; keep the test output quiet.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const res = await handle(async () => {
    throw new Error('db password leaked')
  })
  expect(res.status).toBe(500)
  expect(JSON.stringify(await res.json())).not.toContain('password')
})
