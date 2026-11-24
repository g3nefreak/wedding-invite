import { beforeEach, expect, it } from 'vitest'
import { makeHandler as makeGet } from '#/app/api/invites/[token]/route'
import { makeHandler as makePut } from '#/app/api/invites/[token]/rsvp/route'
import {
  fakeInviteRepository,
  sampleRecords,
  T1,
  UNKNOWN_VALID_SHAPE,
} from '../server/fakes'

const GOING = JSON.stringify({ answer: 'going', message: '' })

function req(method: 'GET' | 'PUT', body?: string, ip = '203.0.113.7') {
  return new Request('http://localhost/api/invites/x', {
    method,
    body,
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  })
}

function ctx(token: string) {
  return { params: Promise.resolve({ token }) }
}

let GET: ReturnType<typeof makeGet>
let PUT: ReturnType<typeof makePut>

// Fresh handlers per test, so one test's request count cannot trip another's limit.
beforeEach(() => {
  const repo = fakeInviteRepository(sampleRecords())
  GET = makeGet(repo)
  PUT = makePut(repo)
})

it('GET returns the envelope', async () => {
  const res = await GET(req('GET'), ctx(T1))
  expect(res.status).toBe(200)
  expect((await res.json()).data.guestName).toBe('Ana Reyes')
})

it('GET unknown token is 404', async () => {
  expect((await GET(req('GET'), ctx(UNKNOWN_VALID_SHAPE))).status).toBe(404)
})

it('GET with a very long or odd token is 404, not 500', async () => {
  for (const odd of ['a'.repeat(5000), '../../etc/passwd', '%00'])
    expect((await GET(req('GET'), ctx(odd))).status).toBe(404)
})

it('the 31st GET in a minute from one address is 429', async () => {
  for (let i = 0; i < 30; i++) await GET(req('GET'), ctx(T1))
  expect((await GET(req('GET'), ctx(T1))).status).toBe(429)
  // Someone else is not affected.
  expect(
    (await GET(req('GET', undefined, '198.51.100.9'), ctx(T1))).status,
  ).toBe(200)
})

it('PUT saves the reply', async () => {
  const res = await PUT(req('PUT', GOING), ctx(T1))
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({
    ok: true,
    data: { answer: 'going', message: '' },
  })
})

it('PUT with broken JSON is 400 VALIDATION', async () => {
  const res = await PUT(req('PUT', '{not json'), ctx(T1))
  expect(res.status).toBe(400)
  expect((await res.json()).error.code).toBe('VALIDATION')
})

it('PUT with an extra field is 400', async () => {
  const body = JSON.stringify({ answer: 'going', role: 'x' })
  expect((await PUT(req('PUT', body), ctx(T1))).status).toBe(400)
})

it('the 11th PUT in a minute for one token is 429', async () => {
  for (let i = 0; i < 10; i++) await PUT(req('PUT', GOING), ctx(T1))
  expect((await PUT(req('PUT', GOING), ctx(T1))).status).toBe(429)
})
