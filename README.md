# HCMS Frontend

## Project Overview

Frontend application for the **Healthcare Conflict Management System (HCMS)**.

## Features

* Responsive React user interface
* English and Arabic localization with LTR and RTL support
* Shared HCMS light and dark design tokens
* Language-aware typography using Inter and IBM Plex Sans Arabic
* Reusable HCMS logo and icon component with light and dark presentations
* Persistent light and dark theme foundation with operating-system fallback
* Landing page integrated with the shared brand, language, and theme controls
* Landing About and Platform Capabilities sections with localized content
* Role-based Who We Serve section for patients, doctors, organizations, and administrators
* Smooth Landing section navigation with active-section tracking
* Final Landing CTA with a shared public registration-role entry flow
* Responsive localized Landing footer with section navigation and account entry actions
* Login redirects each authenticated role to its own protected role home route
* Patient registration validates approved fields and integrates with the backend API
* Doctor and healthcare organization registrations submit approved fields and clearly show administrator approval status
* Doctor and NGO applicants can check pending or rejected application status, including the recorded rejection reason, from the login page
* Patient workspace for submitting and updating a self-reported health-intake form before administration begins review
* Administrator workspace for reviewing patient intake, locking edits explicitly, and assigning one or more doctors with an internal reason
* Administrator controls for doctor availability and capacity with separate active-assignment and open-emergency workload counts
* Patient access to profile information and emergency alerts before health-intake submission
* Doctor workspace for assigned-patient intake review, private medical notes, and separate patient diagnoses
* Patient read-only view of diagnoses recorded by assigned doctors
* Administrator workflow for assigning emergency alerts to eligible active doctors, including unavailable doctors
* Patient correction requests sent directly to the administration after intake review locks editing, with request status and administrative responses
* Shared role workspace layout with the full logo, language and light/dark theme controls, logout behavior, and role-specific content widths

## Dependencies

* React
* Vite
* React Router
* Axios
* ESLint
* Playwright Test (development dependency for browser regression tests)
* Tailwind CSS
* Fontsource packages for Inter and IBM Plex Sans Arabic

## Requirements

Make sure the following are installed:

* Node.js
* npm
* Git

## Setup

Clone the repository:

```bash
git clone https://github.com/ahalnaji002/HCMS-Frontend.git
```

Enter the project directory:

```bash
cd HCMS-Frontend
```

Switch to the development branch:

```bash
git checkout develop
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root.

Use `.env.example` as a reference:

```env
VITE_API_URL=http://localhost:3000
```

> Do not commit the `.env` file to GitHub.

## Run the Frontend

Start the development server:

```bash
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

## Automated Browser Tests

Install the test browser once after installing dependencies:

```bash
npx playwright install chromium --no-shell
npm test
```

`npm test` starts an isolated Vite server on port 4178 and runs Chromium at
desktop and mobile sizes. Keep that port free. Use `npm run test:headed` to
watch the browser, or `npx playwright show-report` to view the HTML report.
Failure traces and screenshots are saved in ignored test output directories.

If bundled Chromium cannot start on Windows, use installed Google Chrome:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test
```

The suite covers authentication, session restoration, logout, role guards,
registration, and recovery from aborted network requests and HTTP 500 responses.
API responses are synthetic contract fixtures intercepted in the browser;
unmatched API calls are blocked. No real backend, account, or database is used.
These tests verify frontend behavior, not backend authorization or live API
integration. See `src/docs/sprint-8-automated-verification.md` for scope and results.

For an end-to-end check against a running local backend, first start the API in
test mode with `NODE_ENV=test` and a migrated, isolated `hcms_test_db`, then run:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm run test:integration
```

This flow creates uniquely named Patient, Doctor, and NGO test accounts in the
test database. Do not point it at a development or production database. HTTP
500 and network loss are simulated in the browser without stopping the API.

## Backend Connection

The frontend communicates with the HCMS Backend API using Axios.

The API base URL is configured through:

```env
VITE_API_URL=http://localhost:3000
```

The shared Axios configuration is located at:

```text
src/infrastructure/http/apiClient.js
```

## Sprint 8 Documentation

- `src/docs/auth-contract.md` explains the approved frontend authentication
  contract, token handling, public and protected routes, and the distinction
  between User Account and Join Request statuses.
- `src/docs/sprint-8-responsive-verification.md` records responsive and
  accessibility checks for public authentication screens and shared role
  layouts.
- `src/docs/sprint-8-integration-verification.md` records live API integration
  results and explicit test limitations.
- `src/docs/sprint-8-final-review.md` summarizes the delivered Sprint 8 scope,
  API boundaries, and follow-up work.
- `src/docs/sprint-8-closure-checklist.md` records the final Sprint 8 closure
  review and links remaining product work to open issues.

## Brand Assets

Use the shared `Logo` component with the full wordmark or icon-only variant:

```jsx
import Logo from "./components/common/Logo";

<Logo variant="logo" appearance="light" className="h-12 w-auto" />
<Logo variant="mark" appearance="dark" className="size-10" />
```

The `appearance="dark"` option selects artwork intended for dark backgrounds.

## Theme

`ThemeProvider` initializes the interface from the saved `hcms-theme` value or
the operating-system color preference. Components can read or update the theme
with `useTheme`:

```jsx
const { theme, setTheme, toggleTheme } = useTheme();
```

`ThemeToggle` is mounted in the Landing navigation and remains available as a
reusable control for future approved pages.

## Registration Entry

