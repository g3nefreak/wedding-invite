// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { SectionList } from '#/features/invite'
import type { InviteView } from '#/features/invite'
import { resolveDesign } from '#/lib/resolve-design'
import type { SectionView } from '#/lib/sections'
import { getTheme } from '#/server/config/themes'

const hero: SectionView = {
  type: 'hero',
  content: { kicker: 'Together with their families', photo: null },
}
const rsvp: SectionView = { type: 'rsvp', content: { intro: '' } }
const message = (heading: string, text: string): SectionView => ({
  type: 'message',
  content: { heading, text },
})
const place = (mapUrl: string): SectionView => ({
  type: 'whenWhere',
  content: {
    places: [
      {
        label: 'Ceremony',
        venue: 'San Agustin',
        time: '2:00 PM',
        address: 'Intramuros',
        mapUrl,
      },
    ],
  },
})

function inviteWith(
  sections: SectionView[],
  startsAt = '2099-01-01T00:00:00.000Z',
  dayEndsAt = '2099-01-01T16:00:00.000Z',
): InviteView {
  return {
    guestName: 'Guest name',
    role: null,
    note: null,
    event: {
      type: 'wedding',
      typeName: 'Wedding',
      title: 'Mika & Paolo',
      eventDate: '2027-06-12',
      replyBy: '2027-03-31',
      details: {},
    },
    design: resolveDesign(getTheme('black-and-white'), {}),
    backgroundUrl: null,
    cover: { enabled: false, monogram: 'M&P', line: 'You have a letter' },
    sections,
    startsAt,
    dayEndsAt,
    reply: null,
    replyOpen: true,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

const show = (sections: SectionView[], startsAt?: string) =>
  render(
    <SectionList invite={inviteWith(sections, startsAt)} token="t" preview />,
    {
      wrapper,
    },
  )

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('draws enabled sections in the saved order', () => {
  show([hero, message('From us', 'Hello'), rsvp])
  const headings = screen.getAllByRole('heading').map((h) => h.textContent)
  expect(headings[0]).toBe('Mika & Paolo')
  expect(headings.indexOf('From us')).toBeGreaterThan(0)
  expect(headings.indexOf('From us')).toBeLessThan(
    headings.indexOf('Guest name'),
  )
})

it('follows the order when the reply comes first', () => {
  show([hero, rsvp, message('From us', 'Hello')])
  const headings = screen.getAllByRole('heading').map((h) => h.textContent)
  expect(headings.indexOf('Guest name')).toBeLessThan(
    headings.indexOf('From us'),
  )
})

it('skips a section with nothing in it', () => {
  show([hero, message('', ''), place(''), rsvp])
  expect(screen.queryByTestId('section-message')).toBeNull()
  expect(screen.getByTestId('section-whenWhere')).toBeTruthy()
})

it('skips a list section whose lists are all empty', () => {
  show([
    hero,
    { type: 'reminders', content: { heading: 'Reminders', items: [] } },
    {
      type: 'people',
      content: { heading: 'The entourage', intro: '', groups: [] },
    },
    rsvp,
  ])
  expect(screen.queryByTestId('section-reminders')).toBeNull()
  expect(screen.queryByTestId('section-people')).toBeNull()
})

it('shows host text as text, not markup', () => {
  show([hero, message('Hi', '<img src=x onerror=alert(1)>'), rsvp])
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy()
  expect(document.querySelector('img[src="x"]')).toBeNull()
})

it('a map link opens in a new tab and only when set', () => {
  show([hero, place('https://maps.app.goo.gl/abc'), rsvp])
  const link = screen.getByRole('link', { name: /open map/i })
  expect(link.getAttribute('href')).toBe('https://maps.app.goo.gl/abc')
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  cleanup()

  show([hero, place(''), rsvp])
  expect(screen.queryByRole('link')).toBeNull()
})

it('a hero with photo: null draws no image', () => {
  show([hero, rsvp])
  expect(document.querySelector('img')).toBeNull()
})

it('a hero with a photo draws it', () => {
  const withPhoto: SectionView = {
    type: 'hero',
    content: {
      kicker: '',
      photo: { url: 'https://photos.example/p1.webp', width: 800, height: 600 },
    },
  }
  show([withPhoto, rsvp])
  expect(document.querySelector('img')?.getAttribute('src')).toBe(
    'https://photos.example/p1.webp',
  )
})

it('long unbroken text sits in a wrapping container', () => {
  show([hero, message('Hi', 'A'.repeat(300)), rsvp])
  expect(screen.getByText('A'.repeat(300)).className).toContain('break-words')
})

const START = '2027-06-12T06:00:00.000Z'
const DAY_END = '2027-06-12T16:00:00.000Z'
const countdownWith = (
  dayMessage: string,
  afterMessage: string,
): SectionView => ({
  type: 'countdown',
  content: { dayMessage, afterMessage },
})

async function showCountdownAt(now: string, section = countdownWith('', '')) {
  vi.useFakeTimers({ now: new Date(now) })
  render(
    <SectionList
      invite={inviteWith([hero, section, rsvp], START, DAY_END)}
      token="t"
      preview
    />,
    { wrapper },
  )
  await vi.advanceTimersByTimeAsync(0)
  return screen.getByTestId('section-countdown')
}

it('the countdown shows time left before the event', async () => {
  const section = await showCountdownAt('2027-06-10T06:00:00Z')
  expect(section.textContent).toContain('2')
  expect(screen.getByText(/days/i)).toBeTruthy()
})

it('once the event starts the countdown becomes "Today is the day"', async () => {
  const section = await showCountdownAt('2027-06-12T06:00:01Z')
  expect(section.textContent).toContain('Today is the day')
  expect(screen.queryByText(/days/i)).toBeNull()
})

it('after the event day it thanks the guests', async () => {
  const section = await showCountdownAt('2027-06-13T00:00:00Z')
  expect(section.textContent).toContain('Thank you for celebrating with us')
})

it('shows the messages the host wrote instead of the standard ones', async () => {
  const mine = countdownWith('Today we say I do', 'We are married!')
  expect(
    (await showCountdownAt('2027-06-12T08:00:00Z', mine)).textContent,
  ).toContain('Today we say I do')
  cleanup()
  expect(
    (await showCountdownAt('2027-06-20T00:00:00Z', mine)).textContent,
  ).toContain('We are married!')
})

it('switches from the numbers to the message while the page is open', async () => {
  const section = await showCountdownAt('2027-06-12T05:59:58Z')
  expect(section.textContent).toContain('Seconds')
  await vi.advanceTimersByTimeAsync(3000)
  expect(screen.getByTestId('section-countdown').textContent).toContain(
    'Today is the day',
  )
})

it('the reply section shows the guest, their role and the reply form', () => {
  const invite = inviteWith([hero, rsvp])
  invite.role = {
    title: 'Maid of Honor',
    askText: 'Will you stand beside me?',
    note: '',
    attire: 'Floor-length gown',
    color: '',
  }
  render(<SectionList invite={invite} token="t" preview />, { wrapper })
  expect(screen.getByText('Maid of Honor')).toBeTruthy()
  expect(screen.getByText('Will you stand beside me?')).toBeTruthy()
  expect(screen.getByText('Floor-length gown')).toBeTruthy()
  expect(screen.getByRole('button', { name: /send/i })).toBeTruthy()
})

it('in a centered theme, section contents center and the reply panel does not', () => {
  const invite = inviteWith([hero, place(''), rsvp])
  invite.design = { ...invite.design, heroAlign: 'center' }
  const { container } = render(
    <SectionList invite={invite} token="t" preview />,
    {
      wrapper,
    },
  )
  expect(container.firstElementChild?.className).toContain('[--justify:center]')
  // A lone place sits in a row that follows the theme, not in a left column.
  const places = screen.getByTestId('section-whenWhere').querySelector('ul')
  expect(places?.className).toContain('[justify-content:var(--justify)]')
  expect(
    screen.getByTestId('section-whenWhere').hasAttribute('data-shell'),
  ).toBe(true)
  expect(screen.getByTestId('section-rsvp').hasAttribute('data-shell')).toBe(
    false,
  )
})

it('in a left-aligned theme, rows start at the left', () => {
  const invite = inviteWith([hero, place(''), rsvp])
  invite.design = { ...invite.design, heroAlign: 'left' }
  const { container } = render(
    <SectionList invite={invite} token="t" preview />,
    {
      wrapper,
    },
  )
  expect(container.firstElementChild?.className).toContain(
    '[--justify:flex-start]',
  )
})
