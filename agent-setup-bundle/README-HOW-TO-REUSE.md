# Reusing the faculty-evaluation-frontend agent setup in a new project

Extracted 2026-11-05 from `faculty-evaluation-frontend` (branch `gene/cashier`).
Nothing in the source repo was modified.

## What is in this bundle

```
1-portable/                      drop these into the new repo root as-is
  AGENTS.md                      the Codex "adaptive agent team" policy (stack-agnostic)
  CLAUDE.md                      the original, verbatim
  CLAUDE.template.md             same file with the project-specific lines marked [EDIT]
  .codex/agents/*.toml           the six role definitions (architect, system_analyst,
                                 developer, bug_fixer, tester, code_reviewer)
  .codex/context/                EMPTY on purpose - the architect/analyst fill it in
  .codex/tmp/                    tester scratch; must be gitignored
  .agents/skills/implementation-plan/SKILL.md   the /plan skill
  .agents/skills/shadcn/         the shadcn skill (only if the new project uses shadcn)
  skills-lock.json               lock file for the shadcn skill
  gitignore-snippet.txt          the one line to add to .gitignore

2-reference-faculty-evaluation/  project-specific; read for examples, do not copy blindly
  .codex/context/*.md            what a filled-in context looks like (structure,
                                 architecture, process-flow, objectives, timeline)
  .codex/plans/*.md              two example plans in the team's plan format
  src-readmes/                   per-module READMEs (auth, datatable, zod helpers, tests)
  README.original.md             the repo README, which includes the "Adaptive Codex team"
                                 install note
```

## How the pieces fit together

CLAUDE.md is the entry point for Claude Code. It does three things: sets a priority
order (AGENTS.md and .codex first, existing code second, personal preferences last),
pulls in AGENTS.md plus the two architect-owned context files with `@` imports so they
load automatically, and translates Codex-specific terms ("parent session", the
`request_user_input_async` tool) into their Claude Code equivalents.

AGENTS.md is the actual team policy and is stack-agnostic. It defines the six roles,
the LIGHT/FOCUSED/DEEP effort modes, the lead-selection table, the approval threshold
(more than 3 files or ~50 lines needs a plan and explicit approval), the rule that
agents never commit or push, and the natural-language commands (`hello architect, map
project`, `quick check`, `deep check`, `status`, `brainstorm`, `collab`, `Bootstrap
the project context`).

.codex/agents/*.toml are the per-role prompts. Each one restates its write scope:
architect may only write structure/architecture/process-flow.md, system_analyst only
objectives/timeline.md, tester only test files and .codex/tmp, code_reviewer nothing,
developer and bug_fixer only application code. These are behavioral limits, not
sandbox enforcement.

.codex/context/ is the persistent memory. Each file carries an `Updated:` date and
evidence paths. CLAUDE.md tells Claude to treat them as possibly stale and to check
the code before trusting them.

.codex/plans/ holds dated implementation plans written via the implementation-plan
skill, only when the user asks for one.

## Setup steps for the new repo

1. Copy everything inside `1-portable/` to the new repo root (including the hidden
   `.codex` and `.agents` folders).
2. Fill in `CLAUDE.template.md` (stack, commands, test location, branch naming,
   example feature path), then rename it to `CLAUDE.md`, replacing the verbatim copy.
3. Append `.codex/tmp/` to the new repo's `.gitignore`.
4. Open AGENTS.md and look at the `<!-- antislop:start -->` block at the bottom. It
   points at `C:\Users\rabie\.agents\skills\antislop*` - a teammate's machine, not
   yours. Either delete that block, or install the antislop skills locally and update
   the paths.
5. If the new project is not using shadcn, delete `.agents/skills/shadcn/` and
   `skills-lock.json`.
6. In Claude Code (or Codex) run `Bootstrap the project context`. The architect will
   generate structure.md, architecture.md and process-flow.md from the real code; the
   analyst will draft objectives.md and timeline.md from whatever requirements you
   give it. Review and commit those yourself.
7. Optional: use the files in `2-reference-faculty-evaluation/.codex/context/` as a
   style reference when reviewing what the bootstrap produces. They show the expected
   level of detail, the `Updated:` and `Verification status:` lines, and the evidence
   paths at the bottom of each file.

## The code structure the conventions assume (features vs pages)

The CLAUDE.md conventions assume the same layout as faculty-evaluation-frontend. If
the new project follows it, the agents will already know where things go.

`src/features/<area>/<module>/` holds everything a module *is*, with no knowledge of
what URL it is shown at: `<module>.service.ts` / `<module>.ts` (axios service +
TanStack Query hooks), `.types.ts`, `.schema.ts` (zod), `.access.ts` (role/scope
rules), `.config.tsx` (DataTable columns, row actions, filter defaults), `.helpers.ts`,
a `components/` folder for modals, filters and tables, and `<module>.routes.tsx`. An
`index.ts` barrel re-exports it all so other features import from one path.

`src/pages/<area>/<module>/` holds only the screens: thin components mounted at a URL
that call the feature's query hook, render the feature's filter and table, open the
feature's modals, and check the feature's access rules. Page-level state only (which
modal is open, which row is selected).

Routes live in the feature, not in pages: `<module>.routes.tsx` imports the page
components and declares the URL tree with `defineRoutes`, attaching `access` and
`meta` (title, icon, header text, `sidebar: false`). Those roll up one level at a time
(`curriculumRoutes` -> `registrar.routes.tsx` -> `src/routes/index.tsx`). The sidebar
is derived from route `meta`, so adding a route with a title and icon is what adds a
menu entry. `src/routes/paths.ts` holds absolute URL constants; `src/routes/
navigation.ts` derives typed paths from the route tree.

The practical rule for a new feature: hook, service, schema, config and modal go in
the feature; the one screen goes in pages; register the screen in the feature's
routes file; sidebar, guards and typed paths pick it up automatically.
