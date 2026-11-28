// @vitest-environment happy-dom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { Cover } from '#/features/invite'
import { resolveDesign } from '#/lib/resolve-design'
import { getTheme } from '#/server/config/themes'

const design = resolveDesign(getTheme('black-and-white'), {})
const cover = { enabled: true, monogram: 'M&P', line: 'You have a letter' }

const show = (props: Partial<Parameters<typeof Cover>[0]> = {}) =>
  render(
    <Cover
      cover={cover}
      title="Mika & Paolo"
      date="June 12, 2027"
      design={design}
      {...props}
    >
      <h1 tabIndex={-1}>Inside</h1>
    </Cover>,
  )

const openButton = () => screen.queryByRole('button', { name: /tap to open/i })

function reduceMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener() {},
    removeEventListener() {},
  }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('shows the line, title, date, monogram and a button', () => {
  show()
  expect(screen.getByText('You have a letter')).toBeTruthy()
  expect(screen.getByText('Mika & Paolo')).toBeTruthy()
  expect(screen.getByText('June 12, 2027')).toBeTruthy()
  expect(screen.getByText('M&P')).toBeTruthy()
  expect(openButton()).toBeTruthy()
})

it('keeps the invitation inert until opened, then removes the cover', async () => {
  reduceMotion(false)
  show()
  expect(screen.getByText('Inside').closest('[inert]')).not.toBeNull()

  await userEvent.click(openButton()!)
  await waitFor(() => expect(openButton()).toBeNull(), { timeout: 3000 })
  expect(screen.getByText('Inside').closest('[inert]')).toBeNull()
  // Keyboard and screen reader users land on the invitation's title.
  expect(document.activeElement).toBe(screen.getByText('Inside'))
})

it('renders only the invitation when the cover is switched off', () => {
  show({ cover: { ...cover, enabled: false } })
  expect(openButton()).toBeNull()
  expect(screen.getByText('Inside').closest('[inert]')).toBeNull()
})

it('opens at once when reduced motion is asked for', async () => {
  reduceMotion(true)
  show()
  await userEvent.click(openButton()!)
  // No waiting: the cover is gone in the same turn.
  expect(openButton()).toBeNull()
})

it('a preview can hold the cover open or closed', () => {
  show({ forced: 'open' })
  expect(openButton()).toBeNull()
  cleanup()
  show({ forced: 'closed' })
  expect(openButton()).toBeTruthy()
})

it('draws an envelope for every flap shape', () => {
  for (const shape of ['straight', 'pointed', 'curved', 'stepped'] as const) {
    show({ design: { ...design, envelope: shape } })
    expect(document.querySelector('svg path[data-flap]')).not.toBeNull()
    cleanup()
  }
})
