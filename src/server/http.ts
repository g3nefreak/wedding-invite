import { ZodError } from 'zod'
import { AppError } from '#/server/errors'
import type { ErrorCode } from '#/server/errors'

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ ok: true, data }, { status })
}

function fail(code: ErrorCode, message: string, status: number): Response {
  return Response.json({ ok: false, error: { code, message } }, { status })
}

// Wrap every API route in this so all errors leave in the same shape.
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.code, error.message, error.status)
    }
    if (error instanceof ZodError) {
      return fail('VALIDATION', 'Some of the details sent are not valid', 400)
    }
    // Unknown errors can hold secrets (connection strings, SQL), so the real
    // one stays in the server log and the visitor gets a plain message.
    console.error(error)
    return fail('INTERNAL', 'Something went wrong', 500)
  }
}
