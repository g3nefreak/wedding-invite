import { expect, it } from 'vitest'
import { isTokenShape, newGuestToken } from '#/server/auth/token'

it('makes 43-character url-safe tokens', () => {
  expect(newGuestToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
})

it('does not repeat', () => {
  expect(new Set(Array.from({ length: 1000 }, newGuestToken)).size).toBe(1000)
})

it('accepts its own tokens', () => {
  expect(isTokenShape(newGuestToken())).toBe(true)
})

it('rejects wrong shapes', () => {
  for (const bad of [
    '',
    'ana-reyes',
    'a'.repeat(44),
    'a'.repeat(42) + '!',
    'a'.repeat(5000),
  ])
    expect(isTokenShape(bad)).toBe(false)
})
