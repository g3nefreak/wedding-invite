'use client'

import { useEffect, useState } from 'react'
import {
  BUTTON_PRIMARY,
  BUTTON_QUIET,
  CARD,
  ERROR_TEXT,
} from '#/components/host-styles'
import { useThemesQuery } from '#/features/events/events.query'
import type { EventView, ThemeOption } from '#/features/events/events.types'
import { InvitePreview, previewInvite } from '#/features/invite'
import { ApiError } from '#/lib/api'
import { resolveDesign } from '#/lib/resolve-design'
import { sectionsForEvent } from '#/lib/sections'
import {
  sectionsInputSchema,
  withoutAsset,
} from '#/server/validation/sections.schema'
import type { Block, Cover } from '#/server/validation/sections.schema'
import { BLOCK_LABELS } from '../sections.config'
import {
  addCustomBlock,
  canAddCustom,
  isPhotoUsed,
  moveBlock,
  previewBlocks,
  removeBlock,
} from '../sections.helpers'
import { useSaveSectionsMutation } from '../sections.query'
import { CoverFields } from './CoverFields'
import { PhotoShelf } from './PhotoShelf'
import { SectionRow } from './SectionRow'

const HEADING = 'font-host-display text-3xl leading-tight font-medium'

type Props = {
  event: EventView
  // Tells the page when there are changes that have not been saved, so it
  // can ask before the host leaves the tab.
  onDirtyChange?: (dirty: boolean) => void
}

// The Invitation tab of an event's page: the host builds the invitation from
// sections and sees it change beside the form.
export function InvitationPanel({ event, onDirtyChange }: Props) {
  const themes = useThemesQuery(event.type)

  if (themes.isPending) return <p>Loading the invitation…</p>

  const theme = themes.data?.find((option) => option.key === event.themeKey)
  if (themes.isError || !theme) {
    return (
      <div role="alert" className={`${CARD} flex flex-col items-start gap-4`}>
        <p className="text-lg leading-normal">
          Unable to load the invitation. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => themes.refetch()}
          className={BUTTON_QUIET}
        >
          Try again
        </button>
      </div>
    )
  }

  return <Editor event={event} theme={theme} onDirtyChange={onDirtyChange} />
}

// Turns a refused save into words that point at the section to fix.
function problemIn(blocks: Block[], cover: Cover): string | null {
  const result = sectionsInputSchema.safeParse({ sections: blocks, cover })
  if (result.success) return null
  const [issue] = result.error.issues
  const [where, index] = issue.path
  const block = where === 'sections' ? blocks[Number(index)] : undefined
  const place = block
    ? `the “${BLOCK_LABELS[block.type].name}” section`
    : 'the envelope cover'
  return `Check ${place}: something there is too long or not filled in the right way.`
}

function Editor({
  event,
  theme,
  onDirtyChange,
}: Props & { theme: ThemeOption }) {
  const save = useSaveSectionsMutation(event.id)

  // One working copy. Nothing is sent until the host presses Save.
  const [blocks, setBlocks] = useState<Block[]>(() =>
    sectionsForEvent(event.type, event.sections, event.details),
  )
  const [cover, setCover] = useState<Cover>(event.cover)
  const [dirty, setDirty] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])

  // The browser's own "leave this page?" question, for a reload or a closed
  // tab while there are changes that have not been saved.
  useEffect(() => {
    if (!dirty) return
    const warn = (leaving: BeforeUnloadEvent) => leaving.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function edit(next: Block[]) {
    setBlocks(next)
    setDirty(true)
    setJustSaved(false)
  }

  function editCover(next: Cover) {
    setCover(next)
    setDirty(true)
    setJustSaved(false)
  }

  function submit() {
    setProblem(null)
    const found = problemIn(blocks, cover)
    if (found) {
      setProblem(found)
      return
    }
    // Parsed first, so what is sent is already trimmed and tidied.
    const input = sectionsInputSchema.parse({ sections: blocks, cover })
    save.mutate(input, {
      onSuccess: (saved) => {
        setBlocks(saved.sections)
        setCover(saved.cover)
        setDirty(false)
        setJustSaved(true)
      },
      onError: (error) =>
        setProblem(
          error instanceof ApiError
            ? error.message
            : 'Unable to save the invitation. Check your connection and try again.',
        ),
    })
  }

  const design = resolveDesign(theme, event.design)
  const invite = previewInvite(
    { ...event, cover },
    design,
    event.sectionPhotos,
    previewBlocks(blocks),
  )

  return (
    // `data-wide` lets this tab use the whole window (see app/host/layout.tsx):
    // the form keeps a comfortable reading width and the preview takes the rest.
    <div
      data-wide
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] xl:gap-12"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className={HEADING}>Invitation</h2>
          <p className="leading-normal text-host-ink-soft">
            Switch sections on or off, put them in order and fill them in. The
            preview shows your changes straight away; guests see them once you
            save.
          </p>
          <a
            href="#invitation-preview"
            className="self-start text-host-ink-soft underline underline-offset-4 hover:text-host-ink lg:hidden"
          >
            Go to the preview
          </a>
        </div>

        <CoverFields cover={cover} onChange={editCover} />

        <ul className="flex flex-col gap-4">
          {blocks.map((block, index) => (
            <SectionRow
              key={block.id}
              block={block}
              eventId={event.id}
              photos={event.sectionPhotos}
              hasRoles={event.hasRoles}
              // Nothing moves above the opening, which is always first.
              canMoveUp={index > 1}
              canMoveDown={index < blocks.length - 1}
              onChange={(next) =>
                edit(blocks.map((old) => (old.id === next.id ? next : old)))
              }
              onMove={(direction) =>
                edit(moveBlock(blocks, block.id, direction))
              }
              onRemove={() => edit(removeBlock(blocks, block.id))}
            />
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={BUTTON_QUIET}
            disabled={!canAddCustom(blocks)}
            onClick={() => edit(addCustomBlock(blocks))}
          >
            Add custom section
          </button>
          {!canAddCustom(blocks) && (
            <p className="text-sm text-host-ink-soft">
              An invitation can have up to 5 custom sections.
            </p>
          )}
        </div>

        <PhotoShelf
          eventId={event.id}
          photos={event.sectionPhotos}
          isUsed={(id) => isPhotoUsed(blocks, id)}
          // The server already took the photo out of the saved sections; the
          // working copy has to let go of it too.
          onDeleted={(id) => setBlocks((current) => withoutAsset(current, id))}
        />

        <div className="sticky bottom-0 -mx-2 flex flex-wrap items-center gap-4 rounded-2xl bg-host-ground/95 px-2 py-3 backdrop-blur">
          <button
            type="button"
            className={BUTTON_PRIMARY}
            disabled={save.isPending}
            onClick={submit}
          >
            {save.isPending ? 'Saving…' : 'Save invitation'}
          </button>
          <p role="status" className="text-host-ink-soft">
            {dirty ? 'Unsaved changes' : justSaved ? 'Saved' : ''}
          </p>
          <p role="alert" className={`${ERROR_TEXT} basis-full`}>
            {problem}
          </p>
        </div>
      </div>

      <div
        id="invitation-preview"
        className="min-w-0 scroll-mt-6 lg:sticky lg:top-4"
      >
        <InvitePreview invite={invite} tall />
      </div>
    </div>
  )
}
