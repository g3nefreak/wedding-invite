# Envelope Cover and Section Blocks Implementation Plan

Plan 4. Design approved by Gene on 2026-11-26.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every invitation opens with an envelope cover and then scrolls through sections the host switched on, ordered and filled in themselves, with a live preview while editing.

**Architecture:** `Event` gains two JSON columns, `sections` (an ordered list of typed blocks) and `cover`. One strict Zod schema per block type guards saving; reading is forgiving. Shared helpers in `src/lib/` turn saved blocks into what the page draws, so the guest page and the host's preview give the same result. The guest page becomes cover + a loop over section components. A new `src/features/sections/` module is the host's "Invitation" tab.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma 7 on Supabase Postgres, Supabase Storage, sharp, Zod 4, TanStack Query, react-hook-form, Tailwind 4, Vitest + Testing Library. No new packages.

**Spec:** `wedding-invite-envelope-and-section-blocks-design.md` (Claude Project "GENE PERSONAL", folder `claude/`). Copy it into the repo at `.codex/plans/2026-11-26-envelope-and-section-blocks-design.md` in Task 1. This plan lives beside it at `.codex/plans/2026-11-26-envelope-and-section-blocks.md` (the repo keeps plans in `.codex/plans/`, per `CLAUDE.md`).

## Global Constraints

- **Never commit. Gene commits.** Each task ends with a verification step, not a commit. Work on `main`.
- No new dependency. Reordering uses up and down buttons. Animations use CSS and `IntersectionObserver`.
- Every request follows route → validation → auth check → service → repository. Prisma only in `src/server/repositories/`.
- Tables change only through `prisma/schema.prisma` plus a new migration. Never edit `20261124015340_init`.
- All host text is stored and rendered as plain text. Never `dangerouslySetInnerHTML`. Colors are 6-digit hex only (`/^#[0-9a-fA-F]{6}$/`).
- The only links in an invitation are map links: `https://` and host is `google.com`, `www.google.com` or `maps.google.com` with a path starting `/maps`, or `maps.app.goo.gl`, or `goo.gl` with a path starting `/maps`, or `waze.com` / `www.waze.com`.
- Text limits: headings 80 characters, short lines 120, paragraphs 1,200, time text 40, account number 40, monogram 3.
- Count limits: story photos 12; people groups 8, names per group 40; gift ideas 8; payment options 3; swatches 6; reminders 8; places 4; custom sections 5; section photos per event 30.
- Photos: JPEG, PNG or WebP by content, 8 MB maximum. Section photos resized to at most 1600 px wide, QR photos to at most 1000 px. Background stays 2000 px.
- A guest endpoint returns one guest's data only. A wrong owner gets 404.
- Guests asking for reduced motion get no animation.
- Follow `CLAUDE.md` code conventions: no semicolons, single quotes, `#/` imports, feature barrels, UPPER_SNAKE_CASE service objects. For every screen, follow the `better-*` skills in `.agents/skills/` and run the `better-interface` review before calling it done.
- Not in this plan: music, video, per-section colors or fonts, plus-ones, a drag-and-drop canvas, online payment.

## Review Focus

1. **Time text that is not a clock time** ("after lunch", empty): the countdown counts to the start of the event day; it never shows `NaN` and never throws. Test in Task 3.
2. **A block points at a photo that no longer exists:** the section draws without the photo; no broken image and no error. Test in Task 3.
3. **Blank or whitespace-only entries** (empty names, reminders, gift ideas, a place with no venue): they are dropped on save, and a section whose content is entirely empty is not drawn for guests. Tests in Tasks 2 and 4.
4. **Photos uploaded but never saved into a section:** they still count toward the 30, so the editor must list every uploaded photo and let the host delete it. Test in Task 6.
5. **Long text with no spaces** (a long name or account number) on a narrow phone: it wraps inside its section; the page never scrolls sideways. Test in Task 4.

