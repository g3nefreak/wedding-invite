# Affected navigation flows

Updated: 2026-10-30

Implemented navigation flow; targeted validation completed with browser geometry checks outstanding.

1. A verified staff session enters the existing authenticated layout. Staff landing uses the canonical Evaluation Reports destination.
2. Academic → Faculty Evaluation opens a menu beside its trigger, containing accessible Reports, Faculty and Classes links. On narrow screens the menu stays within the viewport.
3. Selecting a link opens `/academic/evaluation/...` through the existing feature guard and page. Preserve nested report IDs, parameters, filters and breadcrumb destinations.
4. Academic → Students and Administration → Audit Logs / Users navigate directly to their unchanged paths. Existing access rules still filter links and guard direct visits.
5. Profile/password actions and the separate `/professors` student layout retain their existing flows. There is no old-module compatibility redirect phase.

Evidence: implementation/reviewer handoff confirms route/sidebar consumers are complete, 16 targeted tests pass and production build passes. No introduced defects were reported. Actual browser mobile/collapsed geometry remains unverified; do not interpret the intended narrow-screen behavior above as a completed visual check. Repository-wide test, lint and type-check failures remain baseline issues.

## Grade Encoding flow

1. Academic → Grade Encoding opens `/academic/grade-encoding` through existing guards with `GRADES` access; no empty-access bypass is added.
2. Administrators select a faculty member, browse that faculty's term-specific sheets, then inspect a read-only student roster. Faculty identity comes from grading settings; faculty browse only their own sheets and load their roster separately from list metadata.
3. Controlled grade/reason selections update local drafts and an unsaved count. Reset discards drafts. Save sends changed enrollment entries with loaded versions; failed requests and conflicts preserve drafts.
4. Whole-class Post Grade requires saved changes and completeness, confirms submission and respects the server's locked state. Unlocked edits require reasons; leaving with unsaved work prompts a warning.

Validation handoff: 35 grading tests and build pass; source review found no actionable defects. Read-only administrator calls verified the live contracts. Faculty-authenticated end-to-end behavior and actual browser layout remain unverified; baseline repository check issues remain.

## User-group save flow

1. `ManageUserGroup` loads access lookups, hydrates existing assignments and preserves advanced rows that the editor does not own.
2. `AccessScopeFields` updates the draft scopes, campuses and roles in component state.
3. On submit, `buildEditorAssignments` validates the draft and returns either assignments or issues. A non-Super-Admin draft must include a scope selection (or All Scopes), and every scope must have a campus assignment (a specific campus or All Campuses).
4. If validation succeeds, the component asks for confirmation and sends the create/update mutation through `safeMutate`. Validation issues are shown before confirmation; successful mutation displays a toast and closes the editor.

Evidence: `src/features/administration/access-control/components/ManageUserGroup.tsx`, `src/features/administration/access-control/components/AccessScopeFields.tsx`, `src/features/administration/access-control/access-control.helpers.ts`, and `src/features/administration/access-control/access-control.query.ts`. Updated: 2026-10-30. This describes current source flow; no end-to-end test is claimed.
