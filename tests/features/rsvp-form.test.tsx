// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { RsvpForm } from '#/features/invite'

const T1 = 'A'.repeat(43)
const user = userEvent.setup()

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

function button(name: RegExp) {
  return screen.getByRole('button', { name }) as HTMLButtonElement
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('send is disabled until an answer is chosen', async () => {
  render(<RsvpForm token={T1} initialReply={null} replyOpen />, { wrapper })
  expect(button(/send my reply/i).disabled).toBe(true)
  await user.click(button(/i'll be there/i))
  expect(button(/send my reply/i).disabled).toBe(false)
})

it('shows an existing reply instead of the form', () => {
  render(
    <RsvpForm
      token={T1}
      initialReply={{ answer: 'not_going', message: 'Sorry' }}
      replyOpen
    />,
    { wrapper },
  )
  expect(screen.getByText(/i can't make it/i)).toBeTruthy()
  expect(screen.getByText(/sorry/i)).toBeTruthy()
  expect(button(/change my reply/i)).toBeTruthy()
  // No active message box or send button until they choose to change it.
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(screen.queryByRole('button', { name: /send|update/i })).toBeNull()
})

it('changes an existing reply in a dialog', async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({
      ok: true,
      data: { answer: 'going', message: 'Made it work' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  render(
    <RsvpForm
      token={T1}
      initialReply={{ answer: 'not_going', message: 'Sorry' }}
      replyOpen
    />,
    { wrapper },
  )

  await user.click(button(/change my reply/i))
  // The dialog's form starts from the saved reply.
  expect(button(/i can't/i).getAttribute('aria-pressed')).toBe('true')
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(
    'Sorry',
  )

  await user.click(button(/i'll be there/i))
  await user.click(button(/update my reply/i))

  expect(await screen.findByText(/reply saved/i)).toBeTruthy()
  expect(screen.getByText(/made it work/i)).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
})

it('cancel closes the dialog and keeps the saved reply', async () => {
  render(
    <RsvpForm
      token={T1}
      initialReply={{ answer: 'going', message: 'See you' }}
      replyOpen
    />,
    { wrapper },
  )
  await user.click(button(/change my reply/i))
  await user.click(button(/i can't/i))
  await user.click(button(/cancel/i))
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(screen.getByText(/i'll be there/i)).toBeTruthy()
})

it('shows closed state', () => {
  render(<RsvpForm token={T1} initialReply={null} replyOpen={false} />, {
    wrapper,
  })
  expect(screen.getByText(/replies are closed/i)).toBeTruthy()
  expect(screen.queryByRole('button', { name: /send/i })).toBeNull()
})

it('renders a message with HTML as text', () => {
  render(
    <RsvpForm
      token={T1}
      initialReply={{ answer: 'going', message: '<script>alert(1)</script>' }}
      replyOpen
    />,
    { wrapper },
  )
  expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeTruthy()
  expect(document.querySelector('script')).toBeNull()
})

it('sends the reply and confirms it', async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({ ok: true, data: { answer: 'going', message: 'Yay' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  render(<RsvpForm token={T1} initialReply={null} replyOpen />, { wrapper })

  await user.click(button(/i'll be there/i))
  await user.type(screen.getByRole('textbox'), 'Yay')
  await user.click(button(/send my reply/i))

  expect(await screen.findByText(/reply saved/i)).toBeTruthy()
  // The form is replaced by their reply.
  expect(screen.getByText(/yay/i)).toBeTruthy()
  expect(button(/change my reply/i)).toBeTruthy()
  expect(screen.queryByRole('textbox')).toBeNull()
  const [url, init] = fetchMock.mock.calls[0] as unknown as [
    string,
    RequestInit,
  ]
  expect(url).toBe(`/api/invites/${T1}/rsvp`)
  expect(JSON.parse(init.body as string)).toEqual({
    answer: 'going',
    message: 'Yay',
  })
})

it('shows the server message when the reply is refused', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        {
          ok: false,
          error: {
            code: 'REPLY_CLOSED',
            message: 'Replies are closed for this event',
          },
        },
        { status: 409 },
      ),
    ),
  )
  render(<RsvpForm token={T1} initialReply={null} replyOpen />, { wrapper })
  await user.click(button(/i can't/i))
  await user.click(button(/send my reply/i))
  expect(
    await screen.findByText(/replies are closed for this event/i),
  ).toBeTruthy()
})
