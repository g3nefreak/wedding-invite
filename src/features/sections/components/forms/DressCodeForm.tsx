import { LABEL } from '#/components/host-styles'
import { LIMITS } from '#/server/validation/sections.schema'
import { AreaField, ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

export function DressCodeForm({
  id,
  content,
  onChange,
}: FormProps<'dressCode'>) {
  return (
    <>
      <AreaField
        id={`${id}-text`}
        label="What to wear"
        value={content.text}
        maxLength={1200}
        onChange={(text) => onChange({ ...content, text })}
      />
      <ListEditor
        legend="Colors"
        items={content.swatches}
        max={LIMITS.swatches}
        newItem={() => ({ name: '', color: '#b8a48c' })}
        addLabel="Add a color"
        itemName={(index) =>
          content.swatches[index]?.name || `color ${index + 1}`
        }
        onChange={(swatches) => onChange({ ...content, swatches })}
      >
        {(swatch, change, index) => (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-swatch-${index}-color`} className={LABEL}>
                Color
              </label>
              <input
                id={`${id}-swatch-${index}-color`}
                type="color"
                value={swatch.color}
                onChange={(event) =>
                  change({ ...swatch, color: event.target.value })
                }
                className="h-12 w-16 cursor-pointer rounded-xl border border-host-line bg-host-panel p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-host-accent"
              />
            </div>
            <div className="min-w-48 flex-1">
              <TextField
                id={`${id}-swatch-${index}-name`}
                label="Color name"
                hint="A color with no name is left out."
                value={swatch.name}
                maxLength={80}
                placeholder="Sage green"
                onChange={(name) => change({ ...swatch, name })}
              />
            </div>
          </div>
        )}
      </ListEditor>
    </>
  )
}
