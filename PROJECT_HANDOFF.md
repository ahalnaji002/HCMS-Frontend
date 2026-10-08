# HCMS Frontend — Project Handoff

## Project Purpose

HCMS is a responsive React frontend for the Healthcare Conflict Management
System. It communicates with the HCMS Backend through the shared Axios client.

## Technology and Setup

- React 19, Vite 8, React Router 7, Tailwind CSS 4, and Axios.
- English and Arabic localization with LTR/RTL support.
- Node.js and npm are required.
- Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend URL.
- Run `npm install`, then `npm run dev` to start the local application.
- Run `npm run lint` and `npm run build` for frontend verification.

## Current Routes

`src/App.jsx` defines the public and role-restricted routes:

| URL | Access | Behavior |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login` | Public | Login and professional application-status result |
| `/register/patient` | Public | Patient registration |
| `/register/doctor` | Public | Doctor registration |
| `/register/ngo` | Public | NGO registration |
| `/patient` | Authenticated PATIENT | Role home |
| `/doctor` | Authenticated DOCTOR | Role home |
| `/ngo` | Authenticated NGO | Role home |
| `/admin` | Authenticated ADMIN | Role home |

Role routes are guarded by `RequireRole`; backend authorization remains the
security boundary. Password recovery and reset are out of scope.

## Authentication and Application Status

The approved frontend/backend authentication contract is in
`src/docs/auth-contract.md`. Keep it aligned with the backend API documentation.

Doctor and NGO registration creates an inactive account and a pending Join
Request. After registration, the applicant returns to `/login` and submits the
same email and password to check status. The backend verifies the credentials
first, then returns the latest `PENDING` or `REJECTED` application projection in
the `403` response. The login page displays the status and, when rejected, the
administrator's recorded reason. No token or authenticated session is created.
Approved applicants log in normally. Invalid credentials never reveal status.

There is no separate status-lookup endpoint, re-application flow, or email
notification for this release. Do not add endpoints or infer application state
in the frontend.

## Sprint 8 Status

| Issue | Status |
| --- | --- |
| 8.1 — Authentication contract and audit | Complete |
| 8.2 — Shared API and authentication foundation | Complete |
| 8.3 — Login integration | Complete |
| 8.4 — Patient registration integration | Complete |
| 8.5 — Doctor and NGO registration | Complete |
| 8.6 — Applicant approval-status visibility | Implemented on `feature/8-6-applicant-status-ui`; verify before integration |
| 8.7 — Protected and role-restricted routes | Complete |
| 8.8 — Shared role layouts | Next |
| 8.9 — Role dashboards | Pending roadmap |

## Git Workflow

- `main` is the stable branch.
- `develop` is the integration branch.
- Focused work belongs on `feature/...` branches.
- Do not commit directly to `main` or change API contracts without approval.

Before committing, review `git status` and `git diff`. Do not include unrelated
working-tree changes in the feature branch.
