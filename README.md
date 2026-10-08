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

## Backend Connection

The frontend communicates with the HCMS Backend API using Axios.

The API base URL is configured through:

```env
VITE_API_URL=http://localhost:3000
```

The shared Axios configuration is located at:

```text
src/services/api.js
```

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
patient intake, private medical notes, and separate diagnoses. The NGO route
still displays a localized placeholder. All four role routes use the shared
`src/layouts/RoleLayout.jsx` for the full logo, language and light/dark theme
controls, logout behavior, and the common page frame; each route can set its
own content width.
The role layout does not replace backend authorization.

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
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```
