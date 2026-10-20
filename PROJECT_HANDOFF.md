# HCMS Frontend — Project Handoff

## Project Purpose

HCMS is a responsive React frontend for the Healthcare Conflict Management
System. It communicates with the HCMS Backend through the shared Axios client.

## Technology and Setup

- React 19, Vite 8, React Router 7, Tailwind CSS 4, and Axios.
- English and Arabic localization with LTR/RTL support.
- Node.js and npm are required.
- Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend URL.
- Run `npm install`, then `npm run dev` to start the application.
- Run `npm run lint` and `npm run build` for frontend verification.

## Frontend Architecture

The frontend follows inward dependency boundaries under `src/`: `app/` owns
route composition and wires services, `application/` normalizes repository
results and applies client-side domain checks, `domain/` holds framework-free
concepts, `infrastructure/` contains the Axios client and repositories, and
`presentation/` contains pages, features, layouts, UI, and localization. UI
code consumes application services through `useApplicationServices`; it does
not import API repositories directly. `@/` is the Vite alias for `src/`.
Role route components compose the shared role layout with patient, doctor,
NGO, and admin workspace features. Each feature separates its UI component from the
matching hook that owns workspace state, application-service calls, and events.
Large workspace sections are separate components in each feature's `components/`
directory.

## Current Routes

`src/app/App.jsx` defines public and role-restricted routes:

| URL | Access | Current behavior |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Login and Doctor/NGO application-status result |
| `/register/patient` | Public | Patient registration |
| `/register/doctor` | Public | Doctor registration |
| `/register/ngo` | Public | NGO registration |
| `/patient` | Authenticated PATIENT | Patient workspace |
| `/doctor` | Authenticated DOCTOR | Doctor workspace |
| `/ngo` | Authenticated NGO | NGO dashboard summary; feature pages remain unavailable |
| `/admin` | Authenticated ADMIN | Administrator workspace |

Role routes are guarded by `RequireRole`; backend authorization remains the
security boundary. Password recovery and reset are out of scope.

## Authentication and Application Status

The approved frontend/backend contract is in `src/docs/auth-contract.md`.
Doctor and NGO applicants check status on `/login` by entering the same email
and password used at registration. The backend verifies credentials first,
then returns the latest `PENDING` or `REJECTED` application projection in a
`403` response. The login page shows the status and any rejection reason. No
session is created. Wrong credentials never reveal application status.

There is no separate status-lookup endpoint, re-application flow, or email
notification in this release. Issue 8.6 was merged into `develop` in commit
`1deb743`.

The access token is held in `localStorage` under `hcms_access_token` and is
sent as a Bearer token by the shared Axios client. On application startup,
`AuthProvider` calls `GET /api/auth/me` to restore the authenticated user. The
current release has no backend logout endpoint; logout removes the local token
and user state. The route guard improves navigation only; the backend remains
the authorization boundary.

## Patient Intake and Care Coordination

The patient-intake and care-coordination frontend is implemented on
`develop` (merged in PR #46).

- Patients can submit one self-reported health-intake form and edit it until an
  administrator starts review. Once review starts, the form becomes read-only.
- Patients can view their profile, create emergency alerts, and send correction
  requests to the administration after the form is locked.
- Administrators can review intake forms, start review explicitly, and assign
  one or more doctors with an internal follow-up reason.
- The administrator workspace shows doctor availability, active assignments,
  open emergency workload, and capacity as an advisory signal. Capacity does
  not block assignment; unavailability blocks routine assignment only.
- Doctors can view assigned patients and their self-reported intake, write
  private medical notes, and record separate diagnoses for each patient.
- Patients can view diagnoses recorded by their assigned doctors; this view is
  read-only. Each doctor retains their own diagnosis records.
- Administrators can assign pending emergency alerts to eligible active
  doctors, including doctors marked unavailable or at capacity. Routine
  assignment prevents choosing unavailable doctors; capacity is advisory and
  does not block assignment.
- The matching backend endpoints and database migrations are implemented and
  merged into backend `develop` through PR #95. Apply the backend development
  migrations before running the frontend workflow against it.
- English and Arabic are available throughout patient, doctor, and admin
  workspaces, including the role-header language and light/dark theme toggles.
- Each role route now includes a dashboard summary backed by its documented
  role-specific endpoint. NGO assistance features remain a coming-soon area.

## Sprint 8 Status

| Issue | Status |
| --- | --- |
| 8.1 — Authentication contract and audit | Complete |
| 8.2 — Shared API and authentication foundation | Complete |
| 8.3 — Login integration | Complete |
| 8.4 — Patient registration integration | Complete |
| 8.5 — Doctor and NGO registration | Complete |
| 8.6 — Applicant approval-status visibility | Complete and merged into `develop` |
| 8.7 — Protected and role-restricted routes | Complete |
| 8.8 — Shared role layouts and navigation | Complete and merged through PR #47 and PR #48; issue #16 closed |
| 8.9 — Initial role dashboards | Complete and merged through PR #49 |
| 8.10 — Responsive authentication and layout baseline | Complete and merged into `develop` |
| 8.11 — Sprint 8 integration testing | Complete and merged into `develop` |
| 8.12 — Documentation and final review | Complete and merged into `develop` |
| 8.13 — Sprint 8 final commit and closure | Complete and merged into `develop` at commit `2c56185` |

## Git Workflow

- `main` is the stable branch; `develop` is the integration branch.
- Focused work belongs on `feature/...` branches.
- Before committing, review `git status` and `git diff`.

## Key Documentation

- `src/docs/auth-contract.md` — frontend reference derived from the approved
  backend authentication documentation.
- `src/docs/sprint-8-responsive-verification.md` — responsive and accessibility
  verification record.
- `src/docs/sprint-8-integration-verification.md` — live integration evidence
  and known verification limitations.
- `src/docs/sprint-8-automated-verification.md` — Playwright browser coverage,
  results, and environment limitations.
- `src/docs/sprint-8-final-review.md` — Sprint 8 delivery summary, boundaries,
  and follow-up work.
- `src/docs/sprint-8-closure-checklist.md` — final Issue, verification, and
  remaining-work traceability for Sprint 8 closure.
