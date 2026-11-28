# AGENTS.backend.md — Online Invitation (backend design and rules)

Status: DRAFT, waiting for Gene's approval and his can/cannot list (section 10).
This file sits beside the team policy in `AGENTS.md` (from `agent-setup-bundle/1-portable/`) and does not replace it. `AGENTS.md` says how agents work; this file says what the backend is. Any agent working on the backend must read both.

## 1. What this product is

A web app where a client (the host) creates an online invitation for an event, designs it by picking a theme and customizing it, sends each guest a personal link, and sees who is coming.

- Event types: wedding (with entourage roles) and birthday and christening (no roles; godparents are listed by name in a `people` block). Bridal shower and others later.
- Design model: **theme + customize only**. The host picks a theme, changes the accent color, font pair and background photo, and builds the invitation from a fixed library of section blocks (switch each on or off, set the order, fill in the content). There is no drag-and-drop editor. Do not build one.
- Two kinds of people use it: **hosts** (log in, own events) and **guests** (no account, open a personal link, reply).

## 2. Stack

- Next.js (App Router) with TypeScript, one repo for frontend and backend
- Postgres on Supabase, accessed through Prisma
- Supabase Auth for host login
- Supabase Storage for uploaded background photos
- Zod for input validation
- Tailwind + shadcn, TanStack Query, react-hook-form on the frontend (see CLAUDE.md)
- Vitest for tests
- Deployed on Vercel

Do not add another framework, database, ORM or auth library without asking Gene.

## 3. Folder structure

```
/
├─ AGENTS.md                   # team policy (from the agent setup bundle)
├─ AGENTS.backend.md           # this file
├─ prisma/
│  ├─ schema.prisma            # the only definition of tables
│  └─ migrations/
├─ src/
│  ├─ app/                     # pages and API routes (thin)
│  │  ├─ i/[token]/            # guest's invitation page
│  │  ├─ host/                 # host dashboard, login required
│  │  └─ api/                  # see section 6
│  ├─ server/                  # backend only; never import UI code here
│  │  ├─ services/             # business rules, one file per subject
│  │  ├─ repositories/         # the only code that calls Prisma
│  │  ├─ validation/           # Zod schemas, one file per subject
│  │  ├─ auth/                 # session lookup, ownership checks
│  │  ├─ storage/              # photo upload and resize
│  │  ├─ config/
│  │  │  ├─ themes/            # one file per theme (data, not code)
│  │  │  └─ event-types.ts     # which sections each event type has
│  │  └─ errors.ts             # shared error types
│  ├─ features/<module>/       # frontend modules: service, query hooks, schema, types, components
│  ├─ components/              # shared UI (shadcn in components/ui)
│  └─ lib/                     # small helpers shared by both sides
└─ tests/
```

## 4. The one flow every request follows

```
API route  →  validation  →  auth check  →  service  →  repository  →  database
```

- **Route**: reads the request, calls validation and one service function, returns JSON. No business rules, no Prisma.
- **Validation**: every body, query and URL parameter goes through a Zod schema. Unknown fields are rejected.
- **Service**: all rules live here (reply deadline, ownership, limits). No `Request`/`Response` objects, no Prisma.
- **Repository**: only database reads and writes. No rules.

If a change does not fit this flow, stop and ask instead of bending it.

## 5. Data model

| Table | Key fields | Notes |
|---|---|---|
| `User` | id, email, name | A host. The id matches the Supabase Auth user id. |
| `Event` | id, ownerId, type, title, eventDate, replyBy, timezone (default `Asia/Manila`), status (`draft`/`published`), details (JSON), themeKey, design (JSON), sections (JSON), cover (JSON) | `details` holds type-specific content (venues, celebrant, headline). `design` holds only the host's overrides of the theme. `sections` is the ordered list of section blocks; `cover` is the envelope cover's settings. |
| `Role` | id, eventId, title, askText, note, attire, color | Used by event types that have roles (wedding entourage). |
| `Guest` | id, eventId, name, token (unique), roleId (optional), personalNote | `token` is a random, unguessable string, never built from the name. |
| `Rsvp` | id, guestId (unique), answer (`going`/`not_going`), message, updatedAt | One row per guest. Replying again updates it. |
| `Asset` | id, eventId, kind (`background`/`section`), path, width, height, bytes | A stored photo. `section` photos are used inside section blocks. |

Themes and event types are **not** tables. They are files in `src/server/config/`.

### Section blocks

`Event.sections` is a list of `{ id, type, enabled, content }`. The block types are `hero`, `countdown`, `story`, `message`, `people`, `gifts`, `dressCode`, `reminders`, `whenWhere`, `rsvp`, `closing` and `custom`. Each type has one strict Zod schema in `src/server/validation/sections.schema.ts`; an unknown type or an unknown field is refused on save. Reading is forgiving: a block that fails to parse is skipped. `Event.cover` is `{ enabled, monogram, line }`. Each event type lists its allowed blocks and its default blocks in `config/event-types.ts`.

### Theme file shape

