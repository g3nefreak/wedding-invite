# Foundation + Guest Invitation and RSVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Next.js app where a guest opens a personal link, sees their themed invitation, and saves or updates a reply.

**Architecture:** One Next.js repo. API routes are thin and call services in `src/server/`; services hold the rules and receive their repository as an argument, so they are tested with in-memory fakes and no database. Themes are data files; a resolver turns theme + host overrides into CSS variables.

**Tech Stack:** Next.js (App Router) + TypeScript, Prisma on Supabase Postgres, Zod, Tailwind + shadcn, TanStack Query, Vitest.

**Spec:** `AGENTS.backend.md` (design and rules), `CLAUDE.md` (conventions), `AGENTS.md` (team policy).

This is plan 1 of 4. Later plans, each written when its turn comes: (2) host login and dashboard — events, roles, guests, reply summary; (3) design customization and photo upload; (4) remaining themes and event types.

## Global Constraints

- Request flow is always: API route → validation → auth check → service → repository → database.
- Prisma is imported only in `src/server/repositories/` and `src/server/db.ts`.
- `src/server/` never imports from `src/features/` or `src/components/`; client code never imports from `src/server/` except Zod schemas in `src/server/validation/`.
- Response shape is always `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
- A guest endpoint returns data about one guest only.
- Guest token: 32 random bytes from `crypto.randomBytes`, base64url, 43 characters.
- Prettier: no semicolons, single quotes, trailing commas. `#/` is the alias for `src/`.
- No dependency beyond those named in this plan without asking Gene.
- Never commit, push, merge or rebase. Work on `main`. Gene commits. Each task ends with "stop and report" instead of a commit.
- Never read or print `.env`.
- `index.html` and `agent-setup-bundle/` stay untouched.

## Review Focus

1. A reply message containing HTML (`<script>alert(1)</script>`) is stored and shown as plain text. → Task 9 test.
2. A token that is very long, empty, or has odd characters gets a 404 `NOT_FOUND`, not a 500. → Task 6 test.
3. A request body that is not valid JSON, or has extra fields, gets a 400 `VALIDATION`. → Task 8 test.
4. A reply sent at 11:30 PM Manila time on the reply-by date is accepted; one sent at 12:01 AM the next day is refused. → Task 7 test.
5. Two replies from the same guest leave one row holding the second answer. → Task 7 test.

---

### Task 1: Scaffold the app and tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `vitest.config.ts`, `.prettierrc`, `.env.example`, `tests/smoke.test.ts`

**Interfaces:**
- Produces: scripts `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`); alias `#/*` → `src/*` in both `tsconfig.json` and `vitest.config.ts`.

- [ ] **Step 1:** The repo root is not empty, so scaffold into a temporary folder and move the result up: `npx create-next-app@latest scaffold-tmp --ts --app --src-dir --tailwind --eslint --import-alias "#/*" --use-npm --no-git`, move everything except its `.gitignore` into the root, merge its `.gitignore` lines into the existing one, delete `scaffold-tmp`.
- [ ] **Step 2:** Install `zod`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`; dev: `vitest`, `happy-dom`, `@testing-library/react`, `@testing-library/user-event`, `prettier`.
- [ ] **Step 3:** Write `.prettierrc` (`semi: false`, `singleQuote: true`, `trailingComma: 'all'`), `vitest.config.ts` (alias `#`, environment `node`, include `tests/**/*.test.{ts,tsx}`), and `.env.example` with empty `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] **Step 4:** Write `tests/smoke.test.ts`: `expect(1 + 1).toBe(2)`.
- [ ] **Step 5:** Run `npm run typecheck`, `npm test`, `npm run build`. Expected: all three succeed.
- [ ] **Step 6:** Stop and report.

### Task 2: Errors and response helpers

**Files:**
- Create: `src/server/errors.ts`, `src/server/http.ts`
- Test: `tests/server/http.test.ts`

**Interfaces:**
- Produces:
  - `type ErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'REPLY_CLOSED' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'INTERNAL'`
  - `class AppError extends Error { constructor(code: ErrorCode, message: string) ; readonly code: ErrorCode; readonly status: number }` with statuses 404, 400, 409, 429, 401, 500 in that order.
  - `ok<T>(data: T, status = 200): Response`
  - `handle(fn: () => Promise<Response>): Promise<Response>` — turns `AppError` into its status and body, `ZodError` into 400 `VALIDATION`, anything else into 500 `INTERNAL` with message `'Something went wrong'` (the real error is logged, never returned).

