// Event types are data, not tables. Add a type here and list which
// sections its invitation shows.
export type EventTypeKey = 'wedding'

type EventType = { name: string; hasRoles: boolean; sections: string[] }

export const EVENT_TYPES: Record<EventTypeKey, EventType> = {
  wedding: {
    name: 'Wedding',
    hasRoles: true,
    sections: ['couple', 'ceremony', 'reception', 'attire'],
  },
}
