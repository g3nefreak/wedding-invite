import { randomBytes } from 'node:crypto'

// 32 random bytes written as url-safe text are always 43 characters.
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{43}$/

// A guest's personal link is this token. It is random, never built from
// the guest's name, so nobody can guess another guest's link.
export function newGuestToken(): string {
  return randomBytes(32).toString('base64url')
}

// Cheap check done before any database lookup, so junk never reaches it.
export function isTokenShape(value: string): boolean {
  return TOKEN_SHAPE.test(value)
}