- [ ] **Step 1: Write the failing tests**

```ts
it('ok wraps data', async () => {
  expect(await ok({ a: 1 }).json()).toEqual({ ok: true, data: { a: 1 } })
})
it('handle maps AppError', async () => {
  const res = await handle(async () => { throw new AppError('REPLY_CLOSED', 'Replies are closed') })
  expect(res.status).toBe(409)
  expect(await res.json()).toEqual({ ok: false, error: { code: 'REPLY_CLOSED', message: 'Replies are closed' } })
})
it('handle hides unknown errors', async () => {
  const res = await handle(async () => { throw new Error('db password leaked') })
  expect(res.status).toBe(500)
  expect(JSON.stringify(await res.json())).not.toContain('password')
})
```

- [ ] **Step 2:** Run `npx vitest run tests/server/http.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3:** Implement both files to the signatures above.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 3: Database schema

**Files:**
- Create: `prisma/schema.prisma`, `src/server/db.ts`

**Interfaces:**
- Produces: Prisma models `User`, `Event`, `Role`, `Guest`, `Rsvp`, `Asset` with the fields in `AGENTS.backend.md` section 5, plus:
  - `Event.timezone String @default("Asia/Manila")`
  - `Event.replyBy` and `Event.eventDate` as `@db.Date`
  - enums `EventStatus { draft published }`, `RsvpAnswer { going not_going }`, `AssetKind { background }`
  - `Guest.token @unique`, `Rsvp.guestId @unique`, `onDelete: Cascade` from Event to Role, Guest, Asset and from Guest to Rsvp
  - `createdAt` / `updatedAt` on every model
- Produces: `src/server/db.ts` exporting one shared `prisma` client (reused across hot reloads).

- [ ] **Step 1:** Install `prisma` (dev) and `@prisma/client`; run `npx prisma init` and keep the generator and datasource it writes for the installed version.
- [ ] **Step 2:** Write the models.
- [ ] **Step 3:** Run `npx prisma validate` and `npx prisma generate`. Expected: both succeed.
- [ ] **Step 4:** Only if Gene has filled in `.env`: `npx prisma migrate dev --name init`. Otherwise report that the migration is waiting for the Supabase connection strings.
- [ ] **Step 5:** Stop and report.

### Task 4: Themes, event types and the design resolver

**Files:**
- Create: `src/server/config/themes/types.ts`, `src/server/config/themes/black-and-white.ts`, `garden-botanical.ts`, `bohemian.ts`, `art-deco.ts`, `src/server/config/themes/index.ts`, `src/server/config/event-types.ts`, `src/server/services/design.service.ts`
- Test: `tests/server/design.service.test.ts`

**Interfaces:**
- Produces:

```ts
type Palette = { ground: string; ink: string; inkSoft: string; panel: string; line: string; accent: string; buttonInk: string }
type FontPair = { display: string; body: string }
type Theme = {
  key: string; name: string; category: string; eventTypes: EventTypeKey[]
  palette: Palette; fontPairs: FontPair[]; labelFont: string
  art: 'photo' | 'leaf-arch' | 'orbit-sun' | 'deco-fan'
  panelRadius: number; heroAlign: 'left' | 'center'
  photo: { overlay: number; filter: 'none' | 'grayscale' }
}
type DesignOverrides = { accent?: string; fontPairIndex?: number; backgroundAssetId?: string; overlay?: number }
type ResolvedDesign = Omit<Theme, 'fontPairs' | 'eventTypes'> & { fonts: FontPair; backgroundAssetId: string | null }
type EventTypeKey = 'wedding'
getTheme(key: string): Theme            // throws AppError('NOT_FOUND') for an unknown key
listThemes(eventType: EventTypeKey): Theme[]
resolveDesign(theme: Theme, overrides: DesignOverrides): ResolvedDesign
EVENT_TYPES: Record<EventTypeKey, { name: string; hasRoles: boolean; sections: string[] }>
```

- Theme values (label font for all: `Space Mono`; body font for all: `Space Grotesk`):

| key | display font | ground | ink | inkSoft | panel | line | accent | buttonInk | art | radius | align | photo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `black-and-white` | Bodoni Moda | `#0b0b0b` | `#ffffff` | `#e2e2e2` | `rgba(12,12,12,0.55)` | `rgba(255,255,255,0.45)` | `#ffffff` | `#0b0b0b` | photo | 28 | left | overlay 0.62, grayscale |
| `garden-botanical` | Cormorant Garamond | `#0b1a13` | `#effff3` | `#b9d6c2` | `rgba(10,30,20,0.6)` | `rgba(159,227,176,0.45)` | `#9fe3b0` | `#0b1a13` | leaf-arch | 28 | center | overlay 0.5, none |
| `bohemian` | Italiana | `#ead5ba` | `#3f2114` | `#6a4332` | `rgba(255,250,242,0.62)` | `rgba(63,33,20,0.4)` | `#a4502d` | `#fff7ec` | orbit-sun | 28 | center | overlay 0.3, none |
| `art-deco` | Poiret One | `#0b0c10` | `#f6eed9` | `#cfc6b0` | `rgba(20,20,24,0.7)` | `rgba(217,184,108,0.6)` | `#d9b86c` | `#0b0c10` | deco-fan | 6 | center | overlay 0.6, none |

