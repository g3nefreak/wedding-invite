// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { EventView } from '#/features/events'
import { InvitationPanel, SECTIONS_SERVICE } from '#/features/sections'
import { ApiError } from '#/lib/api'
import { getTheme } from '#/server/config/themes'
import { hero, message, rsvp } from '../server/section-samples'

vi.mock('#/features/events/events.query', async (original) => ({
  ...(await original<typeof import('#/features/events/events.query')>()),
  useThemesQuery: () => ({
    isPending: false,
    isError: false,
    data: [getTheme('black-and-white')],
    refetch: () => {},
  }),
}))

const event: EventView = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
  type: 'wedding',
  typeName: 'Wedding',
  hasRoles: true,
  timezone: 'Asia/Manila',
  title: 'Mika & Paolo',
  eventDate: '2027-06-12',
  replyBy: '2027-03-31',
  status: 'draft',
  themeKey: 'black-and-white',
  details: {},
  design: {},
  backgroundUrl: null,
  sectionPhotos: [],
  sections: [hero, message('From us', 'Hello there'), rsvp],
  cover: { enabled: true, monogram: 'M&P', line: 'You have a letter' },
}

const user = userEvent.setup()
let onDirtyChange: ReturnType<typeof vi.fn<(dirty: boolean) => void>>

function show() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
  return render(
    <InvitationPanel event={event} onDirtyChange={onDirtyChange} />,
    {
      wrapper,
    },
  )
}

const preview = () => screen.getByRole('region', { name: /preview/i })
const save = () => screen.getByRole('button', { name: 'Save invitation' })

beforeEach(() => {
  onDirtyChange = vi.fn()
  vi.spyOn(SECTIONS_SERVICE, 'SAVE').mockImplementation(async (_id, input) => ({
    ...event,
    sections: input.sections,
    cover: input.cover,
  }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('lists every section and shows the saved invitation in the preview', () => {
  show()
  expect(screen.getByRole('heading', { name: 'Opening' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Message' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Reply' })).toBeTruthy()
  expect(within(preview()).getByText('Hello there')).toBeTruthy()
})

it('shows "Unsaved changes" after an edit and "Saved" after saving', async () => {
  show()
  await user.click(screen.getByRole('button', { name: 'Edit Message' }))
  await user.type(screen.getByLabelText('Heading'), '!')
  expect(screen.getByText('Unsaved changes')).toBeTruthy()
  expect(onDirtyChange).toHaveBeenLastCalledWith(true)

  await user.click(save())
  await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy())
  expect(onDirtyChange).toHaveBeenLastCalledWith(false)
})

it('the preview follows what is typed, before saving', async () => {
  show()
  await user.click(screen.getByRole('button', { name: 'Edit Message' }))
  await user.type(screen.getByLabelText('Message'), ' See you soon')
  expect(within(preview()).getByText('Hello there See you soon')).toBeTruthy()
  expect(SECTIONS_SERVICE.SAVE).not.toHaveBeenCalled()
})

it('sends the whole list in its new order on save', async () => {
  show()
  await user.click(screen.getByRole('button', { name: 'Move Message down' }))
  await user.click(save())
  await waitFor(() => expect(SECTIONS_SERVICE.SAVE).toHaveBeenCalled())
  const [id, input] = vi.mocked(SECTIONS_SERVICE.SAVE).mock.calls[0]
  expect(id).toBe(event.id)
  expect(input.sections.map((block) => block.type)).toEqual([
    'hero',
    'rsvp',
    'message',
  ])
  expect(input.cover).toEqual(event.cover)
})

it('the opening has no switch and no move buttons, and the reply has no switch', () => {
  show()
  expect(screen.queryByRole('switch', { name: 'Show Opening' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Move Opening up' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Move Opening down' })).toBeNull()
  expect(screen.queryByRole('switch', { name: 'Show Reply' })).toBeNull()
  expect(screen.getByRole('switch', { name: 'Show Message' })).toBeTruthy()
})

it('nothing can be moved above the opening', () => {
  show()
  const up = screen.getByRole('button', { name: 'Move Message up' })
  expect((up as HTMLButtonElement).disabled).toBe(true)
})

it('switching a section off removes it from the preview', async () => {
  show()
  await user.click(screen.getByRole('switch', { name: 'Show Message' }))
  expect(within(preview()).queryByText('Hello there')).toBeNull()
})

it('adds and removes a custom section', async () => {
  show()
  await user.click(screen.getByRole('button', { name: 'Add custom section' }))
  expect(screen.getByRole('heading', { name: 'Custom section' })).toBeTruthy()
  await user.click(
    screen.getByRole('button', { name: 'Remove Custom section' }),
  )
  expect(screen.queryByRole('heading', { name: 'Custom section' })).toBeNull()
})

it('shows the server message when a save is refused', async () => {
  vi.mocked(SECTIONS_SERVICE.SAVE).mockRejectedValue(
    new ApiError('VALIDATION', 'The reply section must stay switched on'),
  )
  show()
  await user.click(save())
  await waitFor(() =>
    expect(
      screen
        .getAllByRole('alert')
        .some((alert) =>
          alert.textContent?.includes(
            'The reply section must stay switched on',
          ),
        ),
    ).toBe(true),
  )
  expect(screen.queryByText('Saved')).toBeNull()
})

it('stops a save that cannot pass and says which section to fix', async () => {
  show()
  // The cover line is the one field a test can push past its limit quickly.
  const line = screen.getByLabelText('Line above the envelope')
  line.removeAttribute('maxlength')
  await user.type(line, 'x'.repeat(130))
  await user.click(save())
  expect(SECTIONS_SERVICE.SAVE).not.toHaveBeenCalled()
  expect(document.body.textContent).toContain('Check the envelope cover')
})

it('lists uploaded photos with whether they are used', () => {
  cleanup()
  const withPhotos: EventView = {
    ...event,
    sectionPhotos: [
      {
        id: 'p1',
        url: 'https://photos.example/p1.webp',
        width: 800,
        height: 600,
      },
      {
        id: 'p2',
        url: 'https://photos.example/p2.webp',
        width: 800,
        height: 600,
      },
    ],
    sections: [{ ...hero, content: { kicker: '', photoAssetId: 'p1' } }, rsvp],
  }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InvitationPanel event={withPhotos} />
    </QueryClientProvider>,
  )
  expect(screen.getByText('2 of 30')).toBeTruthy()
  expect(screen.getByText('Used')).toBeTruthy()
  expect(screen.getByText('Not used')).toBeTruthy()
})
