import { api } from '#/lib/api'
import type { LoginInput } from '#/server/validation/login.schema'

export const AUTH_SERVICE = {
  LOGIN: (input: LoginInput) =>
    api<{ loggedIn: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  LOGOUT: () =>
    api<{ loggedIn: boolean }>('/api/auth/logout', { method: 'POST' }),
}
