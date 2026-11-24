import { z } from 'zod'

const placeSchema = z.object({
  venue: z.string().max(120),
  time: z.string().max(40),
})

// What a wedding stores in `Event.details`. Every part is optional and falls
// back to "not set" on its own, so the page still shows when one is missing.
const weddingDetailsSchema = z.object({
  headline: z.string().max(200).optional().catch(undefined),
  ceremony: placeSchema.optional().catch(undefined),
  reception: placeSchema.optional().catch(undefined),
})

export type WeddingDetails = z.infer<typeof weddingDetailsSchema>

export function readWeddingDetails(saved: unknown): WeddingDetails {
  const result = weddingDetailsSchema.safeParse(saved)
  return result.success ? result.data : {}
}
