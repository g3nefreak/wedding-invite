# Customize Screen Implementation Plan

Plan 3 of 4. Agreed with Gene on 2026-11-24.

**Goal:** A host changes how their invitation looks: theme, accent color, font
pair and their own background photo, with a live preview. Guests see it once
the host saves.

**Decisions (Gene):**
- Accent color: ready-made swatches per theme plus a custom picker; the app
  warns when button text would be hard to read on the picked color.
- Fonts: about three curated pairs per theme.
- Photo: resized and checked on the server. New package approved: `sharp`.

**Not in this plan:** drag-and-drop layout, custom text positions, a photo
gallery, a cropping tool. One background photo per event.

**Rules (from AGENTS.backend.md):** only the owner may change the design or
upload; only the allowed design values are stored, never raw CSS or HTML;
uploads are images only (JPEG, PNG, WebP), checked by content, 8 MB at most,
resized to at most 2000 px wide, stored under a path with the event id.
Never commit; Gene commits.

## Stages

- [x] **1. Design tab.** `PATCH /api/events/[eventId]/design` (theme, accent,
  font pair, overlay; `null` resets a choice; switching theme clears the old
  theme's color and font choices). Each theme has four accent swatches and
  three font pairs. `resolveDesign` moved to `src/lib/` so the browser preview
  and the guest page give the same result. Design tab with live preview; the
  theme picker moved here from Details.
- [x] **2. Background photo.** Code built; waiting on Gene's Supabase setup
  (public bucket `event-photos`, `SUPABASE_SECRET_KEY` in `.env` and Vercel)
  before a real upload has been tried. `POST` and `DELETE
  /api/events/[eventId]/assets`; `sharp` checks the file by content, resizes to
  2000 px wide and stores WebP under `<eventId>/<random>.webp`; replacing or
  removing deletes the old file. Photos over 3.5 MB are shrunk in the browser
  first because Vercel refuses request bodies over about 4.5 MB. The overlay
  slider is on the Design tab; the invitation draws the photo instead of the
  theme's line art.
- [ ] **3. Review.** `better-interface` review of the Design tab; full test,
  typecheck, lint and build.
