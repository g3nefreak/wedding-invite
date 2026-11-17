# Timeline

Updated: 2026-10-30

## Current work

| Milestone | Status | Evidence / dependency |
| --- | --- | --- |
| Confirm sidebar groups, URL prefix, and folder scope | Complete | User approved the revised plan on 2026-10-27; compatibility redirects explicitly excluded. See `objectives.md`. |
| Reorganize features and route composition; update consumers and sidebar | Complete | Developer completed the approved refactor in `src/features/`, `src/routes/`, and `src/components/Sidebar.tsx`. |
| Automated validation | Complete with baseline failures | 16 targeted routing/sidebar regression tests passed; build passed with the existing chunk warning. See evidence below. |
| Review final diff | Complete | Reviewer reported no introduced defects. |
| Live viewport verification | Pending | No browser available; mobile flyout containment and collapsed-sidebar geometry require a manual browser check. |

No delivery deadline was supplied. No blocking product questions remain within the approved scope. Old module bookmarks will cease to resolve through dedicated compatibility routes by explicit user choice.

## Reported validation evidence

The coordinating agent supplied these final developer/tester results on 2026-10-27:

- Targeted regression tests: 16/16 passed, including real dropdown click, keyboard, Escape, active state, permission filtering, and mobile drawer closure in DOM tests.
- Production build passed with an existing chunk-size warning. Scoped source Prettier and changed-test ESLint passed.
- Repository lint: 27 errors and 3 warnings, matching pristine HEAD's 30 problems.
- Type checking: 26 diagnostics, matching pristine HEAD; no new test diagnostics.
- Full suite: 43 passing tests and 3 failing tests, plus a login-suite import failure; 3 failing suites total, reproduced on baseline.
- Live visual/viewport checks were unavailable. DOM tests do not establish actual mobile or collapsed-sidebar geometry.

Next action: manually check the desktop, collapsed, and phone sidebar in a browser. Address baseline lint, type, and test failures as separate work; no extra application changes are included here.

## Grade Encoding planning

Status: approved source implementation complete; browser/live faculty verification remains pending. The user separately requested Grade Encoding as a real module, superseding its exclusion as a demonstration item in the earlier migration scope. See `objectives.md` for confirmed scope and the latest selective-posting decision, which supersedes whole-class-only posting.

### Selective posting and typed grade entry (2026-10-28)

| Milestone                                                | Status      | Evidence / dependency                                                                                                                                                                                                                          |
| -------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirm posting behavior and API contract                | Complete    | User approved selected-student posting and specified saved grades only. The endpoint accepts `enrollment_ids` (1-300), skips already-posted students, and returns updated per-student posting status; see the saved plan and Grading API docs. |
| Implement typed grade entry and selected-student posting | Complete | Grade input accepts valid grade-code prefixes/options only; invalid text does not update the grade ID. Failing grades are red; INC/UD are orange. Posted rows lock individually and unposted rows remain editable. Scoped ESLint and Prettier pass. Typecheck still reports baseline errors and existing grade-post tests using the old POST signature. |
| Update and run focused API/editor tests                  | Not done | No tests were edited or run. Existing grade-post tests still use the old POST signature.                                                                                                                                                       |

Approved plan: `.codex/plans/2026-10-28-selective-grade-posting.md`. The checkout has no local Postman simulation files and no Postman CLI, so API simulation is unavailable in the current setup; do not send a live posting request. Use focused local checks against the documented contract.

### Approved Grade Monitoring unlock/relock and grade-code blur behavior (2026-10-28)

The approved contract limits unlock/relock actions to ADMIN/SUPER_ADMIN. Unlock is `POST /grading/sheets/{id}/unlock`; it requires a reason of at most 255 characters and accepts integer `hours` from 1 to 168, default 48. Submitted sheets and draft sheets with posted students are eligible. Admins can select posted students to unpost by sending their `enrollment_ids` with the reason and hours. The user supplied this body field; Swagger currently omits `enrollment_ids`, and the implementation follows the user's instruction. Relock is `POST /grading/sheets/{id}/relock` with no body and ends an active unlock early. While unlocked, faculty can edit posted grades even if `submitted_at` remains set or the encoding window is closed; changed grades require a reason.

Grade-code blur handling completes only a unique prefix match from current grade options (for example `1.2` → `1.25`, `U` → `UD`, `5` → `5.00`); ambiguous input remains unchanged. See `.codex/plans/2026-10-28-grade-sheet-unlock-relock.md` for the original approved scope and API contract. The unlock/relock, blur, selected-row unpost, and unlocked-state guard implementation is complete. Scoped Prettier passes; ESLint reports two unnecessary fallback operators in `GradeSubjects`; typecheck still reports baseline diagnostics plus existing grade-post tests using the old POST signature. No tests were edited or run.

Resolved decisions: reuse the faculty directory with campus/college/search; apply academic year and term when opening Subjects, without term-based faculty exclusion or grade-sheet aggregation. Include faculty login/session support and preservation of all API-returned roles, using `user.faculty` for linkage and explicit capability guards. The faculty landing destination is Grade Encoding; existing student/staff destinations remain unchanged.

