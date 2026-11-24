type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

// Thrown when our API answers `ok: false`. The message is safe to show.
export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

// Calls our own /api and returns the data inside the response envelope.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = (await response.json()) as Envelope<T>
  if (!body.ok) throw new ApiError(body.error.code, body.error.message)
  return body.data
}