```ts
{
  key: "black-and-white",
  name: "Black and White",
  category: "classic-formal",
  eventTypes: ["wedding"],
  palette: { ground, ink, inkSoft, panel, line, accent, buttonInk },
  fontPairs: [                       // first one is the default
    { display: "Bodoni Moda", body: "Space Grotesk" }
  ],
  labelFont: "Space Mono",
  art: "photo",                      // photo | leaf-arch | orbit-sun | deco-fan
  panelRadius: 28,
  heroAlign: "left",                 // left | center
  photo: { overlay: 0.62, filter: "grayscale" }
}
```

`Event.design` may override only: the accent color, `fontPairIndex`, `displayFont`, `bodyFont`, `backgroundAssetId` and `overlay`. Anything else is rejected by validation. A host picks fonts either as one of the theme's own `fontPairs`, or separately as a heading font and a text font from the font library in `src/server/config/fonts.ts`. A font name outside that library is refused, because the name ends up in the page's CSS. Every library font must also be loaded in `src/app/fonts.ts`.

## 6. API

Guest (no login; the token is the key):

| Method | Path | Does |
|---|---|---|
| GET | `/api/invites/[token]` | Returns this one guest's invitation: event details, resolved design, their role, their current reply. |
| PUT | `/api/invites/[token]/rsvp` | Saves or updates the reply. |

Host (login required; every call checks that the event belongs to the logged-in user):

| Method | Path | Does |
|---|---|---|
| GET | `/api/themes?eventType=` | Lists themes for an event type. |
| GET, POST | `/api/events` | Lists own events; creates one. |
| GET, PATCH, DELETE | `/api/events/[eventId]` | Reads, edits, deletes one event. |
| PATCH | `/api/events/[eventId]/design` | Changes theme and design overrides. |
| PATCH | `/api/events/[eventId]/sections` | Replaces the section blocks and the cover settings. |
| POST | `/api/events/[eventId]/publish` | Makes guest links work. |
| GET, POST | `/api/events/[eventId]/roles` | Lists and adds roles. |
| PATCH, DELETE | `/api/events/[eventId]/roles/[roleId]` | Edits, removes a role. |
| GET, POST | `/api/events/[eventId]/guests` | Lists guests with their replies and links; adds a guest. |
| PATCH, DELETE | `/api/events/[eventId]/guests/[guestId]` | Edits, removes a guest. |
| GET | `/api/events/[eventId]/rsvps/summary` | Counts: going, not going, no reply yet. |
| POST | `/api/events/[eventId]/assets` | Uploads a photo. Takes a kind: `background` (default) or `section`. |
| DELETE | `/api/events/[eventId]/assets/[assetId]` | Removes one section photo, and takes it out of any block that used it. |

Response shape, always: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

## 7. Security rules (never break these)

1. A guest endpoint returns data about **one guest only**. Never return the guest list, guest links or other guests' replies to a guest. Names a host types into a `people` block are published content, like the couple's names; the endpoint never reads `Guest` rows to build that block.
2. Every host endpoint checks ownership in the service: `event.ownerId === session.userId`. A wrong owner gets 404, not 403.
3. Guest tokens are at least 128 bits of randomness from a cryptographic generator.
4. Guest links work only when the event is `published`.
5. Replies are refused after `replyBy` (the host can still see them).
6. Rate-limit the guest endpoints per IP and per token.
7. Uploads: images only (JPEG, PNG, WebP), checked by file content and not by file name, 8 MB maximum, resized on the server (background at most 2000 px wide, section photos 1600 px, QR photos 1000 px), stored under a path that includes the event id. At most 30 section photos per event.
8. All user text is stored as plain text and rendered as text. Never render it as HTML.
9. Secrets live in environment variables. Never commit them. The Supabase service key is used only in `src/server/`.
10. The only links in an invitation are map links. A map link must start with `https://` and point to Google Maps (`google.com/maps`, `maps.google.com/maps`, `maps.app.goo.gl`, `goo.gl/maps`) or Waze (`waze.com`). Anything else is refused on save.

## 8. Rules for the agent

Do:
- Follow the flow in section 4 for every endpoint.
- Change tables only through `prisma/schema.prisma` and a new migration.
- Add a new theme by adding one file in `config/themes/`. No other code should need to change.
- Add a new event type by adding one entry in `config/event-types.ts`.
- Write a test for every service function, including the "not the owner" and "after deadline" cases.
- Keep changes small and say what was changed and why.

Do not:
- Call Prisma outside `repositories/`.
- Put rules in routes or components.
- Edit or delete an existing migration.
- Add a dependency without asking.
- Build features that are not listed in section 10.
- Store a host's design as raw CSS or HTML.

## 9. Decisions made by Claude (Gene can overrule any of these)

- Themes and event types are files in the repo, not database tables, so adding one is a small reviewed change.
- The "type your name to find your invitation" search from the old single-page version is removed. Guests open their personal link only, so the guest list stays private.
- A guest replies for themself only (no plus-ones or party size yet).
- First version: wedding event type plus four or five themes. Other event types and themes follow.
- Hosting on Supabase and Vercel free tiers.

## 10. What this project can and cannot do

To be filled in by Gene.

Can:
- 

Cannot:
- 
