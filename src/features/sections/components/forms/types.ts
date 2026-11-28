import type { SectionPhoto } from '#/lib/sections'
import type {
  BlockContent,
  BlockType,
} from '#/server/validation/sections.schema'

// What every section form receives. `id` is the section's own id, used to
// keep each field's id unique on the page.
export type FormProps<T extends BlockType> = {
  id: string
  content: BlockContent[T]
  onChange: (content: BlockContent[T]) => void
  eventId: string
  photos: SectionPhoto[]
  // True when this kind of event has roles (a wedding entourage).
  hasRoles: boolean
}
