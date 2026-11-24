import { z } from 'zod'
import type { DesignOverrides } from '#/server/config/themes'

// The accent ends up inside the page's CSS, so only a plain hex color is
// allowed. Anything else could smuggle extra CSS into the invitation.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/)

// Each field falls back to "not set" on its own, so one bad saved value
// cannot break the whole invitation.
const savedDesignSchema = z.object({
  accent: hexColor.optional().catch(undefined),
  fontPairIndex: z.number().int().min(0).optional().catch(undefined),
  backgroundAssetId: z.string().min(1).optional().catch(undefined),
  overlay: z.number().optional().catch(undefined),
})

// Reads the design saved on an event and keeps only what a host may change.
export function readDesignOverrides(saved: unknown): DesignOverrides {
  const result = savedDesignSchema.safeParse(saved)
  return result.success ? result.data : {}
}
