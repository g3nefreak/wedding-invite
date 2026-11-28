# wedding-invite: envelope cover and section blocks (design)

Date: 2026-11-26
Status: APPROVED by Gene on 2026-11-26
Repo: g3nefreak/wedding-invite (branch `main`, read at commit a47d695)
Home in the repo: `.codex/plans/2026-11-26-envelope-and-section-blocks-design.md` (the repo keeps plans in `.codex/plans/`)
Build plan: `wedding-invite-envelope-and-section-blocks-plan.md`

Lines marked **(Claude's call)** were decided by Claude, not by Gene. Gene can overrule any of them.

## 1. Intent

Gene shared two Canva-site invitations as the concept for wedding-invite:

- https://annminguillan.my.canva.site/you-have-a-letter
- https://annminguillan.my.canva.site/zian-elandre-invitation

They are one invitation (a first birthday and christening). The guest first sees an envelope with a monogram and "Click to open". Tapping it opens one long scrolling page of sections: hero, countdown, photo story, family message, godparents list, gift guide with GCash and bank details, dress code with color swatches, reminders, when and where with a location pin, RSVP, and a closing message.

Gene wants this concept for every invitation the app makes, weddings included, and wants each customer to customize their own invitation themselves.

Today the app cannot do this. An invitation is one fixed screen (`InviteScreen.tsx`) showing the title, a headline, ceremony and reception, attire and the RSVP form. A host can change only the theme, accent color, font pair, background photo and overlay.

## 2. Goals, non-goals, anti-goals

Goals
- Every invitation opens with an envelope cover, then a scrolling page of sections.
- A host builds their invitation from a fixed library of section blocks: switch each on or off, move it up or down, fill in a form.
- A host can add their own "custom section" for anything the library lacks.
- A host sees a live preview while editing.
- Weddings first. Birthday and christening second, on the same blocks.
- The theme keeps control of colors, fonts and decorations, so every invitation looks good on a phone.

Non-goals (not in this work)
- A free canvas or drag-and-drop editor. Still ruled out.
- Per-section colors or fonts.
- Background music or video.
- Online payment. Gift details are display only.
- Guests uploading photos, plus-ones, party size.

Anti-goals (these would make it a failure even if it works)
- An invitation that looks broken or cramped on a phone.
- A guest being able to see the guest list or other guests' replies.
- A host being able to put HTML, CSS or script into an invitation.
- An editor a customer cannot use without asking Gene for help.

## 3. Constraints

- Stack stays as it is: Next.js 16 App Router, React 19, Prisma 7 on Supabase Postgres, Supabase Storage, Zod 4, Tailwind 4, Vitest. No new dependency without asking Gene.
- Every request keeps the flow route → validation → auth check → service → repository.
- All host text is stored and rendered as plain text.
- Supabase and Vercel free tiers, so photo count and size need limits.
- Table changes only through `prisma/schema.prisma` and a new migration.
- The host screens keep the current dark and elegant look and must work on phones.

## 4. Approaches considered

| | A. Blocks: switch, reorder, fill in | B. Fixed order: switch and fill in | C. Free canvas |
|---|---|---|---|
| Flexibility | High | Medium | Highest |
| Risk of a broken invitation | Low | Lowest | High |
| Build effort | Medium | Smallest | Very large |

Gene picked **A** on 2026-11-26. B was too rigid for "based on what the customer wants". C is the drag-and-drop editor already ruled out, and it cannot promise a good result on phones.

## 5. Design

### 5.1 What a guest sees

1. **Cover.** An envelope drawn in the theme's colors, with a monogram, a short line above it (for example "You have a letter"), the event title, the date and "Tap to open".
2. **Opening.** Tapping the envelope plays a short opening animation, then shows the invitation.
3. **Invitation.** The host's enabled sections, in the host's order. Each section fades and rises in as it scrolls into view.

Rules
- The cover shows on every visit. The host can switch the cover off. **(Claude's call)**
- The envelope is drawn with SVG and CSS from the theme palette, one envelope style per theme. No image files, no new dependency. **(Claude's call)**
- Guests who ask their device for reduced motion get no animation: the cover is a plain button and sections appear without movement.
- The existing personal parts stay: the guest's name, their role ask (for example "Will you be my best man?"), their personal note, and the reply-in-a-modal behavior.

### 5.2 The block library (version 1)

| Block | What the host fills in | Limits |
|---|---|---|
| `hero` | Line above the name, optional photo. The title and date come from the event. | 1 per invitation, always on, always first |
| `countdown` | Nothing. Counts down to the event date and the first time in "when and where". | 1 |
| `story` | Heading, intro text, photos each with a caption | up to 12 photos |
| `message` | Heading, text | 1 |
| `people` | Heading, intro text, groups; each group has a title and a list of names | up to 8 groups, 40 names per group |
| `gifts` | Intro text, gift ideas (title and note), payment options (label, account name, account number, QR photo), closing text | up to 8 ideas, 3 payment options |
| `dressCode` | Text, color swatches (name and color) | up to 6 swatches |
| `reminders` | Heading, list of short reminders | up to 8 |
| `whenWhere` | Places; each has a label, venue, time, address and a map link | up to 4 places |
| `rsvp` | Intro text. The reply form itself is the existing one. | 1, always on, can be moved |
| `closing` | Text, signature line | 1 |
| `custom` | Heading, text, optional photo | up to 5 per invitation |

Notes
- `countdown` hides itself once the event day has passed. **(Claude's call)**
- Map links are accepted only when they start with `https://` and point to Google Maps (`google.com/maps`, `maps.app.goo.gl`, `goo.gl/maps`) or Waze (`waze.com`). They are the only links anywhere in an invitation. **(Claude's call)**
- Swatch colors are plain 6-digit hex colors, the same rule as the accent color today.
- Text limits: headings 80 characters, short lines 120, paragraphs 1,200. **(Claude's call)**

### 5.3 The entourage and the privacy rule

Security rule 1 says a guest must never see the guest list or other guests' names. A wedding entourage section shows names to every guest, so the two must be kept apart:

- The names in a `people` block are text the host types into that block. They are published content, like the couple's names.
- The guest list (`Guest` rows), personal links and replies stay private exactly as today. The guest endpoint never reads other guests to build a `people` block.
- In the editor, a wedding host gets a "Fill from my roles" button that copies role titles and the names of guests in each role into the block once. After that it is ordinary text the host can edit. **(Claude's call)**

Rule 1 in the backend rules file is reworded to say this.

### 5.4 Data

`Event` gets two new JSON columns (one migration):

- `sections` (default `[]`): the ordered list of blocks.
- `cover` (default `{}`): `{ enabled, monogram, line }`. The monogram is at most 3 characters and defaults to the initials in the title.

Each block is stored as:

```ts
{ id: string, type: BlockType, enabled: boolean, content: { ... } }
```

- One strict Zod schema per block type in `src/server/validation/sections.schema.ts`. Unknown fields and unknown block types are refused on save.
- Reading is forgiving, the same way `readDesignOverrides` is today: a block that fails to parse is skipped, so one bad block cannot break an invitation.
- `AssetKind` gains `section`. A block refers to a photo by asset id. On save, the service checks every asset id belongs to the same event.
- `src/server/config/event-types.ts` gains, per event type, the allowed blocks and the default list a new event starts with. The current `sections: string[]` field is replaced.
- Existing events: when `sections` is empty, the invitation is built from the event type's defaults, with `details.headline`, `details.ceremony` and `details.reception` carried into the `hero` and `whenWhere` blocks. Nothing already saved is lost. `details` stays in the table but new edits go to `sections`. **(Claude's call)**

Wedding defaults, in order: hero, countdown, story, message, people (entourage), whenWhere (ceremony and reception), dressCode, gifts, reminders, rsvp, closing. Story, gifts and reminders start switched off so a new invitation is not full of empty sections. **(Claude's call)**

### 5.5 Photos

- Same checks as background photos today: JPEG, PNG or WebP by file content, 8 MB maximum, resized on the server.
- Section photos are resized to at most 1600 px wide. QR photos are kept sharp at up to 1000 px and are not cropped. **(Claude's call)**
- At most 30 section photos per event, to stay inside the free storage tier. **(Claude's call)**
- Deleting a photo removes it from storage and from any block that used it.

### 5.6 API

Added or changed, all following the existing flow and response shape:

| Method | Path | Does |
|---|---|---|
| PATCH | `/api/events/[eventId]/sections` | Replaces the whole section list and the cover settings. Strict validation, ownership check, asset ownership check. |
| POST | `/api/events/[eventId]/assets` | Now takes a `kind` (`background` or `section`). |
| DELETE | `/api/events/[eventId]/assets/[assetId]` | Removes a photo. |
| GET | `/api/invites/[token]` | Now also returns the cover and the enabled sections with photo URLs. Still one guest's data only. |

### 5.7 The host editor

A new "Invitation" tab on the event page (`src/app/host/events/[eventId]`), next to the existing tabs. The ceremony, reception and headline fields in `EventEditor` move here.

- Left: the list of sections. Each row has an on/off switch, up and down buttons, and opens into its form. Up and down buttons are used instead of dragging because they work well on phones and need no new dependency. **(Claude's call)**
- "Add custom section" at the bottom of the list.
- Cover settings at the top: on/off, monogram, line.
- Right (below on phones): the live preview, reusing `DesignPreview` and `InviteScreen` in preview mode, including the envelope opening. The preview updates as the host types, before saving.
- One "Save" button with a clear "unsaved changes" state, and a warning before leaving with unsaved changes. **(Claude's call)**
- Form errors appear beside the field, in plain words.

### 5.8 Rendering

- `InviteScreen` becomes: cover, then a loop over the sections, each drawn by its own component in `src/features/invite/components/sections/`.
- Sections use the theme's existing palette, fonts, panel radius and art. Each theme may add small decorations between sections.
- Scroll-in animation uses CSS and the browser's `IntersectionObserver`. No animation library.
- Photos load lazily with fixed aspect boxes, so the page does not jump while loading.

## 6. Order of work

1. Update the backend rules file (`AGENTS.backend.md` and the copy in the Claude Project): the design model now includes section blocks, the new columns, the new asset kind, the reworded rule 1.
2. Data and validation: migration, block schemas, event-type defaults, service and repository, tests.
3. Guest side: section components and the new `InviteScreen` loop, using the wedding defaults.
4. Envelope cover and scroll animations.
5. Host editor: Invitation tab, forms, live preview.
6. Section photos: upload, limits, delete.
7. Birthday and christening event type with its own defaults.

Steps 2 to 4 give a new-looking wedding invitation before the editor exists. Each step can be deployed on its own.

## 7. Testing

- Service tests for saving sections: not the owner (404), unknown block type, over a limit, an asset from another event, HTML in text stays text.
- Reading tests: a broken block is skipped, an event with empty `sections` falls back to defaults plus its old `details`.
- Guest endpoint test: the response never contains other guests' names or replies.
- Component tests: each section draws its content and hides its empty parts; the cover works with reduced motion.
- Map link test: anything outside the allowed sites is refused.

## 8. Left to the builder

- The exact envelope drawing and opening animation per theme.
- The look of each section within the theme's palette and fonts.
- Component and file names beyond those given here.
- How the preview scales inside the editor on small screens.
