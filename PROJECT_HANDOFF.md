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

## Current Routes

`src/App.jsx` defines public and role-restricted routes:

| URL | Access | Current behavior |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Login and Doctor/NGO application-status result |
| `/register/patient` | Public | Patient registration |
| `/register/doctor` | Public | Doctor registration |
| `/register/ngo` | Public | NGO registration |
| `/patient` | Authenticated PATIENT | Patient workspace |
| `/doctor` | Authenticated DOCTOR | Doctor workspace |
| `/ngo` | Authenticated NGO | Localized placeholder |
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
- The NGO role remains a placeholder in this working tree.

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
| 8.8 — Shared role layouts | Implemented locally on `feature/8-8-shared-role-layouts`; lint and production build pass; not yet committed or merged |
| 8.9 — Full role dashboards | Pending roadmap |

## Git Workflow

- `main` is the stable branch; `develop` is the integration branch.
- Focused work belongs on `feature/...` branches.
- Before committing, review `git status` and `git diff`.
