# Navigation architecture

Updated: 2026-11-03

## Approved decisions

- Feature ownership is grouped under `src/features/faculty`, `students`, `staff`, `other-shared` and `shared`. Portal pages use corresponding groups under `src/pages/`, including staff Academic and Administration subgroups. Cross-role pages live directly in `src/pages/login`, `src/pages/auth` and `src/pages/auth-logs`; their feature modules remain under `src/features/other-shared`. `NotFound.tsx` belongs to `src/pages/shared`. Filesystem ownership does not determine URL nesting.
- `src/features/staff/academic/academic.routes.tsx` owns `/academic` and composes relative children: Evaluation, faculty-owned Grade Encoding, staff Students and staff Enrollment.
- `src/features/staff/academic/evaluation/evaluation.routes.tsx` owns `/academic/evaluation` and composes Reports and Classes. Employee management belongs to `src/features/staff/administration/employee/` and uses `/employees`.
- `src/features/faculty/grade-encoding/grade-encoding.routes.tsx` remains a direct Academic child at `/academic/grade-encoding`; staff Students remains at `/academic/students` and staff Enrollment at `/academic/enrollment`.
- `src/features/students/evaluation/student.routes.tsx` defines `/professors`, `/professors/:id` and `/change-password`. `src/features/students/enrollment/self-enrollment.routes.tsx` defines `/enrollment`. Both register directly under the authenticated root.
- `src/features/staff/administration/administration.routes.tsx` composes employee, Windows Config, auth-log, user and access-control routes without an Administration URL prefix. Windows Config uses `/windows-config`, with configured `ADMIN` role and `WINDOWS` scope requirements.
- `src/routes/index.tsx` imports `AuthSessionBoundary` from `#/features/other-shared/auth`; session ownership remains in that feature. Shared role/scope constants come from `#/features/shared/access/users-access.config`, including in student routes and grading access.
- `SidebarNavigation` derives Academic navigation from staff Academic plus student enrollment/evaluation routes, and Administration navigation from Administration routes. `getSidebarNavigationItems` applies access checks and the grading access callback.
- Regrouping preserves route contracts and feature-local API/query ownership. No root-level `/students` or `/grade-encoding` compatibility routes are introduced.

## Verification status

Current feature/page directories, route registrations and page imports were inspected for the approved regrouping on 2026-11-03. Root-level login/auth/auth-log page locations and their current route imports were rechecked after the manual move. No tests or typecheck were run for this page-context update. Previously recorded parent validation ran `npm run typecheck`; it failed on known pre-existing issues: `AlertProps.title`, `AuditLog.timestamp`, nullable pagination/ID/limit values in subjects/classes/employee, optional `sortFields`, and unrelated test type errors. Earlier stale feature-module resolution errors in auth tests are gone. No test suite was run. This is not a passing repository-wide typecheck; earlier recorded validation remains historical.

Evidence: `src/routes/index.tsx`, `src/routes/paths.ts`, `src/features/staff/academic/academic.routes.tsx`, `src/features/staff/academic/evaluation/evaluation.routes.tsx`, `src/features/staff/administration/administration.routes.tsx`, `src/features/faculty/grade-encoding/grade-encoding.routes.tsx`, `src/features/students/evaluation/student.routes.tsx`, `src/features/students/enrollment/self-enrollment.routes.tsx`, `src/features/other-shared/auth/auth.routes.tsx`, `src/features/other-shared/auth-logs/audit-logs.routes.tsx`, and `src/components/SidebarNavigation.tsx`.

## Academic window management

`src/pages/staff/administration/WindowsConfig.tsx` loads shared academic-term options, selects the active term by default (otherwise the first available), and coordinates enrollment, evaluation and grade-encoding windows. It imports enrollment and evaluation editors from staff Academic features and the grading editor from the faculty feature. Enrollment editing has an additional `SUPERADMIN`/`ADMIN` and `ACADEMIC` access check. The page does not create, edit or delete academic-term records.

The term list/types remain in `src/features/shared/academic-terms/`. Window mutations stay with their owning features; the API owns persistence and validation. This preserves shared lookup reuse across staff and faculty feature boundaries.

Evidence: `src/features/staff/administration/administration.routes.tsx`, `src/pages/staff/administration/WindowsConfig.tsx`, and its direct imports from `#/features/shared/academic-terms/academic-terms.query`, `#/features/staff/academic/evaluation/reports/components/UpdateEvaluationWindow`, `#/features/staff/academic/enrollment/components/UpdateEnrollmentWindow`, and `#/features/faculty/grade-encoding/components/UpdateGradeEncodingWindow`.

## Grade Encoding

Grade Encoding retains separate faculty, subject-sheet and student pages. Administrators browse a faculty directory, then filtered sheets and a read-only roster. Faculty use grading settings for identity, their own sheet list for metadata and a separate roster response for editing; do not assume the two response shapes are identical.

Access uses `FACULTY` or `ADMIN`/`SUPERADMIN` roles with the `GRADES` scope through auth access evaluation. Previously documented behavior includes versioned local drafts, explicit reset, preservation after failed/conflicting saves, whole-class posting and locking, reasons for unlocked changes and guarded unsaved navigation. Those behavior notes were not revalidated during this folder update.

Evidence: `src/features/faculty/grade-encoding/grade-encoding.access.ts`, `src/features/faculty/grade-encoding/grade-encoding.routes.tsx`, and `src/pages/faculty/grade-encoding/`. Historical reviewer handoff reported no actionable defects, 35 passing grading tests and a passing production build. Faculty-authenticated end-to-end behavior and browser layout remain unverified by this update.

## Validation schemas and access-control groups

`src/helpers/zod/` provides reusable Zod 3 builders. Application schemas retain native composition, transforms/refinements, type inference and resolver contracts where the helper package has no matching API. Preserve parsing behavior, especially unknown-key handling and string trimming.

Group editing is coordinated by `src/features/staff/administration/access-control/ManageUserGroup.tsx`. `groups.schema.ts` defines group schemas; `helpers/hydrate-access.ts` hydrates editor state and `helpers/build-editor-assignments.ts` constructs assignments. The builder handles the global Super Admin case separately, validates populated scope/campus/role selections and preserves supplied assignments. The component reports builder issues before confirmation.

Evidence: `src/helpers/zod/README.md`, `src/features/staff/administration/access-control/ManageUserGroup.tsx`, `src/features/staff/administration/access-control/helpers/build-editor-assignments.ts`, and `src/features/staff/administration/access-control/groups.schema.ts`. This documentation update is not a repository-wide typecheck pass.
