# Host Login and Dashboard Implementation Plan

Plan 2 of 4. Agreed with Gene on 2026-11-24.

**Goal:** A host logs in, creates an event, manages roles and guests, copies each
guest's link, publishes, and sees who replied.

**Decisions (Gene):**
- Login is email + password through Supabase Auth.
- No public sign-up. Gene creates each host account in the Supabase dashboard.
- Guests are added one at a time or by pasting a list of names, one per line.
- New packages approved: `@supabase/supabase-js`, `@supabase/ssr`.

**Not in this plan:** design customization and photo upload (plan 3), password
reset by email, sending invitations by email or SMS.

**Rules (from AGENTS.backend.md):** route → validation → auth check → service →
repository. Every host endpoint checks `event.ownerId === session user id` in the
service; a wrong owner gets 404, not 403. Same response envelope as plan 1.
Never commit; Gene commits.

## Stages

- [x] **1. Login.** `src/proxy.ts` guards `/host`; `/login` page; `POST /api/auth/login`
  (10 tries a minute per address) and `/api/auth/logout`; `getSessionUser` /
  `requireSessionUser`; the host's `User` row is created on first visit to `/host`.
- [x] **2. Events.** `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/[eventId]`,
  `POST /api/events/[eventId]/publish`, `GET /api/themes`. Dashboard list, create
  form, event page with details form. Delete asks for confirmation.
- [x] **3. Roles.** `GET/POST /api/events/[eventId]/roles`, `PATCH/DELETE .../[roleId]`.
- [x] **4. Guests.** `GET/POST /api/events/[eventId]/guests` (single or pasted list,
  each with a fresh token), `PATCH/DELETE .../[guestId]`, copy-link button.
- [x] **5. Replies.** Changed with Gene on 2026-11-24: the counts are the reply
  filter buttons on the Guests tab (All, Going, Not going, No reply), worked
  out from the guest list, so no separate summary endpoint was built. The same
  change made the guest list compact rows with search and a role filter, and
  split the event page into tabs: Guests, Roles, Details, Settings.
- [ ] **6. Review.** Run the `better-interface` review on the host screens; full test,
  typecheck, lint and build.

Each stage: tests first for every service function, including the "not the
owner" case, then the code, then stop and report.