Contract preflight is sufficiently resolved: parent performed authenticated read-only API checks and architect accepted the composition. Live responses include four roles (`FACULTY` included), six scopes (`GRADES` included), administrator global access, administrator sheet detail with students, and `{ data }` lookups with 14 grade values/nine reasons. A faculty user record has `faculty: null`, so documented faculty settings and my-classes supply authoritative faculty identity/metadata, with a separate `GradeClass` roster where needed. Administrator requests to faculty-only settings/my-classes correctly returned 403; no guard bypass is authorized.

Final reported validation: 35 Grade Encoding tests pass; full suite has 94 passing tests, three baseline failing tests plus a login import-suite failure (20 files pass, three fail). Type checking retains 26 baseline diagnostics. Scoped production/test ESLint and Prettier pass; source lint excluding generated temporary output retains baseline 27 errors/three warnings. Production build passes with the existing chunk warning. Reviewer found no actionable introduced defects. Related auth README sync is complete and its Prettier check passes.

Follow-up root cause resolved: encrypted academic-term IDs differ across responses, so term-ID equality was not a valid fix. The final implementation compares semantic `academic_year`/`term` where independent faculty responses must agree; administrator lists use requested query scope, filter faculty ID, and hide `isPlaceholderData`. `GradeStudents` verifies sheet/faculty IDs without comparing encrypted route/detail term IDs. This supersedes the previous list-level term-ID equality approach. Updated validation: 39 Grade Encoding tests across eight suites pass; scoped ESLint/Prettier pass; type checking remains at 26 baseline diagnostics with none in Grade Encoding. No new full-suite or build run is claimed for this follow-up.

Grade Students summary cards: `GradeStudents.tsx` now displays the academic year and term, enrolled student count, students without saved grades, and posted/unposted state above the unpaginated roster. Counts and status derive from the loaded grade sheet and roster; no new API calls or pagination were added. Targeted ESLint and Prettier checks pass.

Grade editor toolbar visibility: hide unsaved-change status and reload/save/reset/post controls unless the viewer has `can_edit` access. After a successful post, retain the toolbar in a disabled state. Administrator and locked-sheet tests cover the hidden state; the editor test also asserts the roster remains unpaginated, matching the user's earlier requirement. Focused editor tests pass (10/10); ESLint, Prettier, and `git diff --check` pass.

Grade Subjects table: merged Subject and Section into one column. It displays subject code/title with the section beneath it, while its accessor retains all three values for table processing. ESLint, Prettier, and the focused subjects tests (3/3) pass.

Grade Encoding configuration cleanup: moved the summary stat builder, Faculty/Subjects/Students column definitions, and subject filter options into `grade-encoding.config.tsx`. Components and pages now consume the feature-owned configuration. Grade Encoding tests pass (40/40) and scoped ESLint/Prettier pass. Project typecheck remains blocked by existing errors outside this feature; no changed Grade Encoding files are reported.

Grade list filtering: added a term-scoped Section filter to Subjects. Administrator section choices come from the selected faculty's grade sheets and use the supported `section_id` filter; faculty choices come from their assigned classes and filter locally. Added client-side student name/number search in the unpaginated Students roster, keyed by grade sheet. The live OpenAPI documentation lists `section_id` for the grade-sheets endpoint. After restricting choices to the selected faculty, Grade Encoding tests pass (43/43); scoped ESLint and Prettier pass.

Grade Subjects refresh callback fix: replaced a stale `sections.refetch()` reference after section choices moved to the faculty grade-sheets query. Prettier, scoped ESLint, Grade Subjects tests (5/5), and `git diff --check` pass.

Live administrator API verification was read-only; no live writes or credentials were persisted. Live faculty end-to-end and browser layout/focus remain unverified (empty browser inventory). Temporary `.codex/tmp/grade-encoding-build` output remains because automatic approval review rejected both checked native recursive cleanup and the safer individual nonrecursive command as “blocked by policy”; raw lint includes an additional generated-JavaScript error from this output.

Next action: manually verify faculty flows and browser layout/focus, and remove the generated temporary build output when permitted. Baseline check failures remain separate work. No delivery deadline was supplied.

## Role/scope metadata update

Status: complete. Four source files now include the known `FACULTY` constant, preserve arbitrary API role/scope code strings, and validate nonblank scopes. Permission grants remain unchanged; no Grade Encoding implementation was included in this separate update. Initial unauthenticated lookup returned 401; subsequent authenticated verification returned four roles and six scopes, as recorded above. No speculative scope constants were added.

Validation reported by the coordinating agent: 15 new tester regressions; combined targeted run 33/33 tests across five files passed; scoped source/test ESLint and Prettier passed. Type checking reports the same 26 baseline diagnostics.

Next action: follow the remaining manual verification and cleanup items recorded above.

## 2026-10-30 current workspace maintenance

Uncommitted source work migrates application schema construction to `#/helpers/zod` where behavior matches, and blocks non-Super-Admin user-group saves without a scope and campus assignment. All Scopes/All Campuses count as selections. This does not change UI appearance. Scoped ESLint and `git diff --check` pass; tests were not run. `npm run typecheck` fails with diagnostics including sort-field nullability in `src/helpers/table-query.helpers.ts` and errors in other services, components, routing and tests. These changes are not shipped. See `objectives.md` and the architect-owned `architecture.md` / `process-flow.md` for requirements and source flow.
