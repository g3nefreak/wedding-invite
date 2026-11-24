import { z } from 'zod'

const name = z.string().trim().min(1, "Enter the guest's name").max(80)

// One guest, added with the form.
export const guestSchema = z.strictObject({
  name,
  // null means an ordinary guest with no role.
  roleId: z.uuid().nullable(),
  personalNote: z.string().trim().max(300),
})

// Many guests at once, from a pasted list of names.
export const guestListSchema = z.strictObject({
  names: z.array(name).min(1, 'Paste at least one name').max(200),
})

// The link token is never accepted from outside: the server makes it.
export const newGuestsSchema = z.union([guestSchema, guestListSchema])

// Only what is sent is changed.
export const updateGuestSchema = guestSchema.partial()

export type GuestInput = z.infer<typeof guestSchema>
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>