- [ ] **Step 1: Write the failing tests**

```ts
it('uses the first font pair by default', () => {
  expect(resolveDesign(getTheme('bohemian'), {}).fonts.display).toBe('Italiana')
})
it('applies an accent override and nothing else', () => {
  const d = resolveDesign(getTheme('art-deco'), { accent: '#ff0000' })
  expect(d.palette.accent).toBe('#ff0000')
  expect(d.palette.ground).toBe('#0b0c10')
})
it('ignores a font pair index the theme does not have', () => {
  expect(resolveDesign(getTheme('bohemian'), { fontPairIndex: 9 }).fonts.display).toBe('Italiana')
})
it('clamps overlay to 0..0.9', () => {
  expect(resolveDesign(getTheme('black-and-white'), { overlay: 5 }).photo.overlay).toBe(0.9)
})
it('lists four wedding themes', () => { expect(listThemes('wedding')).toHaveLength(4) })
it('rejects an unknown theme', () => { expect(() => getTheme('nope')).toThrow(AppError) })
```

- [ ] **Step 2:** Run `npx vitest run tests/server/design.service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the files. `EVENT_TYPES.wedding = { name: 'Wedding', hasRoles: true, sections: ['couple', 'ceremony', 'reception', 'attire'] }`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 5: Guest tokens

**Files:**
- Create: `src/server/auth/token.ts`
- Test: `tests/server/token.test.ts`

**Interfaces:**
- Produces: `newGuestToken(): string`, `isTokenShape(value: string): boolean` (exactly 43 characters of `A-Z a-z 0-9 - _`).

- [ ] **Step 1: Write the failing tests**

```ts
it('makes 43-character url-safe tokens', () => {
  expect(newGuestToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
})
it('does not repeat', () => {
  expect(new Set(Array.from({ length: 1000 }, newGuestToken)).size).toBe(1000)
})
it('rejects wrong shapes', () => {
  for (const bad of ['', 'ana-reyes', 'a'.repeat(44), 'a'.repeat(42) + '!', 'a'.repeat(5000)])
    expect(isTokenShape(bad)).toBe(false)
})
```

- [ ] **Step 2:** Run `npx vitest run tests/server/token.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement with `crypto.randomBytes(32).toString('base64url')`.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 6: Read one invitation

**Files:**
- Create: `src/server/repositories/invite.repository.ts`, `src/server/services/invite.service.ts`
- Test: `tests/server/invite.service.test.ts`, `tests/server/fakes.ts`

**Interfaces:**
- Consumes: `isTokenShape`, `getTheme`, `resolveDesign`, `AppError`.
- Produces:

```ts
type InviteRecord = {
  guest: { id: string; name: string; personalNote: string | null }
  role: { title: string; askText: string; note: string; attire: string; color: string } | null
  rsvp: { answer: 'going' | 'not_going'; message: string; updatedAt: Date } | null
  event: { id: string; type: string; title: string; status: 'draft' | 'published'; eventDate: Date; replyBy: Date; timezone: string; details: unknown; themeKey: string; design: unknown }
}
interface InviteRepository {
  findByToken(token: string): Promise<InviteRecord | null>
  upsertRsvp(guestId: string, answer: 'going' | 'not_going', message: string): Promise<{ answer: 'going' | 'not_going'; message: string; updatedAt: Date }>
}
type InviteView = {
  guestName: string
  role: InviteRecord['role']
  note: string | null                  // guest.personalNote, else role.note, else null
  event: { type: string; title: string; eventDate: string; replyBy: string; details: unknown }
  design: ResolvedDesign
  reply: { answer: 'going' | 'not_going'; message: string } | null
  replyOpen: boolean
}
getInvite(token: string, repo: InviteRepository, now: Date): Promise<InviteView>
prismaInviteRepository: InviteRepository
fakeInviteRepository(records: Record<string, InviteRecord>): InviteRepository   // in tests/server/fakes.ts
isReplyOpen(replyBy: Date, timezone: string, now: Date): boolean                // exported from invite.service.ts
```

- Rules: wrong token shape, unknown token and unpublished event all throw `AppError('NOT_FOUND', 'Invitation not found')`, with the same message for all three. `isReplyOpen` is true until the end of the `replyBy` calendar day in the event's timezone.

- [ ] **Step 1: Write the failing tests** (fake repo holds one published event with guest token `T1` and one draft event with guest token `T2`, both valid shapes)

```ts
it('returns the guest invitation', async () => {
  const v = await getInvite(T1, repo, now)
  expect(v.guestName).toBe('Ana Reyes')
  expect(v.design.fonts.display).toBe('Bodoni Moda')
})
it('prefers the personal note over the role note', async () => {
  expect((await getInvite(T1, repo, now)).note).toBe('I cannot do it without you, Ana.')
})
it('exposes nothing about other guests or internals', async () => {
  const json = JSON.stringify(await getInvite(T1, repo, now))
  for (const leak of ['Bea Cruz', T2, 'ownerId', '"id"']) expect(json).not.toContain(leak)
})
it.each(['', 'ana-reyes', 'a'.repeat(5000), T2, UNKNOWN_VALID_SHAPE])('404s for %s', async (t) => {
  await expect(getInvite(t, repo, now)).rejects.toMatchObject({ code: 'NOT_FOUND' })
})
```

- [ ] **Step 2:** Run `npx vitest run tests/server/invite.service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the service, the fake, and `prismaInviteRepository` (one query with `include` for event, role and rsvp).
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 7: Save a reply

**Files:**
- Create: `src/server/validation/rsvp.schema.ts`, `src/server/services/rsvp.service.ts`
- Test: `tests/server/rsvp.service.test.ts`

**Interfaces:**
- Consumes: `InviteRepository`, `isReplyOpen`, `isTokenShape`, `AppError`.
- Produces:
  - `rsvpSchema`: strict object, `answer: 'going' | 'not_going'`, `message`: string, trimmed, max 300, default `''`. `type RsvpInput = z.infer<typeof rsvpSchema>`.
  - `saveRsvp(token: string, input: RsvpInput, repo: InviteRepository, now: Date): Promise<{ answer: 'going' | 'not_going'; message: string }>`
- Rules: same three `NOT_FOUND` cases as Task 6; after the reply-by day throws `AppError('REPLY_CLOSED', 'Replies are closed for this event')`.

- [ ] **Step 1: Write the failing tests** (event `replyBy` 2027-03-31, timezone `Asia/Manila`)

```ts
it('saves a reply', async () => {
  expect(await saveRsvp(T1, { answer: 'going', message: 'See you!' }, repo, now))
    .toEqual({ answer: 'going', message: 'See you!' })
})
it('a second reply replaces the first', async () => {
  await saveRsvp(T1, { answer: 'going', message: '' }, repo, now)
  await saveRsvp(T1, { answer: 'not_going', message: 'Sorry' }, repo, now)
  expect((await getInvite(T1, repo, now)).reply).toEqual({ answer: 'not_going', message: 'Sorry' })
})
it('accepts 11:30 PM Manila on the reply-by date', async () => {
  await expect(saveRsvp(T1, going, repo, new Date('2027-03-31T15:30:00Z'))).resolves.toBeTruthy()
})
it('refuses 12:01 AM Manila the next day', async () => {
  await expect(saveRsvp(T1, going, repo, new Date('2027-03-31T16:01:00Z'))).rejects.toMatchObject({ code: 'REPLY_CLOSED' })
})
it('schema rejects extra fields, long messages and other answers', () => {
  expect(rsvpSchema.safeParse({ answer: 'going', guestId: 'x' }).success).toBe(false)
  expect(rsvpSchema.safeParse({ answer: 'going', message: 'a'.repeat(301) }).success).toBe(false)
  expect(rsvpSchema.safeParse({ answer: 'maybe' }).success).toBe(false)
})
```

- [ ] **Step 2:** Run `npx vitest run tests/server/rsvp.service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 8: Guest API routes and rate limit

**Files:**
- Create: `src/server/auth/rate-limit.ts`, `src/app/api/invites/[token]/route.ts`, `src/app/api/invites/[token]/rsvp/route.ts`
- Test: `tests/server/rate-limit.test.ts`, `tests/api/invites.test.ts`

**Interfaces:**
- Consumes: `handle`, `ok`, `getInvite`, `saveRsvp`, `rsvpSchema`, `prismaInviteRepository`.
- Produces:
  - `createRateLimiter(opts: { limit: number; windowMs: number }): { check(key: string, now?: number): boolean }` — in memory, fixed window. It is per server instance, which is accepted for version 1.
  - `GET /api/invites/[token]` → `InviteView`; limit 30 per minute per IP.
  - `PUT /api/invites/[token]/rsvp` → saved reply; limits 30 per minute per IP and 10 per minute per token. Over the limit: `AppError('RATE_LIMITED', 'Too many requests. Try again in a minute.')`.
  - Each route file exports a `makeHandler(repo: InviteRepository)` used by tests and a default-wired `GET` / `PUT`.
  - In the installed Next.js version `params` is a Promise; await it. IP comes from the first entry of `x-forwarded-for`, else `'unknown'`.

- [ ] **Step 1: Write the failing tests**

```ts
it('allows up to the limit, then refuses, then resets', () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 })
  expect([rl.check('a', 0), rl.check('a', 1), rl.check('a', 2)]).toEqual([true, true, false])
  expect(rl.check('a', 1001)).toBe(true)
  expect(rl.check('b', 2)).toBe(true)
})
it('GET returns the envelope', async () => {
  const res = await GET(req('GET'), ctx(T1))
  expect(res.status).toBe(200)
  expect((await res.json()).data.guestName).toBe('Ana Reyes')
})
it('GET unknown token is 404', async () => {
  expect((await GET(req('GET'), ctx(UNKNOWN_VALID_SHAPE))).status).toBe(404)
})
it('PUT with broken JSON is 400 VALIDATION', async () => {
  const res = await PUT(req('PUT', '{not json'), ctx(T1))
  expect(res.status).toBe(400)
  expect((await res.json()).error.code).toBe('VALIDATION')
})
it('PUT with an extra field is 400', async () => {
  expect((await PUT(req('PUT', JSON.stringify({ answer: 'going', role: 'x' })), ctx(T1))).status).toBe(400)
})
it('the 11th PUT in a minute for one token is 429', async () => {
  for (let i = 0; i < 10; i++) await PUT(req('PUT', GOING), ctx(T1))
  expect((await PUT(req('PUT', GOING), ctx(T1))).status).toBe(429)
})
```

- [ ] **Step 2:** Run `npx vitest run tests/server/rate-limit.test.ts tests/api/invites.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run again. Expected: PASS.
- [ ] **Step 5:** Stop and report.

### Task 9: Guest invitation page

**Files:**
- Create: `src/lib/api.ts`, `src/app/providers.tsx`, `src/app/i/[token]/page.tsx`, `src/app/i/[token]/not-found.tsx`, `src/features/invite/invite.service.ts`, `invite.query.ts`, `invite.types.ts`, `index.ts`, `src/features/invite/components/InviteScreen.tsx`, `ThemeArt.tsx`, `RsvpForm.tsx`
- Modify: `src/app/layout.tsx` (wrap in providers, load the theme fonts)
- Test: `tests/features/rsvp-form.test.tsx` (file header `// @vitest-environment happy-dom`)

**Interfaces:**
- Consumes: `getInvite` (called directly by the server page), `PUT /api/invites/[token]/rsvp`, `InviteView`, `rsvpSchema`.
- Produces:
  - `api<T>(path: string, init?: RequestInit): Promise<T>` — unwraps the envelope, throws `ApiError { code, message }` on `ok: false`.
  - `INVITE_SERVICE.SAVE_RSVP(token, input)`, `INVITE_QUERY_KEYS`, `useSaveRsvpMutation(token)`.
  - `<InviteScreen invite={InviteView} token={string} />` — sets CSS variables from `invite.design` on its root (`--ground`, `--ink`, `--ink-soft`, `--panel`, `--line`, `--accent`, `--button-ink`, `--font-display`, `--font-body`, `--font-label`, `--panel-radius`); layout: top bar, large names, glass panel at the bottom holding guest name, role, ask text, detail pills and `<RsvpForm>`.
  - `<ThemeArt art={ResolvedDesign['art']} />` — the four background drawings as inline SVG, `aria-hidden`.
  - `<RsvpForm token initialReply replyOpen />` — two answer buttons with `aria-pressed`, a message field limited to 300 characters, a send button disabled until an answer is chosen; label "Update my reply" when a reply exists; when `replyOpen` is false it shows "Replies are closed" and no buttons.
- User text (names, notes, messages) is rendered as text only. `dangerouslySetInnerHTML` is not used anywhere in this task.

- [ ] **Step 1: Write the failing tests**

```tsx
it('send is disabled until an answer is chosen', async () => {
  render(<RsvpForm token={T1} initialReply={null} replyOpen />, { wrapper })
  expect(screen.getByRole('button', { name: /send my reply/i })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: /i'll be there/i }))
  expect(screen.getByRole('button', { name: /send my reply/i })).toBeEnabled()
})
it('shows an existing reply and the update label', () => {
  render(<RsvpForm token={T1} initialReply={{ answer: 'not_going', message: 'Sorry' }} replyOpen />, { wrapper })
  expect(screen.getByRole('button', { name: /i can't/i })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('button', { name: /update my reply/i })).toBeInTheDocument()
})
it('shows closed state', () => {
  render(<RsvpForm token={T1} initialReply={null} replyOpen={false} />, { wrapper })
  expect(screen.getByText(/replies are closed/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /send/i })).toBeNull()
})
it('renders a message with HTML as text', () => {
  render(<RsvpForm token={T1} initialReply={{ answer: 'going', message: '<script>alert(1)</script>' }} replyOpen />, { wrapper })
  expect(screen.getByRole('textbox')).toHaveValue('<script>alert(1)</script>')
  expect(document.querySelector('script')).toBeNull()
})
```

- [ ] **Step 2:** Run `npx vitest run tests/features/rsvp-form.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement. The page is a server component: it awaits `params`, calls `getInvite(token, prismaInviteRepository, new Date())`, and calls `notFound()` on `NOT_FOUND`.
- [ ] **Step 4:** Run `npm test`, `npm run typecheck`, `npm run build`. Expected: all pass.
- [ ] **Step 5:** Stop and report.

### Task 10: Sample data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `"seed": "tsx prisma/seed.ts"`, dev dependency `tsx`)

**Interfaces:**
- Consumes: `prisma`, `newGuestToken`.
- Produces: one host user, one published wedding (`themeKey: 'black-and-white'`, `eventDate` 2027-06-12, `replyBy` 2027-03-31), roles Maid of Honor, Best Man and Bridesmaid, three guests. Prints one `/i/<token>` link per guest. Running it twice does not create duplicates (it deletes the sample event first, found by a fixed title `'Sample wedding'`).

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** Needs Gene's `.env`. Run `npm run seed`, then `npm run dev`, open one printed link. Expected: the themed invitation shows; sending a reply and reloading shows "Update my reply" with the saved answer; changing the last character of the token shows the not-found page.
- [ ] **Step 3:** Stop and report.
