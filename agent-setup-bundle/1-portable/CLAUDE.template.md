# CLAUDE.md

<!--
  Template adapted from faculty-evaluation-frontend/CLAUDE.md.
  Everything marked [EDIT] is project-specific — replace it for the new repo.
  Everything else is the reusable "Codex team" wiring and can stay as-is.
  Rename this file to CLAUDE.md once filled in (delete the original CLAUDE.md
  that was copied alongside it, or keep it as a reference).
-->

## Order of priority
1. AGENTS.md and the team's current setup in .codex/ (imported below). These are
   the project's rules; follow them exactly.
2. How the existing code is written. Match its patterns, naming, and structure.
   Do not introduce a new style, library, or pattern.
3. My personal preferences (last section). They add to the rules above and
   never override them.

If something here seems to conflict with AGENTS.md or the code, follow
AGENTS.md or the code and tell me about the conflict.

@AGENTS.md
@.codex/context/structure.md
@.codex/context/architecture.md

## Using the Codex setup
- In AGENTS.md, "Codex" and "parent session" mean you. Its natural-language
  commands (e.g. `hello architect, map project`, `quick check`) apply to you too.
- When a task fits a role (.codex/agents/*.toml), read that file and stay inside
  its write scope. The reviewer is read-only, and only tests go in test files.
- Read these only when relevant: .codex/context/objectives.md, process-flow.md,
  timeline.md. [EDIT: add any src/**/README.md files the new project has]
- Past plans in .codex/plans/ show earlier decisions. Check them when a task
  touches the same area, and trust the code over them.
- Context files have an `Updated:` date and can lag behind the code. Check the
  source before relying on them.
- For `/plan` or any request for a plan, follow
  .agents/skills/implementation-plan/SKILL.md. Where it names Codex's
  `request_user_input_async`, use AskUserQuestion instead. The team keeps plans in
  .codex/plans/YYYY-MM-DD-<slug>.md; write one only when I ask.

## How the project is built
- [EDIT] Stack: React 19 + TypeScript + Vite, Tailwind v4 + shadcn, React Router,
  TanStack Query/Table, Zustand, axios, zod + react-hook-form.
- [EDIT] Commands: `npm run dev | test | typecheck | lint | check | build`.
- [EDIT] Tests: Vitest + happy-dom in src/tests/<area>/.
- The context files report existing failures (type errors, a few failing
  tests). Report them separately and don't fix them unless asked.
- Never read or print .env.

## Code conventions (copy the existing code)
Before writing anything, open a similar existing feature (for example
[EDIT: src/features/<some-feature>/]) and follow it.
- Prettier: no semicolons, single quotes, trailing commas. TypeScript is strict
  with no unused variables; use `import type` for types.
- Import from `src/` with the `#/` alias, and from a feature's `index.ts` barrel
  when outside that feature.
- Feature files are named `<feature>.<role>.ts` (`.routes.tsx`, `.service.ts`,
  `.query.ts`, `.schema.ts`, `.types.ts`, `.config.ts`, `.helpers.ts`). Hooks are
  kebab-case, components are PascalCase in `components/`. Pages are named
  exports in `src/pages/`. Route paths come from `src/routes/paths.ts`.
- Services are a const object with UPPER_SNAKE_CASE methods that use the shared
  `api` from `#/lib/axios`. Queries use a `<FEATURE>_QUERY_KEYS` object, `useXQuery`
  / `useXMutation` hooks, and invalidate related keys after mutations.
- Forms use react-hook-form with a zod schema. Reuse components from
  `#/components` and `src/components/ui` before creating new ones.

## Git (matches AGENTS.md rule 3)
- [EDIT] Branch from `dev` as `<yourname>/<task>`. Open pull requests into `dev`.
- Never commit, push, merge, or rebase without my explicit permission.

## My personal preferences (additions only)
- Ask me before changing existing code, even for changes the AGENTS.md
  thresholds would allow.
- Keep code simple and short, with clear names for variables and functions.
- Add human-sounding comments that explain why, not just what.
- Keep changes secure, scalable, and maintainable.
