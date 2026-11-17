# Objectives

Updated: 2026-10-30

## Current authorized maintenance

- Migrate application schema construction to `#/helpers/zod` where its helpers preserve current behavior. Native Zod composition and type/integration uses may remain where the helper package has no equivalent.
- Require user-group access to include either a selected scope or All Scopes before saving. Every selected scope still needs a campus assignment or All Campuses. Super Admin remains the global-access exception. Do not change the UI appearance.
- These changes are present in the current workspace and remain uncommitted; they are not recorded as shipped.

Evidence: user requests dated 2026-10-30; `src/helpers/zod/README.md`; `src/features/administration/access-control/access-control.helpers.ts`.

## Approved scope

Prepare the existing faculty evaluation client for additional school management modules by grouping routes, sidebar navigation, and feature folders. The user approved implementation on 2026-10-27.

- Academic contains Faculty Evaluation (click opens a menu to its right) and a direct Students link.
- Faculty Evaluation contains Evaluation Reports, Faculty, and Classes. Their canonical browser URLs start with `/academic/evaluation/`; the visible module label remains Faculty Evaluation.
- Administration contains direct Audit Logs and Users links.
- The menu must stay within the viewport on phones and preserve the current sidebar visual language, permission filtering, active states, collapsed behavior, and keyboard interaction.
- Do not add demonstration modules in the routing migration. Grade Encoding is now a separately requested real feature; see its planning scope below. Transcript of Records remains out of scope.
- Recreate route composition and update internal destinations. Do not add compatibility redirects for old module URLs; the user explicitly rejected `legacyModuleRedirects`.
- Keep other URLs unchanged, including Profile, password changes, the student `/professors` area, Students, Audit Logs, and Users.

## Approved feature ownership

| Existing `src/features/` directory | Destination under `src/features/` |
| --- | --- |
| `evaluation` | `academic/evaluation/reports` |
| `faculty` | `academic/evaluation/faculty` |
| `classes` | `academic/evaluation/classes` |
| `students` | `academic/students` |
| `audit-logs` | `administration/audit-logs` |
| `users` | `administration/users` |

Keep `auth`, `login`, `shared`, and `student-evaluation` global. Page components remain in `src/pages/`. Preserve existing exports, API contracts, query/cache ownership, authentication handling, and access rules. Apply the user's antislop preference during planning and implementation.

## Acceptance criteria

1. Authorized users can reach the existing Reports, Faculty, and Classes pages and their child pages through the new module URLs and flyout.
2. All internal destinations for those pages use the new prefix; old URLs are not deliberately redirected.
3. Separate links and account/student routes retain their behavior and URLs.
4. Feature consumers resolve after the folder moves; no placeholder features or dependencies are introduced.
5. Relevant tests, type checking, lint, formatting, build, and available manual navigation checks are reported with actual outcomes.

Evidence: approved conversation plan and follow-up decisions; implementation is complete in `src/features/`, `src/routes/`, and `src/components/Sidebar.tsx`. The coordinating agent reported 16 passing targeted regression tests and a passing production build. Review found no introduced defects. Existing repository check failures are recorded in `timeline.md`; live mobile and collapsed-sidebar geometry remain unverified because no browser was available.

## Grade Encoding: approved scope and current status

The user requested a real Grade Encoding feature after the routing migration and approved the full implementation plan. Source implementation is complete. Contract prerequisites below are resolved decisions and evidence, not outstanding blockers. See `timeline.md` for the latest validation and remaining manual checks.

- Add Grade Encoding as a direct link under Academic.
- Use three separate pages: Faculty, faculty subjects/sections, and a section's students DataTable.
- The first page reuses the faculty directory's campus, college, and search filters. Do not exclude faculty by academic term or require grade-sheet aggregation; academic year and term context applies when opening Subjects.
- Administrators can browse all faculty; faculty encode grades for their own assignments. Verify actual authorization contracts before implementation.
- Start filtering by academic year and term; support other filters where the actual contract supports them.
- Grade entry uses a text input restricted to prefixes/codes in the provided grade-value options; invalid text must not update the registered grade. Color failing grades red and INC/UD orange.
- Keep local drafts with Save and Reset actions.
- Faculty can select only students whose grades are already saved and who are not yet posted. Post selected enrollment IDs to `/grading/my-classes/{offeringId}/post` (1-300 IDs); posted rows lock while unposted rows remain editable. This supersedes the earlier whole-class-only posting rule.
- Include unsaved-change warnings, a count, and required reasons when unlocking grades, as accepted by the user.
- Include all roles returned by the API, preserving backend role codes rather than restricting `AuthRoleCode` to the original three. Role names, IDs, and selectable options come from the roles endpoint.
- Include faculty login/session support: faculty can now log in, and the contract links their faculty identity through `user.faculty`. Recognize `FACULTY` as a known capability when returned; unknown roles receive no automatic permission grants.

Approved plan: use Grade Encoding as the faculty default destination while preserving existing student and staff destinations.

### Approved selective posting and grade-entry update

