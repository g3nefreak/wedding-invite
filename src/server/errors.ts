// Every error the API is allowed to show a visitor, with its HTTP status.
const STATUS_BY_CODE = {
  NOT_FOUND: 404,
  VALIDATION: 400,
  REPLY_CLOSED: 409,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  INTERNAL: 500,
} as const

export type ErrorCode = keyof typeof STATUS_BY_CODE

// Services throw this when a rule says no. Its message is safe to show,
// so never put internal details (ids, SQL, stack traces) in it.
export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number

  constructor(code: ErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = STATUS_BY_CODE[code]
  }
}
