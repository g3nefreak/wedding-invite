import { beforeEach, expect, it, vi } from 'vitest'
import { makeHandler } from '#/app/api/auth/login/route'

function req(body: string) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '203.0.113.7' },
  })
}

const GOOD = JSON.stringify({
  email: 'mika@example.com',
  password: 'correct-horse',
})
const signIn = vi.fn(
  async (_email: string, password: string) => password === 'correct-horse',
)
let POST: ReturnType<typeof makeHandler>

beforeEach(() => {
  signIn.mockClear()
  POST = makeHandler(signIn)
})

it('logs in with the right password', async () => {
  const res = await POST(req(GOOD))
  expect(res.status).toBe(200)
  expect(signIn).toHaveBeenCalledWith('mika@example.com', 'correct-horse')
})

it('refuses a wrong password without saying which part was wrong', async () => {
  const res = await POST(
    req(JSON.stringify({ email: 'mika@example.com', password: 'nope-nope' })),
  )
  expect(res.status).toBe(401)
  expect((await res.json()).error.message).toBe(
    'Email or password is incorrect',
  )
})

it('rejects a body that is not an email and password', async () => {
  for (const bad of [
    '{not json',
    '{}',
    JSON.stringify({ email: 'not-an-email', password: 'x' }),
    JSON.stringify({ email: 'a@b.co', password: 'pw', admin: true }),
  ]) {
    expect((await POST(req(bad))).status).toBe(400)
  }
  expect(signIn).not.toHaveBeenCalled()
})

it('the 11th attempt in a minute from one address is 429', async () => {
  for (let i = 0; i < 10; i++) await POST(req(GOOD))
  expect((await POST(req(GOOD))).status).toBe(429)
})
