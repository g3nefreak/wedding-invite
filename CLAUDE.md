# CLAUDE.md

## Order of priority
1. AGENTS.md, AGENTS.backend.md and the team's current setup in .codex/ (imported
   below). These are the project's rules; follow them exactly.
2. How the existing code is written. Match its patterns, naming, and structure.
   Do not introduce a new style, library, or pattern.
3. My personal preferences (last section). They add to the rules above and
   never override them.

If something here seems to conflict with AGENTS.md or the code, follow
AGENTS.md or the code and tell me about the conflict.

@AGENTS.md
@AGENTS.backend.md
@.codex/context/structure.md
@.codex/context/architecture.md

## Using the Codex setup
- In AGENTS.md, "Codex" and "parent session" mean you. Its natural-language
  commands (e.g. `hello architect, map project`, `quick check`) apply to you too.
- When a task fits a role (.codex/agents/*.toml), read that file and stay inside
  its write scope. The reviewer is read-only, and only tests go in test files.
- AGENTS.backend.md is the backend design: stack, folders, tables, API, security
  rules. The architect keeps .codex/context/architecture.md consistent with it.
- .codex/context/ starts empty. Until `Bootstrap the project context` has been
  run, structure.md and architecture.md do not exist; rely on AGENTS.backend.md.
- Read these only when relevant: .codex/context/objectives.md, process-flow.md,
  timeline.md.
- Past plans in .codex/plans/ show earlier decisions. Check them when a task
  touches the same area, and trust the code over them.
- Context files have an `Updated:` date and can lag behind the code. Check the
  source before relying on them.
- For `/plan` or any request for a plan, follow
  .agents/skills/implementation-plan/SKILL.md. Where it names Codex's
  `request_user_input_async`, use AskUserQuestion instead. Plans go in
  .codex/plans/YYYY-MM-DD-<slug>.md; write one only when I ask.

## Interface skills
- For any UI work (themes, guest pages, dashboard), follow the matching skill in
  .agents/skills/ before writing or changing the interface: better-accessibility,
  better-layout, better-writing, better-typography, better-colors, better-ui,
  better-motion. Write fixes in this project's idiom (Tailwind v4 + shadcn).
- Before a theme or screen is called done, run the better-interface review on it
  and report the findings. Reviews are read-only; fix only what I approve.
- build-design, state-machine, variant and break are there for when I ask for them.
- AGENTS.md and the conventions below win over these skills if they conflict.

## How the project is built
- Stack: Next.js (App Router) + TypeScript, one repo for frontend and backend.
  Frontend: Tailwind v4 + shadcn, TanStack Query, zod + react-hook-form.
  Backend: Next.js route handlers, Prisma on Supabase Postgres, Supabase Auth
  and Storage. Full backend rules are in AGENTS.backend.md.
- Commands (once the app is scaffolded): `npm run dev | test | typecheck | lint | build`,
  `npx prisma migrate dev` for schema changes.
- Tests: Vitest in tests/<area>/. Service functions are tested without HTTP.
- The repo currently holds only the old single-page version (index.html) and
  agent-setup-bundle/. index.html is NOT a design reference: themes are designed
  fresh from the theme list in AGENTS.backend.md. Do not copy its look.
- Never read or print .env.

## Code conventions
Before writing anything, open a similar existing module and follow it.
- Prettier: no semicolons, single quotes, trailing commas. TypeScript is strict
  with no unused variables; use `import type` for types.
- Import from `src/` with the `#/` alias, and from a feature's `index.ts` barrel
  when outside that feature.
- Three layers, kept apart:
  - `src/app/` holds only screens and API routes. Pages are thin: they call a
    feature's hook and render its components. API routes are thin: validate,
    call one service function, return JSON.
  - `src/features/<module>/` holds what a frontend module is:
    `<module>.service.ts` (calls our own `/api`), `<module>.query.ts` (TanStack
    Query hooks), `.schema.ts` (zod), `.types.ts`, `.config.ts`, `.helpers.ts`,
    and `components/`. An `index.ts` barrel re-exports it.
  - `src/server/` holds the backend (services, repositories, validation, auth,
    storage, config). It never imports from `features/` or `components/`, and
    client code never imports from `server/`.
- Frontend services are a const object with UPPER_SNAKE_CASE methods that use the
  shared `api` helper from `#/lib/api`. Queries use a `<FEATURE>_QUERY_KEYS`
  object, `useXQuery` / `useXMutation` hooks, and invalidate related keys after
  mutations.
- Zod schemas for request bodies live in `src/server/validation/` and are reused
  by the frontend forms, so both sides check the same rules.
- Forms use react-hook-form with a zod schema. Reuse components from
  `#/components` and `src/components/ui` before creating new ones.
- Components are PascalCase, hooks are kebab-case files.

## Git (matches AGENTS.md rule 3)
- Work directly on `main`. Do not create task branches unless I ask.
- Never commit, push, merge, or rebase without my explicit permission.

## My personal preferences (additions only)
- Ask me before changing existing code, even for changes the AGENTS.md
  thresholds would allow.
- Keep code simple and short, with clear names for variables and functions.
- Add human-sounding comments that explain why, not just what.
- Keep changes secure, scalable, and maintainable.
