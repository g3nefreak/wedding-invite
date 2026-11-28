import { designVariables, formatDay } from '../invite.helpers'
import type { InviteView } from '../invite.types'
import { Cover } from './Cover'
import { SectionList } from './SectionList'
import { ThemeArt } from './ThemeArt'

// One guest's invitation. All names, notes and messages are rendered as plain
// text; nothing here is ever inserted as HTML.
export function InviteScreen({
  invite,
  token,
  preview = false,
  coverState,
}: {
  invite: InviteView
  token: string
  // True inside the host's design preview: drawn in a box, not as the page.
  preview?: boolean
  // Lets a preview hold the envelope cover open or closed.
  coverState?: 'closed' | 'open'
}) {
  const { design } = invite

  // The preview sits inside the dashboard's own <main>, so it is a <div>.
  const Root = preview ? 'div' : 'main'

  return (
    <Root
      style={{
        ...designVariables(design),
        // Corners inside the panel follow its curve: outer radius minus padding.
        ['--inner-radius' as string]: `${Math.max(design.panelRadius - 20, 4)}px`,
      }}
      className={`relative isolate flex flex-1 flex-col overflow-clip bg-ground text-ink [font-family:var(--font-body)] ${preview ? 'min-h-(--preview-height)' : 'min-h-dvh'}`}
    >
      {invite.backgroundUrl ? (
        <BackgroundPhoto
          url={invite.backgroundUrl}
          design={design}
          preview={preview}
        />
      ) : (
        <ThemeArt art={design.art} />
      )}

      {/* Sections fade in with JavaScript; without it they are just shown. */}
      <noscript>
        <style>{`.reveal{opacity:1;transform:none}`}</style>
      </noscript>

      <Cover
        cover={invite.cover}
        title={invite.event.title}
        date={formatDay(invite.event.eventDate)}
        design={design}
        preview={preview}
        forced={coverState}
      >
        <SectionList invite={invite} token={token} preview={preview} />
      </Cover>
    </Root>
  )
}

// The host's own photo behind the invitation, with the theme's treatment and
// a layer of the theme's background color on top so the text stays readable.
//
// The photo fills one screen and stays put while the invitation scrolls over
// it. Stretching it over the whole (much taller) page instead would zoom in
// and cut most of the picture away.
function BackgroundPhoto({
  url,
  design,
  preview,
}: {
  url: string
  design: InviteView['design']
  preview: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
    >
      {/* In the design preview "one screen" is the preview box, not the window. */}
      <div
        className={`sticky top-0 ${preview ? 'h-(--preview-height)' : 'h-lvh'}`}
      >
        {/* A plain <img>: the photo is already resized on our server, and it
            is decoration, so it has an empty alt. Faces are usually in the
            upper part of a photo, so that part is kept when it must be cut. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className={`h-full w-full object-cover object-[center_30%] ${design.photo.filter === 'grayscale' ? 'grayscale' : ''}`}
        />
        <div
          className="absolute inset-0 bg-ground"
          style={{ opacity: design.photo.overlay }}
        />
      </div>
    </div>
  )
}