The Navbar, Hero, final Landing CTA, and Footer share the same role picker. Patient,
doctor, and healthcare organization options open `/register/patient`,
`/register/doctor`, and `/register/ngo`. Administrator registration is intentionally
excluded from this public entry flow.

The Landing Page supports English/Arabic, LTR/RTL, light/dark themes, and mobile
layouts. A previously observed Firefox-only decorative-corner artifact is not
treated as a layout defect unless it can be reproduced as an actual CSS issue.

## Patient Registration

The public `/register/patient` route submits the approved patient fields to
`POST /api/auth/register/patient`. It validates the National ID, optional phone,
date of birth, gender, password policy, and confirmation before sending. The
form preserves entries after validation, conflict, network, or server errors.
On a `201` response, it confirms that the Patient account is active and offers
a link to log in; registration does not start a session or return a token.

## Doctor and Organization Registration

The public `/register/doctor` and `/register/ngo` routes submit the approved
role-specific fields to `POST /api/auth/register/doctor` and
`POST /api/auth/register/ngo`. Both forms validate shared contact and password
fields; the doctor form collects specialization and license number, while the
organization form collects its name and optional registration number and address.
Neither form includes patient-only fields. Validation, duplicate, server, and
network errors preserve entered values. Successful requests show that the account
is pending administrator approval and do not create an authenticated session.

## Doctor and NGO Application Status

After submitting a professional registration, return to `/login` and enter the
same email and password to check the latest application status. The login page
shows whether the request is pending or rejected, along with the recorded
rejection reason when available. Checking status does not create a session;
approved applicants can log in normally. There is no separate status lookup or
re-application flow in this release. The response contract is documented in
`src/docs/auth-contract.md`.

## Role Home Routes and Layout

After login, patients, doctors, healthcare organizations (NGO), and administrators
are redirected to `/patient`, `/doctor`, `/ngo`, and `/admin`, respectively.
These routes require an authenticated user with the matching backend-confirmed
role. The patient route includes the health-intake form, profile information,
emergency-alert access, correction requests, and read-only doctor diagnoses.
The administrator route includes intake review, doctor assignment, workload
management, and emergency-alert assignment. The doctor route includes assigned
patient intake, private medical notes, and separate diagnoses. Each role route
shows a dashboard summary from its approved role-specific backend endpoint,
alongside the existing workspace features. NGO dashboard cards summarize its
assigned assistance requests and resource-allocation count; its feature pages
remain marked as coming soon. All four role routes use the shared
`src/presentation/layouts/RoleLayout.jsx` for the full logo, language and light/dark theme
controls, logout behavior, and the common page frame. The layout provides an
Arabic/English role-specific navigation menu with active section state and a
keyboard-accessible mobile toggle. Menu entries for documented modules whose
pages are not implemented yet are shown as disabled “Coming soon” items.
The role layout does not replace backend authorization.

Dashboard summaries load from `GET /api/patient/dashboard`,
`GET /api/doctor/dashboard`, `GET /api/ngo/dashboard`, or
`GET /api/admin/dashboard`. The screens display loading, retryable error, and
no-activity states; counts come from the backend rather than local estimates.
The dashboard feature is grouped under `src/presentation/features/role-dashboard`: its role
configuration, data-loading hook, and presentation components are kept
together. Role pages compose this feature with the shared layout. Pages access
application services through the app context; infrastructure repositories own
HTTP requests and are wired in one composition root.
Role route files are intentionally small: they apply the role layout and render
the corresponding patient, doctor, or admin workspace feature. Each workspace
feature keeps its UI in a `*WorkspaceFeature.jsx` file and its state, API calls,
and event handlers in a matching `use*Workspace.js` hook. Large UI sections live
in focused files under that feature's `components/` directory.

## Patient Health Intake

The matching backend APIs and migrations are implemented and merged into the
backend `develop` branch through PR #95. Apply the backend development
migrations before running these workflows end to end.

After login, patients can submit one self-reported health-intake form from
`/patient`. The form does not ask the patient to provide a diagnosis. Patients
can edit the submission until an administrator explicitly starts review; after
that it is read-only. The patient workspace shows the current workflow status
and lets the patient send correction requests directly to the administration.
Sending or resolving a request does not unlock the form. The backend enforces
these workflow rules and access permissions.

## Administrator Intake Review

The `/admin` workspace lists patient submissions. Opening a form does not lock
it. An administrator starts review explicitly, then may assign one or more
active doctors, each with a required internal follow-up reason. Routine
assignment prevents selecting unavailable doctors, while capacity remains an
administrative warning only. Emergency alerts can be assigned to eligible
active doctors regardless of availability or capacity. The backend enforces
these rules and assignment authorization.

## Branching

* `main` — stable version
* `develop` — development integration branch
* `feature/...` — individual feature branches

New development work should not be committed directly to `main`.

Typical workflow:

```text
develop → feature/... → develop → main
```

## Project Structure

```text
HCMS-Frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── app/                 # Routes, dependency composition, application services context
│   ├── application/         # Application-service boundary and domain checks
│   ├── domain/              # Framework-independent domain concepts
│   ├── infrastructure/      # Axios client and API/session repositories
│   ├── presentation/        # Pages, features, layouts, UI, localization, styles
│   ├── docs/
│   └── main.jsx             # Browser entry and provider composition
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

Dependencies point inward: presentation calls application services, application
depends on domain rules, and the app composition root connects application
services to infrastructure repositories. UI components and pages do not import
API repositories directly. The shared `@/` alias points to `src/`.
