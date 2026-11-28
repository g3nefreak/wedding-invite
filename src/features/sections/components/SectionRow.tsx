'use client'

import { useState } from 'react'
import { BUTTON_SMALL } from '#/components/host-styles'
import type { SectionPhoto } from '#/lib/sections'
import type { Block } from '#/server/validation/sections.schema'
import { BLOCK_LABELS } from '../sections.config'
import { ClosingForm } from './forms/ClosingForm'
import { CountdownForm } from './forms/CountdownForm'
import { CustomForm } from './forms/CustomForm'
import { DressCodeForm } from './forms/DressCodeForm'
import { GiftsForm } from './forms/GiftsForm'
import { HeroForm } from './forms/HeroForm'
import { MessageForm } from './forms/MessageForm'
import { PeopleForm } from './forms/PeopleForm'
import { RemindersForm } from './forms/RemindersForm'
import { RsvpForm } from './forms/RsvpForm'
import { StoryForm } from './forms/StoryForm'
import { WhenWhereForm } from './forms/WhenWhereForm'

type Props = {
  block: Block
  onChange: (block: Block) => void
  onMove: (direction: 'up' | 'down') => void
  onRemove: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  eventId: string
  photos: SectionPhoto[]
  hasRoles: boolean
}

// What the row is called: a custom section goes by its own heading.
function rowName(block: Block): string {
  if (block.type === 'custom' && block.content.heading.trim() !== '') {
    return block.content.heading
  }
  return BLOCK_LABELS[block.type].name
}

// One section in the editor: its name, whether it shows, where it sits in
// the order, and its form.
export function SectionRow(props: Props) {
  const { block, onChange, onMove, onRemove, canMoveUp, canMoveDown } = props
  const [open, setOpen] = useState(false)
  const name = rowName(block)
  const formId = `section-form-${block.id}`

  // The opening always shows and always comes first; the reply always shows.
  const fixedOn = block.type === 'hero' || block.type === 'rsvp'
  const movable = block.type !== 'hero'

  return (
    <li className="flex flex-col gap-4 rounded-3xl border border-host-line bg-host-panel p-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-host-display text-2xl leading-tight font-medium break-words">
          {name}
        </h3>
        <p className="leading-normal text-host-ink-soft">
          {BLOCK_LABELS[block.type].hint}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {fixedOn ? (
          <p className="me-2 text-host-ink-soft">Always shown</p>
        ) : (
          <label className="me-2 flex min-h-11 cursor-pointer items-center gap-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-host-accent">
            <input
              type="checkbox"
              role="switch"
              checked={block.enabled}
              onChange={(event) =>
                onChange({ ...block, enabled: event.target.checked })
              }
              className="size-5 accent-host-accent"
              aria-label={`Show ${name}`}
            />
            <span aria-hidden="true">{block.enabled ? 'Shown' : 'Hidden'}</span>
          </label>
        )}

        {movable && (
          <>
            <button
              type="button"
              className={BUTTON_SMALL}
              disabled={!canMoveUp}
              onClick={() => onMove('up')}
              aria-label={`Move ${name} up`}
            >
              Move up
            </button>
            <button
              type="button"
              className={BUTTON_SMALL}
              disabled={!canMoveDown}
              onClick={() => onMove('down')}
              aria-label={`Move ${name} down`}
            >
              Move down
            </button>
          </>
        )}

        <button
          type="button"
          className={BUTTON_SMALL}
          aria-expanded={open}
          aria-controls={formId}
          onClick={() => setOpen((was) => !was)}
          aria-label={`${open ? 'Close' : 'Edit'} ${name}`}
        >
          {open ? 'Close' : 'Edit'}
        </button>

        {block.type === 'custom' && (
          <button
            type="button"
            className={BUTTON_SMALL}
            onClick={onRemove}
            aria-label={`Remove ${name}`}
          >
            Remove
          </button>
        )}
      </div>

      {open && (
        <div
          id={formId}
          className="flex flex-col gap-5 border-t border-host-line pt-5"
        >
          <BlockForm {...props} />
        </div>
      )}
    </li>
  )
}

// Picks the form that matches the section's type.
function BlockForm({ block, onChange, eventId, photos, hasRoles }: Props) {
  const shared = { id: block.id, eventId, photos, hasRoles }

  switch (block.type) {
    case 'hero':
      return (
        <HeroForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'story':
      return (
        <StoryForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'message':
      return (
        <MessageForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'people':
      return (
        <PeopleForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'gifts':
      return (
        <GiftsForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'dressCode':
      return (
        <DressCodeForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'reminders':
      return (
        <RemindersForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'whenWhere':
      return (
        <WhenWhereForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'rsvp':
      return (
        <RsvpForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'closing':
      return (
        <ClosingForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'custom':
      return (
        <CustomForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
    case 'countdown':
      return (
        <CountdownForm
          {...shared}
          content={block.content}
          onChange={(content) => onChange({ ...block, content })}
        />
      )
  }
}
