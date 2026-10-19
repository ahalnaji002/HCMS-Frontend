# Sprint 8 Final Review

## Reviewed delivery

Sprint 8 delivers the frontend authentication and role-based workspace
foundation. This review is based on the code and documentation merged into
`develop` at commit `d22eba1`. It is a frontend record: the approved backend
documentation and implementation remain the source of truth for API behavior,
authorization, and account workflow rules.

## Authentication and session behaviour

- Public routes are `/`, `/login`, `/register/patient`,
  `/register/doctor`, and `/register/ngo`.
- Successful login stores the backend-issued JWT under
  `hcms_access_token` in `localStorage`. The shared Axios client attaches it
  as `Authorization: Bearer <token>` unless a request is marked public.
- On startup, `AuthProvider` calls `GET /api/auth/me` when a saved token is
  present. A `401` during this restoration clears local session state.
- Logout is frontend-only in this release: it removes the local token and user
  state, then navigates to `/login`. The backend provides no logout or token
  revocation endpoint.
- `RequireRole` sends unauthenticated visitors to `/login` and redirects a
  signed-in user who opens another role's route to that user's own route.
  This is navigation behaviour, not a security boundary; backend JWT and RBAC
  checks enforce authorization.

## Role routes and navigation

| Route | Required backend-confirmed role | Delivered interface |
| --- | --- | --- |
| `/patient` | `PATIENT` | Dashboard, intake, profile, emergency-alert, correction-request, and diagnosis areas |
| `/doctor` | `DOCTOR` | Dashboard, assigned-patient, medical-record, note, and diagnosis areas |
| `/ngo` | `NGO` | Dashboard summary; other NGO feature pages remain unavailable |
| `/admin` | `ADMIN` | Dashboard, patient-intake review, workload, emergency, and support areas |

All role pages use `RoleLayout` for responsive navigation, language and theme
controls, account menu, and local logout. Navigation entries for approved but
unimplemented modules are disabled and labelled “Coming soon”; they do not
link to invented pages.

## Implemented API boundary

The frontend calls APIs only through the shared Axios client and repository
modules under `src/infrastructure/repositories/`.

| Area | Implemented frontend calls |
| --- | --- |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, and the three registration routes under `/api/auth/register/` |
| Role dashboards | `GET /api/patient/dashboard`, `GET /api/doctor/dashboard`, `GET /api/ngo/dashboard`, `GET /api/admin/dashboard` |
| Patient, Doctor, and Admin workspaces | The documented intake, profile, emergency, assignment, medical-record, note, diagnosis, and correction-request endpoints used by their repository modules |

The frontend does not create endpoints, make authorization decisions, or
derive application state locally. In particular, User Account status and Join
Request status are separate: professional registration creates an `INACTIVE`
account and a `PENDING` Join Request. Approval makes the request `APPROVED`
and the account `ACTIVE`.

## Unavailable functionality and follow-up work

- No password recovery or password-reset flow exists.
- There is no backend logout or refresh-token/revocation flow.
- There is no separate Join Request status lookup endpoint. Valid professional
  credentials can receive the latest `PENDING` or `REJECTED` application
  projection from login as documented in `auth-contract.md`.
- Re-application after rejection and approval/rejection email notifications
  are future enhancements.
- NGO feature pages beyond the role dashboard remain unavailable.
- A number of role-navigation entries are intentionally disabled until their
  corresponding approved screens are delivered.

## Quality, accessibility, and compatibility review

- Public authentication screens and shared role layouts were visually checked
  in English and Arabic at `360x800`, `768x1024`, `1024x768`, and `1440x900`.
  The responsive record confirms labels, visible text errors, focus indicators,
  44 px interaction targets, RTL layout, and no unintended horizontal scroll.
- The shared layout uses logical Tailwind direction classes for RTL and a
  disclosure navigation below the `md` breakpoint.
- Live integration verification covered registration, login, current-user
  restoration API behavior, role authorization, professional approval and
  rejection results, and `400`, `401`, `403`, and `409` responses.
- The integration record does not claim live coverage for a deliberately
  induced network failure or `500` response, and records that no automated
  test runner was configured at the original review point. The subsequent
  [2026-10-19 automated verification](./sprint-8-automated-verification.md)
  adds Playwright browser tests, offline recovery, and synthetic HTTP 500 coverage.

See `sprint-8-responsive-verification.md` and
`sprint-8-integration-verification.md` for the detailed evidence and limits.

## Source-control and verification review

Before this documentation update, `develop` was clean at `d22eba1`. The
following checks were repeated on
`feature/8-12-documentation-final-review` and passed after the documentation
changes:

```powershell
npm run lint
npm run build
git diff --check
```

`git status` and `git diff` were also reviewed: the working tree contains only
the four documentation changes made by this issue, and `git diff --check`
reported no whitespace errors.
