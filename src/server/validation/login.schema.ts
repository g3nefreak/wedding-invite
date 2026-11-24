import { z } from 'zod'

export const loginSchema = z.strictObject({
  email: z.email('Enter your email address, like name@example.com').max(254),
  password: z.string().min(1, 'Enter your password').max(200),
})

export type LoginInput = z.infer<typeof loginSchema>
