import { LIMITS } from '#/server/validation/sections.schema'
import { ListEditor, TextField } from '../fields'
import type { FormProps } from './types'

export function RemindersForm({
  id,
  content,
  onChange,
}: FormProps<'reminders'>) {
  return (
    <>
      <TextField
        id={`${id}-heading`}
        label="Heading"
        value={content.heading}
        maxLength={80}
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <ListEditor
        legend="Reminders"
        items={content.items}
        max={LIMITS.reminders}
        newItem={() => ''}
        addLabel="Add a reminder"
        itemName={(index) => `reminder ${index + 1}`}
        onChange={(items) => onChange({ ...content, items })}
      >
        {(item, change, index) => (
          <TextField
            id={`${id}-item-${index}`}
            label={`Reminder ${index + 1}`}
            value={item}
            maxLength={120}
            placeholder="Please arrive 30 minutes early"
            onChange={change}
          />
        )}
      </ListEditor>
    </>
  )
}
