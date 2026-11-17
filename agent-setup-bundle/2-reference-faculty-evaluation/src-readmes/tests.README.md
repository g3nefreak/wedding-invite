# Test inventory

Feature tests live in folders under `src/tests/`. Vitest discovers them with the existing `src/**/*.{test,spec}.{ts,tsx}` pattern.

## Authentication

| Test file                                                          | Coverage                                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [`auth/login.test.tsx`](auth/login.test.tsx)                       | Login validation, successful submission/reload, and failure feedback         |
| [`auth/change-password.test.tsx`](auth/change-password.test.tsx)   | Password length/matching validation, confirmation, and successful submission |
| [`auth/account-security.test.tsx`](auth/account-security.test.tsx) | Reset link requests, logout confirmation, and session change validation      |

## Users and profile

| Test file                                                                        | Coverage                                                                       |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`users/user-creation.test.tsx`](users/user-creation.test.tsx)                   | Creation validation, declined confirmation, and successful creation/navigation |
| [`users/profile.test.tsx`](users/profile.test.tsx)                               | Signed-in profile details, account status, and access section rendering        |
| [`users/user-access-management.test.tsx`](users/user-access-management.test.tsx) | Validated role, scope, and campus assignment updates                           |

## Academic setup and evaluation

| Test file                                                                                                                | Coverage                                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [`students/student-management.test.tsx`](students/student-management.test.tsx)                                           | Student creation payloads, activation status, and credential resend              |
| [`faculty/faculty-management.test.tsx`](faculty/faculty-management.test.tsx)                                             | Faculty creation and status payload mapping                                      |
| [`classes/class-setup.test.tsx`](classes/class-setup.test.tsx)                                                           | Section and offering creation with their parent term/section                     |
| [`student-evaluation/student-evaluation-submission.test.tsx`](student-evaluation/student-evaluation-submission.test.tsx) | Complete questionnaire submission, confirmation, and submission guards           |
| [`evaluation/evaluation-reports.test.tsx`](evaluation/evaluation-reports.test.tsx)                                       | Report export, evaluation window validation/updates, and identity reveal context |

Run all tests with `npm test`.

## Suggested next suites

These are candidates for a later batch; no files have been created for them yet.

- `auth/session-lifecycle.test.tsx` — refresh, expiry, and cross-tab session transitions.
- `evaluation/report-navigation.test.tsx` — report breadcrumb hierarchy and preserving filters while navigating between report levels.
- `users/user-lifecycle.test.tsx` — editing, status changes, password reset, and deletion for managed user accounts.