---

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` + new migration | `Event.sections`, `Event.cover`, `AssetKind.section` |
| `src/server/validation/sections.schema.ts` (new) | Block and cover types, strict save schemas, forgiving readers |
| `src/server/config/event-types.ts` | Allowed blocks and default blocks per event type |
| `src/lib/sections.ts` (new) | `sectionsForEvent`, `resolveSections` (shared by server and preview) |
| `src/lib/event-start.ts` (new) | Turns the event day + time text + timezone into the countdown target |
| `src/server/services/sections.service.ts` (new) | `updateSections` and its rules |
| `src/server/services/photo.service.ts` | `uploadSectionPhoto`, `deleteSectionPhoto` |
| `src/server/storage/image.ts` | `processPhoto` takes a maximum width |
| `src/server/repositories/{event,asset,invite}.repository.ts` | New columns, list and count section photos |
| `src/app/api/events/[eventId]/sections/route.ts` (new) | `PATCH` |
| `src/app/api/events/[eventId]/assets/route.ts`, `assets/[assetId]/route.ts` (new) | Upload with a kind; delete one photo |
| `src/features/invite/components/Cover.tsx`, `Reveal.tsx`, `SectionList.tsx`, `sections/*.tsx` (new) | What a guest sees |
| `src/features/sections/**` (new) | The host's Invitation tab |
| `src/features/design/components/DesignPreview.tsx`, `src/features/events/components/EventEditor.tsx` | Preview shows sections; new tab; fields moved |
| `AGENTS.backend.md` | Rules updated |

---

### Task 1: Rules and design doc in the repo

**Files:**
- Create: `.codex/plans/2026-11-26-envelope-and-section-blocks-design.md` (the spec), `.codex/plans/2026-11-26-envelope-and-section-blocks.md` (this plan)
- Modify: `AGENTS.backend.md`

- [ ] **Step 1:** Copy the spec and this plan into `.codex/plans/`.
- [ ] **Step 2:** In `AGENTS.backend.md` change exactly these parts:
  - Section 1, "Design model" line: the host picks a theme, changes accent, font pair and background photo, **and builds the invitation from a fixed library of section blocks (on/off, order, content)**. Still no drag-and-drop editor.
  - Section 5 table: `Event` gains `sections (JSON)` and `cover (JSON)`; `Asset.kind` is `background` or `section`. Add one paragraph: block types, that each has a strict Zod schema in `validation/sections.schema.ts`, and that unknown types or fields are refused.
  - Section 6: add `PATCH /api/events/[eventId]/sections` and `DELETE /api/events/[eventId]/assets/[assetId]`; `POST .../assets` takes a kind.
  - Section 7 rule 1, replace with: "A guest endpoint returns data about one guest only. Never return the guest list, guest links or other guests' replies to a guest. Names a host types into a `people` block are published content, like the couple's names; the endpoint never reads `Guest` rows to build that block."
  - Section 7 rule 7: add the 1600 px and 1000 px widths and the 30-photo limit.
  - Section 7: add rule 10, the map link rule from Global Constraints.
- [ ] **Step 3: Verify.** `grep -n "sections" AGENTS.backend.md` shows the new lines in sections 1, 5, 6 and 7.

---

### Task 2: Data, validation and saving sections

**Files:**
- Modify: `prisma/schema.prisma`, `src/server/config/event-types.ts`, `src/server/repositories/event.repository.ts`, `src/server/services/event.service.ts`, `tests/server/fakes.ts`
- Create: `prisma/migrations/<timestamp>_sections_and_cover/`, `src/server/validation/sections.schema.ts`, `src/server/services/sections.service.ts`, `src/app/api/events/[eventId]/sections/route.ts`
- Test: `tests/server/sections-schema.test.ts`, `tests/server/sections.service.test.ts`, `tests/api/sections.test.ts`

**Interfaces — Produces:**

```ts
// src/server/validation/sections.schema.ts
export const BLOCK_TYPES = ['hero', 'countdown', 'story', 'message', 'people', 'gifts',
  'dressCode', 'reminders', 'whenWhere', 'rsvp', 'closing', 'custom'] as const
export type BlockType = (typeof BLOCK_TYPES)[number]

export type BlockContent = {
  hero: { kicker: string; photoAssetId?: string }
  countdown: Record<string, never>
  story: { heading: string; intro: string; photos: { assetId: string; caption: string }[] }
  message: { heading: string; text: string }
  people: { heading: string; intro: string; groups: { title: string; names: string[] }[] }
  gifts: { intro: string; ideas: { title: string; note: string }[];
    payments: { label: string; accountName: string; accountNumber: string; qrAssetId?: string }[];
    closing: string }
  dressCode: { text: string; swatches: { name: string; color: string }[] }
  reminders: { heading: string; items: string[] }
  whenWhere: { places: { label: string; venue: string; time: string; address: string; mapUrl: string }[] }
  rsvp: { intro: string }
  closing: { text: string; signature: string }
  custom: { heading: string; text: string; photoAssetId?: string }
}
export type Block = { [T in BlockType]: { id: string; type: T; enabled: boolean; content: BlockContent[T] } }[BlockType]
export type Cover = { enabled: boolean; monogram: string; line: string }

export const sectionsInputSchema: z.ZodType<{ sections: Block[]; cover: Cover }>  // strict, max 30 blocks
export type SectionsInput = z.infer<typeof sectionsInputSchema>
export function isAllowedMapUrl(url: string): boolean
export function readSections(saved: unknown): Block[]       // skips any block that fails to parse
export function readCover(saved: unknown, title: string): Cover
export function monogramFor(title: string): string          // "Mika & Paolo" -> "M&P"; at most 3 characters
export function assetIdsIn(blocks: Block[]): string[]

// src/server/config/event-types.ts
type EventType = { name: string; hasRoles: boolean; blocks: BlockType[]; defaults: Block[] }

// src/server/services/sections.service.ts
export async function updateSections(userId: string, eventId: string, input: SectionsInput,
  deps: { events: EventRepository; assets: AssetRepository }): Promise<EventView>
```

`EventRecord` and `EventChanges` gain `sections: unknown` and `cover: unknown`. `EventView` gains `sections: Block[]`, `cover: Cover` (filled by `readSections` / `readCover`) and `hasRoles: boolean` (from the event type; `false` for an unknown type). `sectionPhotos` comes in Task 6.

Schema decisions the tests pin:
- Every string is trimmed. `mapUrl` is `''` or passes `isAllowedMapUrl`. Empty strings are allowed everywhere (a host saves half-filled forms).
- List entries that are blank after trimming are removed before the count limits apply: names, reminder items, gift ideas with no title, places with no venue and no label, swatches with no name, payments with no label and no account number.
- `id` is 1 to 40 characters of `[A-Za-z0-9_-]`.
- `readCover` defaults: `enabled: true`, `monogram: monogramFor(title)`, `line: 'You have a letter'`.

Service rules (each refused with `AppError('VALIDATION', …)` and a plain message):
- Exactly one `hero`; it is first and enabled. Exactly one `rsvp`; it is enabled.
- At most one each of `countdown`, `story`, `message`, `people`, `gifts`, `dressCode`, `reminders`, `whenWhere`, `closing`. At most 5 `custom`.
- Every block type is in the event type's `blocks`. Block ids are unique.
- Every id from `assetIdsIn` belongs to this event and has kind `section` (use `assets.findById`; `listByEvent` arrives in Task 6).

Wedding `defaults`, in order (ids equal the type name): `hero` (kicker `'Together with their families'`), `countdown`, `story` (off, heading `'Our story'`), `message` (heading `'From us'`), `people` (heading `'The entourage'`), `whenWhere` (places labelled `'Ceremony'` and `'Reception'`, other fields empty), `dressCode`, `gifts` (off), `reminders` (off, heading `'Reminders'`), `rsvp`, `closing`. Wedding `blocks` is all of `BLOCK_TYPES`.

- [ ] **Step 1: Write the failing schema tests** in `tests/server/sections-schema.test.ts`:

```ts
it('refuses an unknown block type', () => {
  expect(sectionsInputSchema.safeParse(input([{ id: 'x', type: 'video', enabled: true, content: {} }])).success).toBe(false)
})
it('refuses an unknown field inside a block', () => {
  expect(sectionsInputSchema.safeParse(input([{ ...hero, content: { kicker: '', html: '<b>' } }])).success).toBe(false)
})
it.each([
  ['https://maps.app.goo.gl/abc', true], ['https://www.google.com/maps/place/x', true],
  ['https://waze.com/ul?ll=1,2', true], ['http://www.google.com/maps', false],
  ['https://google.com.evil.example/maps', false], ['https://www.google.com/search?q=x', false],
  ['javascript:alert(1)', false],
])('map link %s allowed: %s', (url, allowed) => expect(isAllowedMapUrl(url)).toBe(allowed))
it('drops blank names before counting', () => {
  const parsed = sectionsInputSchema.parse(input([hero, people({ names: ['Ana', '  ', ''] }), rsvp]))
  expect(parsed.sections[1].content.groups[0].names).toEqual(['Ana'])
})
it('refuses a 13th story photo, a 7th swatch and a swatch color that is not hex', ...)
it('readSections skips a broken block and keeps the rest', () => {
  expect(readSections([hero, { id: 'bad', type: 'story', enabled: true, content: 7 }, rsvp]).map((b) => b.type)).toEqual(['hero', 'rsvp'])
})
it('readSections returns [] for anything that is not a list', ...)
it('monogramFor', () => { expect(monogramFor('Mika & Paolo')).toBe('M&P'); expect(monogramFor('Zian Elandre')).toBe('ZE'); expect(monogramFor('')).toBe('') })
```

- [ ] **Step 2:** Run `npx vitest run tests/server/sections-schema.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3:** Write `sections.schema.ts` to the Interfaces above (one `z.strictObject` per block type, joined with `z.discriminatedUnion('type', …)`). Add `blocks` and `defaults` to `event-types.ts` and remove the old `sections: string[]`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Add to `prisma/schema.prisma`: `sections Json @default("[]")` and `cover Json @default("{}")` on `Event`, and `section` in `enum AssetKind`. Run `npx prisma migrate dev --name sections_and_cover`. Expected: a new migration folder; the init migration is unchanged.
- [ ] **Step 6:** Extend `EventRecord`, `EventChanges`, `prismaEventRepository.update` (same JSON cast as `design`), `toEventView`, and `fakeEventRepository.create` (`sections: []`, `cover: {}`).
- [ ] **Step 7: Write the failing service tests** in `tests/server/sections.service.test.ts` (same `beforeEach` as `design-update.test.ts`, plus a fake `AssetRepository` — add `fakeAssetRepository()` to `tests/server/fakes.ts`):

```ts
it('saves sections and the cover and reads them back', ...)
it('gives a stranger NOT_FOUND', async () => {
  await expect(updateSections(STRANGER, eventId, valid, deps)).rejects.toMatchObject({ code: 'NOT_FOUND' })
})
it.each([
  ['no hero', [rsvp]], ['hero not first', [rsvp, hero]], ['hero switched off', [{ ...hero, enabled: false }, rsvp]],
  ['no rsvp', [hero]], ['rsvp switched off', [hero, { ...rsvp, enabled: false }]],
  ['two countdowns', [hero, countdown, { ...countdown, id: 'c2' }, rsvp]],
  ['six custom sections', [hero, ...six(custom), rsvp]], ['a repeated id', [hero, { ...rsvp, id: hero.id }]],
])('refuses %s', async (_name, sections) => {
  await expect(updateSections(OWNER, eventId, { sections, cover }, deps)).rejects.toMatchObject({ code: 'VALIDATION' })
})
it('refuses a photo that belongs to another event', ...)
it('refuses a background photo used as a section photo', ...)
it('stores text with angle brackets unchanged, as text', async () => {
  const saved = await updateSections(OWNER, eventId, withMessage('<script>x</script>'), deps)
  expect(saved.sections.find((b) => b.type === 'message')?.content.text).toBe('<script>x</script>')
})
```

- [ ] **Step 8:** Run `npx vitest run tests/server/sections.service.test.ts`. Expected: FAIL.
- [ ] **Step 9:** Write `updateSections` (use `findOwnedEvent`, then the rules, then `events.update(id, { sections, cover })`, return `toEventView`).
- [ ] **Step 10:** Add the route, copying `design/route.ts`: `PATCH` parses `sectionsInputSchema` and calls `updateSections` with `{ events, assets: photo.assets }` (take `photoDeps` the way `assets/route.ts` does). Add `tests/api/sections.test.ts` following `tests/api/events.test.ts`: 200 for the owner, 401 with no user, 400 for an unknown field.
- [ ] **Step 11: Verify.** `npm test && npm run typecheck && npm run lint`. Expected: all pass.

---

### Task 3: Shared helpers and the guest's data

**Files:**
- Create: `src/lib/sections.ts`, `src/lib/event-start.ts`
- Modify: `src/server/services/invite.service.ts`, `src/server/repositories/invite.repository.ts`, `src/server/repositories/asset.repository.ts`, `tests/server/fakes.ts`
- Test: `tests/lib/sections.test.ts`, `tests/lib/event-start.test.ts`, `tests/server/invite.service.test.ts`

**Interfaces — Consumes:** `Block`, `Cover`, `readSections`, `readCover` (Task 2); `EVENT_TYPES[type].defaults`; `readWeddingDetails`.

**Produces:**

```ts
// src/lib/sections.ts
export type Photo = { url: string; width: number; height: number }
export type SectionPhoto = Photo & { id: string }
// A Block with every asset id replaced by the photo itself (or null), enabled blocks only.
export type SectionView =
  | { id: string; type: 'hero'; content: { kicker: string; photo: Photo | null } }
  | { id: string; type: 'story'; content: { heading: string; intro: string; photos: { photo: Photo; caption: string }[] } }
  | { id: string; type: 'gifts'; content: Omit<BlockContent['gifts'], 'payments'> & {
      payments: { label: string; accountName: string; accountNumber: string; qr: Photo | null }[] } }
  | { id: string; type: 'custom'; content: { heading: string; text: string; photo: Photo | null } }
  | { [T in Exclude<BlockType, 'hero' | 'story' | 'gifts' | 'custom'>]: { id: string; type: T; content: BlockContent[T] } }[Exclude<BlockType, 'hero' | 'story' | 'gifts' | 'custom'>]

export function sectionsForEvent(type: string, saved: unknown, details: unknown): Block[]
export function resolveSections(blocks: Block[], photos: SectionPhoto[]): SectionView[]

// src/lib/event-start.ts
export function parseClockTime(text: string): { hour: number; minute: number } | null
export function eventStart(day: string, timeText: string, timezone: string): string  // ISO instant
```

`InviteView` gains `cover: Cover`, `sections: SectionView[]`, `startsAt: string`. `InviteRecord.event` gains `sections`, `cover`; `InviteRecord` gains `sectionPhotos: { id: string; path: string; width: number; height: number }[]`. `AssetRepository` gains `listByEvent(eventId: string, kind: 'section'): Promise<AssetRecord[]>`, and `AssetRecord.kind` becomes `'background' | 'section'`.

Decisions:
- `src/lib/sections.ts` imports values from `#/server/validation/sections.schema` and `#/server/config/event-types`, the same way `InviteScreen` already imports `readWeddingDetails`. Both files are plain data and Zod, with no database or secrets, so they are safe in the browser bundle. Keep them that way.
- `sectionsForEvent`: when `readSections(saved)` is not empty, return it. Otherwise return the event type's `defaults` (an unknown type uses wedding's) with old details carried over: `details.headline` becomes the hero's `kicker`; `details.ceremony` and `details.reception` fill `venue` and `time` of the places labelled `'Ceremony'` and `'Reception'`.
- `resolveSections` drops disabled blocks, sets a missing photo to `null`, and removes story photos whose asset is missing.
- `parseClockTime` accepts `2:00 PM`, `2:00PM`, `2pm`, `2 PM`, `14:00`; anything else is `null`.
- `eventStart` uses the parsed time, or 00:00 when `null`, as wall-clock time in `timezone`, and returns the UTC instant. Work out the zone's offset with `Intl.DateTimeFormat(…, { timeZone, timeZoneName: 'longOffset' })`; no date library.
- `startsAt` = `eventStart(eventDate, time of the first place in the first enabled whenWhere block or '', event.timezone)`.

- [ ] **Step 1: Write the failing tests.**

```ts
// tests/lib/event-start.test.ts
it.each([['2:00 PM', 14, 0], ['2:00PM', 14, 0], ['2pm', 14, 0], ['12 AM', 0, 0], ['12:30 pm', 12, 30], ['14:05', 14, 5]])(
  'reads %s', (text, hour, minute) => expect(parseClockTime(text)).toEqual({ hour, minute }))
it.each(['after lunch', '', '25:00', '2:75 PM'])('gives null for %j', (text) => expect(parseClockTime(text)).toBeNull())
it('2 PM in Manila is 06:00 UTC', () => expect(eventStart('2027-06-12', '2:00 PM', 'Asia/Manila')).toBe('2027-06-12T06:00:00.000Z'))
it('an unreadable time counts to the start of the day', () =>
  expect(eventStart('2027-06-12', 'after lunch', 'Asia/Manila')).toBe('2027-06-11T16:00:00.000Z'))

// tests/lib/sections.test.ts
it('uses saved sections when there are any', ...)
it('falls back to wedding defaults and carries the old details over', () => {
  const blocks = sectionsForEvent('wedding', [], { headline: 'We do', ceremony: { venue: 'San Agustin', time: '2:00 PM' } })
  expect(blocks[0]).toMatchObject({ type: 'hero', content: { kicker: 'We do' } })
  expect(blocks.find((b) => b.type === 'whenWhere')?.content.places[0]).toMatchObject({ label: 'Ceremony', venue: 'San Agustin', time: '2:00 PM' })
})
it('leaves out switched-off blocks', ...)
it('a hero whose photo is gone gets photo: null', ...)
it('a story photo whose file is gone is removed', ...)

// tests/server/invite.service.test.ts (add)
it('returns the cover, the enabled sections and the countdown target', ...)
it('never includes other guests in the sections', async () => {
  const invite = await getInvite(T1, repo, now)
  expect(JSON.stringify(invite.sections)).not.toContain(otherGuestName)
})
```

- [ ] **Step 2:** Run `npx vitest run tests/lib tests/server/invite.service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Write `event-start.ts` and `sections.ts`.
- [ ] **Step 4:** Add `listByEvent` to the asset repository; in `prismaInviteRepository.findByToken` add `sections`, `cover` and `sectionPhotos`; update `sampleRecords()` in `tests/server/fakes.ts`. In `getInvite`, build `cover`, `sections` (`resolveSections(sectionsForEvent(…), photos with publicPhotoUrl)`) and `startsAt`.
- [ ] **Step 5: Verify.** `npm test && npm run typecheck`. Expected: all pass.

---

### Task 4: The scrolling invitation

**Files:**
- Create: `src/features/invite/components/SectionList.tsx`, `src/features/invite/components/sections/{Hero,Countdown,Story,Message,People,Gifts,DressCode,Reminders,WhenWhere,Rsvp,Closing,Custom}Section.tsx`, `src/features/invite/invite.sections.ts`
- Modify: `src/features/invite/components/InviteScreen.tsx`, `src/features/invite/invite.types.ts`, `src/features/invite/index.ts`, `src/features/design/components/DesignPreview.tsx`
- Test: `tests/features/invite-sections.test.tsx`

**Interfaces — Consumes:** `InviteView.sections`, `InviteView.startsAt`, `SectionView`, `Photo` (Task 3).

**Produces:**

```ts
// invite.sections.ts
export function isEmptySection(section: SectionView): boolean
// SectionList.tsx
export function SectionList(props: { invite: InviteView; token: string; preview: boolean }): JSX.Element
// each sections/*.tsx
export function StorySection(props: { content: Extract<SectionView, { type: 'story' }>['content'] }): JSX.Element
```

Decisions:
- `InviteScreen` keeps its root element, design variables and background (photo or `ThemeArt`), then renders `<SectionList>`. The old header, facts grid and guest panel are removed from it.
- `HeroSection` shows the kicker, `event.title` as the `h1`, the date (`formatDay`) and the photo.
- `RsvpSection` is the personal part: role title or "You are invited", the guest's name, role ask, note, attire, "Reply by" date, the intro text, then the existing `RsvpForm` unchanged.
- `isEmptySection`: `hero`, `countdown` and `rsvp` are never empty. Any other section is empty when all its text is blank and all its lists are empty. `SectionList` skips empty sections.
- `CountdownSection` is a client component: days, hours, minutes, seconds until `startsAt`, updated each second; it renders nothing once `startsAt` is past. The first render must match on server and browser (render the numbers only after mount).
- `WhenWhereSection`: a place with a `mapUrl` gets a link reading "Open map", `target="_blank" rel="noopener noreferrer"`.
- `GiftsSection`: the QR photo uses `object-contain` (never cropped). Account numbers are shown as text.
- `DressCodeSection`: each swatch is a colored circle with its name beside it as text (color is never the only signal).
- Every text container uses `break-words` (`overflow-wrap: anywhere`), and photos sit in fixed aspect boxes with `loading="lazy"` and an empty `alt` unless a caption exists (then the caption is the `alt`).
- `DesignPreview` builds `sections` with `resolveSections(sectionsForEvent(event.type, event.sections, event.details), [])`, `cover` from `event.cover`, and `startsAt` with `eventStart`. Move this into a small exported helper `previewInvite(event, design, photos)` in `src/features/invite/invite.helpers.ts` so Task 7 reuses it.

- [ ] **Step 1: Write the failing tests** in `tests/features/invite-sections.test.tsx` (use `// @vitest-environment happy-dom`, as `rsvp-form.test.tsx` does):

```tsx
it('draws enabled sections in the saved order', () => {
  render(<SectionList invite={inviteWith([hero, message('From us', 'Hello'), rsvp])} token="t" preview />)
  const headings = screen.getAllByRole('heading').map((h) => h.textContent)
  expect(headings.indexOf('From us')).toBeLessThan(headings.indexOf('Guest name'))
})
it('skips a section with nothing in it', () => {
  render(<SectionList invite={inviteWith([hero, message('', ''), rsvp])} token="t" preview />)
  expect(screen.queryByTestId('section-message')).toBeNull()
})
it('shows host text as text, not markup', () => {
  render(<SectionList invite={inviteWith([hero, message('Hi', '<img src=x onerror=alert(1)>'), rsvp])} token="t" preview />)
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy()
  expect(document.querySelector('img[src="x"]')).toBeNull()
})
it('a map link opens in a new tab and only when set', ...)
it('a hero with photo: null draws no image', ...)
it('long unbroken text sits in a wrapping container', () => {
  render(<SectionList invite={inviteWith([hero, message('Hi', 'A'.repeat(300)), rsvp])} token="t" preview />)
  expect(screen.getByText('A'.repeat(300)).className).toContain('break-words')
})
it('the countdown shows nothing after the event has started', ...)
```

Give each section's root `data-testid={`section-${type}`}`.

- [ ] **Step 2:** Run `npx vitest run tests/features/invite-sections.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Build the section components, `SectionList` and `isEmptySection`; rewire `InviteScreen` and `DesignPreview`. Follow `better-layout`, `better-typography` and `better-accessibility`; reuse the `LABEL` style and the panel classes already in `InviteScreen`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Verify.** `npm test && npm run typecheck && npm run lint && npm run build`. Then `npm run dev`, open a seeded guest link at 360 px wide: every default section shows, nothing scrolls sideways, and the reply modal still works.

---

### Task 5: Envelope cover and scroll-in animation

**Files:**
- Create: `src/features/invite/components/Cover.tsx`, `src/features/invite/components/Envelope.tsx`, `src/features/invite/components/Reveal.tsx`
- Modify: `src/server/config/themes/types.ts`, the four theme files, `src/lib/resolve-design.ts`, `src/features/invite/components/InviteScreen.tsx`, `src/features/invite/components/SectionList.tsx`, `src/app/globals.css`
- Test: `tests/features/cover.test.tsx`

**Interfaces — Produces:**

```ts
// themes/types.ts: Theme and ResolvedDesign gain
envelope: 'straight' | 'pointed' | 'curved' | 'stepped'
// black-and-white: 'straight', garden-botanical: 'curved', bohemian: 'pointed', art-deco: 'stepped'

export function Cover(props: { cover: Cover; title: string; date: string; design: ResolvedDesign;
  preview: boolean; children: React.ReactNode }): JSX.Element
export function Envelope(props: { shape: ResolvedDesign['envelope']; monogram: string }): JSX.Element
export function Reveal(props: { children: React.ReactNode }): JSX.Element
```

Decisions:
- `Cover` wraps the invitation. When `cover.enabled` is false it renders only `children`.
- Closed state: the cover fills the screen with `cover.line`, the `Envelope`, the title, the date and one real `<button>` labelled "Tap to open". The invitation behind it is in the page already but `inert` and visually hidden, so it loads while the guest looks at the cover.
- Opening: the flap lifts and the cover fades, about 900 ms in total, then the cover is removed and focus moves to the invitation's `h1`.
- Reduced motion (`prefers-reduced-motion: reduce`): no flap or fade; the cover disappears at once.
- No JavaScript: a `<noscript><style>` rule hides the cover and shows the invitation, so the invitation is never trapped behind a button that cannot work.
- In preview mode the cover starts closed and can be opened and closed again with a small "Show cover" control outside the `inert` area (Task 7 places it).
- `Envelope` is one inline SVG drawn only with `var(--accent)`, `var(--panel)`, `var(--line)` and `var(--ink)`; the monogram is SVG text in the display font. `aria-hidden`.
- `Reveal` adds a class when its child first enters the viewport (`IntersectionObserver`, threshold 0.15, once). CSS in `globals.css` moves it up 16 px and fades it in over 500 ms, inside `@media (prefers-reduced-motion: no-preference)` only. `SectionList` wraps every section except the hero. Follow `better-motion`.

- [ ] **Step 1: Write the failing tests** in `tests/features/cover.test.tsx`:

```tsx
it('shows the line, title, date, monogram and a button', ...)
it('keeps the invitation inert until opened, then removes the cover', async () => {
  render(<Cover cover={cover} title="M & P" date="June 12, 2027" design={design} preview={false}><h1>Inside</h1></Cover>)
  expect(screen.getByText('Inside').closest('[inert]')).not.toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Tap to open' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Tap to open' })).toBeNull())
  expect(screen.getByText('Inside').closest('[inert]')).toBeNull()
})
it('renders only the invitation when the cover is switched off', ...)
it('opens at once when reduced motion is asked for', ...)   // stub window.matchMedia
```

- [ ] **Step 2:** Run `npx vitest run tests/features/cover.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Add `envelope` to the theme type, the four themes and `resolveDesign`; build `Envelope`, `Cover` and `Reveal`; wrap `InviteScreen`'s content in `Cover`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Verify.** `npm test && npm run typecheck && npm run lint && npm run build`. In the browser, on each of the four themes: the envelope uses the theme's colors, opens on tap and on Enter, and with the system's reduce-motion setting on it opens with no animation.

---

### Task 6: Section photos

**Files:**
- Modify: `src/server/storage/image.ts`, `src/server/services/photo.service.ts`, `src/server/services/event.service.ts`, `src/server/repositories/{asset,event}.repository.ts`, `src/app/api/events/[eventId]/assets/route.ts`, `tests/server/fakes.ts`
- Create: `src/app/api/events/[eventId]/assets/[assetId]/route.ts`
- Test: `tests/server/section-photo.test.ts`, `tests/server/photo.test.ts` (add), `tests/api/assets.test.ts`

**Interfaces — Produces:**

```ts
export async function processPhoto(input: Buffer, maxWidth?: number): Promise<ProcessedPhoto>   // default 2000
export const MAX_SECTION_PHOTOS = 30
export async function uploadSectionPhoto(userId: string, eventId: string, file: Buffer,
  use: 'photo' | 'qr', deps: Deps): Promise<EventView>
export async function deleteSectionPhoto(userId: string, eventId: string, assetId: string, deps: Deps): Promise<EventView>
// AssetRepository gains
countByEvent(eventId: string, kind: 'section'): Promise<number>
// EventView gains
sectionPhotos: SectionPhoto[]    // every section photo of the event, used or not
// EventRecord gains
sectionAssets?: AssetRecord[]    // filled in findById, like backgroundPath
```

Decisions:
- `Deps.processImage` becomes `(input: Buffer, maxWidth?: number) => Promise<ProcessedPhoto>`. `use: 'photo'` passes 1600, `'qr'` passes 1000.
- `POST /api/events/[eventId]/assets` reads form fields `kind` (`background` default, or `section`) and `use` (`photo` default, or `qr`); any other value is `VALIDATION`. `kind=background` behaves exactly as today.
- At 30 section photos, upload is refused: `AppError('VALIDATION', 'This invitation already has 30 photos. Delete one to add another.')`. Check the count before processing the file.
- `deleteSectionPhoto`: an asset that is missing, belongs to another event, or is the background gets `NOT_FOUND`. It removes the id from every block (`hero.photoAssetId`, `custom.photoAssetId`, `payments[].qrAssetId` unset; matching `story.photos` entries removed), saves the event, then removes the file and the record.
- The browser already shrinks uploads over 3.5 MB (`shrinkPhoto`), because Vercel refuses bodies over about 4.5 MB. Task 7 reuses it.

- [ ] **Step 1: Write the failing tests** in `tests/server/section-photo.test.ts`:

```ts
it('stores a section photo at 1600 px and lists it on the event', async () => {
  const event = await uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)
  expect(processImage).toHaveBeenCalledWith(file, 1600)
  expect(event.sectionPhotos).toHaveLength(1)
})
it('stores a QR photo at 1000 px', ...)
it('lists a photo that no section uses yet', ...)          // Review Focus 4
it('refuses the 31st photo before reading the file', async () => {
  // 30 already stored
  await expect(uploadSectionPhoto(OWNER, eventId, file, 'photo', deps)).rejects.toMatchObject({ code: 'VALIDATION' })
  expect(processImage).not.toHaveBeenCalled()
})
it('gives a stranger NOT_FOUND on upload and on delete', ...)
it('deleting a photo takes it out of the hero, the story and a payment option', ...)
it('cannot delete the background through this path', ...)
it('cannot delete a photo of another event', ...)
```

- [ ] **Step 2:** Run `npx vitest run tests/server/section-photo.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the repository methods, `processPhoto(input, maxWidth)`, both service functions, `EventView.sectionPhotos`, the upload route change and the new delete route. In `updateSections` (Task 2) nothing changes.
- [ ] **Step 4:** Add `tests/api/assets.test.ts`: `kind=section` returns 201 with `sectionPhotos`; `kind=video` returns 400; `DELETE …/assets/<id>` returns 200 for the owner and 404 for a stranger. Add to `tests/server/photo.test.ts`: `processPhoto(wide, 1600)` gives width 1600.
- [ ] **Step 5: Verify.** `npm test && npm run typecheck && npm run lint`. Expected: all pass.

---

### Task 7: The host's Invitation tab

**Files:**
- Create: `src/features/sections/{index.ts,sections.service.ts,sections.query.ts,sections.helpers.ts,sections.config.ts}`, `src/features/sections/components/{InvitationPanel,SectionRow,CoverFields,PhotoPicker,PhotoShelf,InvitationPreview}.tsx`, `src/features/sections/components/forms/{Hero,Story,Message,People,Gifts,DressCode,Reminders,WhenWhere,Rsvp,Closing,Custom}Form.tsx`
- Modify: `src/features/events/components/EventEditor.tsx`, `src/features/events/events.schema.ts`
- Test: `tests/features/sections.helpers.test.ts`, `tests/features/invitation-panel.test.tsx`

**Interfaces — Consumes:** `Block`, `Cover`, `SectionsInput`, `EventView.sections/cover/sectionPhotos`, `sectionsForEvent`, `resolveSections`, `previewInvite`, `shrinkPhoto`, `useRolesQuery`, `useGuestsQuery`.

**Produces:**

```ts
// sections.service.ts
export const SECTIONS_SERVICE = {
  SAVE: (eventId: string, input: SectionsInput) => Promise<EventView>,                 // PATCH …/sections
  UPLOAD_PHOTO: (eventId: string, photo: Blob, use: 'photo' | 'qr') => Promise<EventView>,
  DELETE_PHOTO: (eventId: string, assetId: string) => Promise<EventView>,
}
// sections.query.ts — each invalidates EVENTS_QUERY_KEYS.all
export function useSaveSectionsMutation(eventId: string)
export function useUploadSectionPhotoMutation(eventId: string)
export function useDeleteSectionPhotoMutation(eventId: string)
// sections.helpers.ts
export function moveBlock(blocks: Block[], id: string, direction: 'up' | 'down'): Block[]
export function addCustomBlock(blocks: Block[]): Block[]
export function removeBlock(blocks: Block[], id: string): Block[]
export function canAddCustom(blocks: Block[]): boolean
export function fillPeopleFromRoles(roles: RoleView[], guests: GuestView[]): BlockContent['people']['groups']
// sections.config.ts
export const BLOCK_LABELS: Record<BlockType, { name: string; hint: string }>
```

Decisions:
- Tabs in `EventEditor` become Guests, Roles, **Invitation**, Design, Details, Settings (key `invitation`). The headline, ceremony and reception fields leave the Details form and `events.schema.ts`; Details keeps the title and dates.
- `InvitationPanel` holds one working copy in React state, started from `sectionsForEvent(event.type, event.sections, event.details)` and `event.cover`. Nothing is sent until Save.
- Layout: the section list on the left, `InvitationPreview` on the right; on phones the preview comes below, reached by a "Preview" link at the top of the list.
- `SectionRow`: the name and hint from `BLOCK_LABELS`, an on/off switch, "Move up" and "Move down" buttons, and a disclosure that opens the block's form. The hero has no switch and no move buttons. The rsvp has no switch. `moveBlock` never moves anything above the hero and returns the same list when the move is impossible; the buttons are disabled in those cases. Custom rows also have "Remove".
- `addCustomBlock` inserts the new block just before `rsvp`, id `custom-<random>`, enabled, empty. The "Add custom section" button is disabled with the reason shown once there are 5.
- `fillPeopleFromRoles`: one group per role that has at least one guest, in the roles' order; the title is the role title and the names are those guests' names sorted A to Z. The "Fill from my roles" button shows only when `event.hasRoles` and asks for confirmation before replacing existing groups.
- Lists inside forms (names, reminders, places, swatches, ideas, payments, story photos) use add, remove, move up and move down, and show "x of y" against their limit. Names can also be pasted, one per line.
- `PhotoPicker` uploads through `shrinkPhoto` and `useUploadSectionPhotoMutation`, then puts the new id into the working copy. `PhotoShelf` lists every `event.sectionPhotos` entry with "Used" or "Not used", the count "x of 30", and a delete button that confirms first.
- `InvitationPreview` renders `InviteScreen` in preview mode from `previewInvite(event, design, event.sectionPhotos)` using the working copy, with a "Show cover" button.
- Save: one "Save invitation" button. Beside it, "Unsaved changes" or "Saved". A `beforeunload` warning while there are unsaved changes; switching tabs with unsaved changes asks first. Server validation messages are shown at the top of the panel in the server's words.
- Host screens keep the dark and elegant styles in `src/components/host-styles.ts`. Follow `better-ui`, `better-writing`, `better-accessibility`; run the `better-interface` review and report its findings to Gene.

- [ ] **Step 1: Write the failing helper tests** in `tests/features/sections.helpers.test.ts`:

```ts
it('moves a block down and back up', ...)
it('never moves a block above the hero', () => expect(moveBlock([hero, message, rsvp], 'message', 'up')).toEqual([hero, message, rsvp]))
it('leaves the last block where it is when moved down', ...)
it('adds a custom block just before the rsvp', () =>
  expect(addCustomBlock([hero, rsvp, closing]).map((b) => b.type)).toEqual(['hero', 'custom', 'rsvp', 'closing']))
it('cannot add a sixth custom block', ...)
it('builds groups from roles, skipping roles with no guests', () => {
  expect(fillPeopleFromRoles([bestMan, flowerGirl], [guest('Zed', bestMan.id), guest('Abe', bestMan.id)]))
    .toEqual([{ title: 'Best Man', names: ['Abe', 'Zed'] }])
})
```

- [ ] **Step 2:** Run `npx vitest run tests/features/sections.helpers.test.ts`. Expected: FAIL. Then write the helpers and config until it passes.
- [ ] **Step 3: Write the failing panel tests** in `tests/features/invitation-panel.test.tsx` (mock `SECTIONS_SERVICE`, wrap in a `QueryClientProvider`):

```tsx
it('shows "Unsaved changes" after an edit and "Saved" after saving', ...)
it('sends the whole list in its new order on save', async () => {
  // move "From us" down once, save
  expect(SECTIONS_SERVICE.SAVE).toHaveBeenCalledWith(eventId, expect.objectContaining({
    sections: expect.arrayContaining([expect.objectContaining({ type: 'message' })]) }))
})
it('the hero row has no switch and no move buttons', ...)
it('switching a section off removes it from the preview', ...)
it('shows the server message when a save is refused', ...)
```

- [ ] **Step 4:** Build the service, queries, panel, rows, forms, photo picker, photo shelf and preview; add the tab; move the three fields out of Details.
- [ ] **Step 5:** Run `npx vitest run tests/features`. Expected: PASS.
- [ ] **Step 6: Verify.** `npm test && npm run typecheck && npm run lint && npm run build`. In the browser at 360 px and at desktop width: edit every section type, reorder, add and remove a custom section, upload and delete a photo, save, reload, and open a guest link to see the same result. Report the `better-interface` findings.

---

### Task 8: Birthday and christening

**Files:**
- Modify: `src/server/config/event-types.ts`, `src/server/validation/event.schema.ts`, the four theme files, `src/features/events/components/CreateEventForm.tsx`, `src/features/design/components/DesignPreview.tsx`, `src/features/invite/invite.helpers.ts`
- Test: `tests/lib/sections.test.ts` (add), `tests/server/event.service.test.ts` (add)

**Interfaces — Produces:** `EventTypeKey = 'wedding' | 'birthday'`.

Decisions:
- `birthday`: name `'Birthday and christening'`, `hasRoles: false`, `blocks` all of `BLOCK_TYPES`.
- Defaults, in order: `hero` (kicker `'Please join us to celebrate'`), `countdown`, `story` (off, heading `'The first year'`), `message` (heading `'From our family'`), `people` (off, heading `'Godparents'`, groups titled `'Godfathers'` and `'Godmothers'`), `whenWhere` (one place labelled `'Celebration'`), `dressCode`, `gifts` (off), `reminders` (off, heading `'Reminders'`), `rsvp`, `closing`.
- All four themes add `'birthday'` to `eventTypes`.
- `CreateEventForm` gets an event type choice (two radio options). `event.schema.ts` accepts `z.enum(['wedding', 'birthday'])`.
- `previewInvite` and `DesignPreview` take the type name from the event type instead of the fixed `'Wedding'`; for an event type without roles the preview guest has `role: null`.

- [ ] **Step 1: Write the failing tests:**

```ts
it('a new birthday starts from the birthday defaults', () =>
  expect(sectionsForEvent('birthday', [], {}).find((b) => b.type === 'people')).toMatchObject({ enabled: false, content: { heading: 'Godparents' } }))
it('creates a birthday event', async () => {
  const event = await createEvent(owner, { ...input, type: 'birthday' }, deps)
  expect(event.type).toBe('birthday')
})
it('refuses an event type that does not exist', ...)
```

- [ ] **Step 2:** Run `npx vitest run tests/lib/sections.test.ts tests/server/event.service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Add the type, the defaults, the theme entries, the form choice and the preview change.
- [ ] **Step 4: Verify.** `npm test && npm run typecheck && npm run lint && npm run build`. In the browser: create a birthday event, check the Roles tab is not shown (`EventEditor` leaves it out when `event.hasRoles` is false; add that here), publish, and open a guest link.

---

## After the last task

- Run the full `better-interface` review on the guest page and the Invitation tab; report findings to Gene and fix only what he approves.
- Tick the stages off in this file and tell Gene which migration to run on Supabase (`npx prisma migrate deploy`) before deploying.