The user approved the selective-posting implementation on 2026-10-28 and clarified that a student becomes selectable only after the grade is saved. Use the API response's per-student posting state; post only selected enrollment IDs and retain editability for unposted students. The API contract and implementation scope are recorded in `.codex/plans/2026-10-28-selective-grade-posting.md`.

Grade entry should be a fast text input constrained to valid grade-code prefixes from the provided grade values. Only an exact valid code updates the grade ID; invalid keystrokes/text must not register. Display failing grades in red and INC/UD in orange. Implementation is complete. Scoped ESLint and Prettier pass; typecheck still fails with baseline diagnostics and existing grade-post tests that use the old POST signature. No tests were edited or run.

### Approved grade monitoring unlock/relock and grade-code blur behavior

The user approved the Grade Monitoring controls and grade-code blur shortcut on 2026-10-28. Only ADMIN/SUPER_ADMIN can unlock or relock sheets. Unlock uses `POST /grading/sheets/{id}/unlock` with a required reason (maximum 255 characters) and optional integer `hours` from 1 to 168, default 48. Unlock is available for submitted sheets or draft sheets with posted students. Admins can select posted students to unpost by including `enrollment_ids` with the reason and hours in the unlock request. The user supplied this `enrollment_ids` contract; the current Swagger definition omits it, and implementation follows the user's instruction. Relock uses `POST /grading/sheets/{id}/relock` with no request body and ends the unlock early.

While a sheet is unlocked, faculty may edit posted grades, including sheets that retain a submitted timestamp or whose encoding window is closed. Every changed grade requires a change reason. On grade-input blur, complete a typed prefix only if it uniquely matches one currently supplied grade option (examples: `1.2` to `1.25`, `U` to `UD`, `5` to `5.00`); leave ambiguous input unchanged. API details and file scope are recorded in `.codex/plans/2026-10-28-grade-sheet-unlock-relock.md`.

The unlock/relock controls, grade-code blur behavior, and selected-row unpost extension are implemented. The unlock request includes the user-specified `enrollment_ids` despite the Swagger omission. Scoped Prettier passes. ESLint reports two unnecessary fallback operators in `GradeSubjects`; typecheck still reports baseline diagnostics plus existing grade-post tests using the old POST signature. No tests were edited or run.

### Separately authorized role/scope metadata update

The user authorized implementing missing API role/scope metadata now, independently of the still-unapproved Grade Encoding feature. Add the verified `FACULTY` role constant and remove restrictive code unions/whitelists so all API-returned role and scope codes survive normalization. Preserve explicit permission checks. Do not invent scope names or change grading routes, guards, or login behavior in this update.

Implementation complete across four source files: `FACULTY` constant, open API role/scope code strings, and nonblank scope validation. Permission grants remain unchanged; Grade Encoding is not implemented. The tester added 15 regression tests; the combined targeted run passed 33 tests across five files, with scoped ESLint/Prettier passing. Type checking retains the same 26 baseline diagnostics.

Initial unauthenticated roles/scopes lookups returned 401; later authenticated read-only verification returned four roles and six scopes (see Grade Encoding contract evidence above). No speculative scope constants were added in this metadata update.

Contract prerequisite resolved sufficiently for full implementation through authenticated read-only inspection. The live API returns four roles including `FACULTY`, six scopes including `GRADES`, administrator global access, and an administrator grade-sheet detail containing both sheet metadata and students. Grade lookups return 14 values and nine reasons inside `{ data }`. A faculty user record has the `FACULTY` role, null access/campus with `GLOBAL_ACCESS`, and `faculty: null`; do not assume that link is always populated.

Use documented faculty settings (`settings.faculty`) and my-classes responses as the authoritative faculty identity/metadata, composing the documented `GradeClass` roster separately where needed. Faculty settings and my-classes requests correctly rejected administrator access with 403; preserve guards without bypasses. Architect accepted this composition.

Source implementation is complete. Reported validation: 35 Grade Encoding tests passed; the full suite has 94 passing tests, three baseline failing tests plus the login import failure (20 files pass, three fail). Type checking retains 26 baseline diagnostics; scoped production/test ESLint and Prettier pass; the production build passes with the existing chunk warning. Reviewer found no actionable introduced defects. Browser layout/focus and live faculty end-to-end checks remain unverified because browser inventory was empty. Live API verification was read-only; no writes or credentials were persisted. See `timeline.md` for the remaining temporary-artifact cleanup limitation.

Follow-up root cause and final fix (supersedes the earlier term-ID equality approach): opaque encrypted academic-term IDs differ across responses. Compare semantic `academic_year` and `term` where independent faculty responses must agree. Administrator lists rely on requested query scope, filter faculty ID, and hide `isPlaceholderData`. `GradeStudents` verifies sheet/faculty IDs without comparing encrypted route/detail term IDs. Updated Grade Encoding coverage: 39 tests across eight suites pass; scoped ESLint/Prettier pass; project type checking retains 26 baseline diagnostics with none in Grade Encoding. No credentials or sensitive student data are recorded.
