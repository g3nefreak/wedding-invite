import { z } from 'zod'

// A role's wording, shown on the invitation of every guest who has it.
// Only the title is required; the rest may be left empty.
export const roleSchema = z.strictObject({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title, such as Maid of Honor')
    .max(60),
  askText: z.string().trim().max(200),
  note: z.string().trim().max(300),
  attire: z.string().trim().max(120),
})

// Only what is sent is changed.
export const updateRoleSchema = roleSchema.partial()

export type RoleInput = z.infer<typeof roleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
