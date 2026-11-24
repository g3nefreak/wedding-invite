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

it('shows an existing reply and the update label', () => {
  render(
    <RsvpForm
      token={T1}
      initialReply={{ answer: 'not_going', message: 'Sorry' }}
      replyOpen
    />,
    { wrapper },
  )
  expect(button(/i can't/i).getAttribute('aria-pressed')).toBe('true')
  expect(button(/update my reply/i)).toBeTruthy()
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
  const box = screen.getByRole('textbox') as HTMLTextAreaElement
  expect(box.value).toBe('<script>alert(1)</script>')
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
  expect(button(/update my reply/i)).toBeTruthy()
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
