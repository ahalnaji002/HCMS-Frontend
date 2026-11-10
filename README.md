# Healthcare Conflict Management System — Frontend

[![Frontend CI](https://github.com/ahalnaji002/HCMS-Frontend/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/ahalnaji002/HCMS-Frontend/actions/workflows/ci.yml)

The web interface for the **Healthcare Conflict Management System (HCMS)**, a healthcare coordination platform for patients, doctors, non-governmental organizations (NGOs), and administrators.

Built with **React, Vite, Tailwind CSS, and React Router**, the application supports Arabic (default) and English, responsive layouts, role-specific workspaces with one page per section, and API integration with the separate HCMS backend.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [API Integration](#api-integration)
- [Getting Started](#getting-started)
- [Testing & Quality](#testing--quality)
- [Project Structure](#project-structure)
- [Related Repository](#related-repository)

## Overview

HCMS provides role-specific experiences for:

| Role | Frontend experience |
| --- | --- |
| Patient | Registration, profile, health intake, medical record, treatment plans, medications and appointments, diagnoses, and an always-visible emergency button with GPS location |
| Doctor | Registration and application status, assigned-patient file (intake, medical record, treatment plans, medications, appointments, diagnoses, notes) |
| NGO | Organization registration, application status, and dashboard summary (feature pages planned for Sprint 10) |
| Admin | Emergency alerts with call and map links, patient-intake review, doctor assignments, availability and workload, join-request review, and correction requests |

The interface uses protected routes and role-aware navigation. The backend remains responsible for enforcing authorization and data access.

## Features

- **Bilingual experience:** Arabic (default for first-time visitors) and English localization, LTR/RTL support, language-aware typography using Inter and IBM Plex Sans Arabic.
- **Responsive design:** Shared HCMS branding, light/dark themes, mobile-friendly layouts, and role-specific workspaces.
- **Navigation:** One routed page per section (for example `/patient/treatment-plans`, `/admin/emergency-alerts`), a sidebar that highlights the current page and lists only built screens, and a "Needs your attention" panel on each overview.
- **Public entry flows:** Landing page, login, patient registration, and Doctor/NGO registration with application-status feedback.
- **Authentication UX:** Role-based redirects, protected routes, session restoration, logout, rate-limit (429) messages, and user-friendly handling of API and network failures. Server error messages are translated; unknown server text is never shown raw.
- **Patient workflows:** Self-reported health-intake submission and editing before review lock, read-only medical record, treatment plans, medications and appointments, correction requests, diagnosis views, and an emergency dialog with the profile phone pre-filled and GPS location.
- **Doctor workflows:** Assigned-patient intake review, medical record management, treatment plans with medications and appointments, private medical notes, and separately authored patient diagnoses.
- **Administrative workflows:** Join-request review, explicit intake review and edit lock, multiple doctor assignments with internal reasons, doctor availability/capacity and workload indicators, emergency doctor assignment with call and map links, correction-request responses, and action feedback that stays visible while scrolling.

These features describe the documented frontend implementation on `develop`; they do not imply that every backend capability has a corresponding completed UI.

## Tech Stack

| Area | Technology |
| --- | --- |
| UI | React 19 |
| Build and development | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| HTTP requests | Axios |
| Internationalization | i18next, react-i18next |
| Fonts | Fontsource: Inter and IBM Plex Sans Arabic |
| Browser testing | Playwright |
| Code quality | ESLint |
| Continuous integration | GitHub Actions (lint, build, Playwright) |

## System Architecture

The frontend separates application setup, use-case coordination, domain concepts, infrastructure integration, and presentation.

```text
src/
├── app/              Application composition and routing
├── application/      Application-level workflows
├── domain/           Domain-level concepts
├── infrastructure/   External integration and implementations
└── presentation/     UI, styles, localization, and context
```

`application/` is a deliberately thin service boundary: it unwraps HTTP responses into plain payloads and guards role-dependent calls, while business rules stay in the backend. Each role is mounted at `/<role>/*`, and its `*WorkspaceFeature.jsx` declares the sub-routes and shares workspace data between pages (see `PROJECT_HANDOFF.md` for the route table).

The entry point is `src/main.jsx`, which initializes localization and mounts the application with the router and application providers. `src/app/App.jsx` defines the main application component.

This directory map describes the repository's organization; it is not a claim that every user interaction follows an identical dependency path.

## API Integration

The frontend communicates with the separately maintained HCMS backend through an API base URL configured in `VITE_API_URL`.

Example local environment:

```dotenv
VITE_API_URL=http://localhost:3000
```

See the [backend API documentation](https://github.com/ahalnaji002/HCMS-Backend/blob/develop/docs/api/README.md) and [frontend integration guide](https://github.com/ahalnaji002/HCMS-Backend/blob/develop/FRONTEND_INTEGRATION.md) for request contracts, endpoints, and backend access rules.

## Getting Started

### Prerequisites

- Node.js and npm
- Git
- A running HCMS backend for live API-driven workflows

### 1. Clone the repository

```bash
git clone https://github.com/ahalnaji002/HCMS-Frontend.git
cd HCMS-Frontend
git checkout develop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API URL

Create a local `.env` file using [`.env.example`](.env.example) as a reference:

```dotenv
VITE_API_URL=http://localhost:3000
```

Do not commit local environment files or secrets. Values exposed through Vite's `VITE_*` prefix are available to browser code and must not contain private credentials.

### 4. Start the development server

```bash
npm run dev
```

The default local development URL is `http://localhost:5173`.

### Other commands

```bash
npm run build
npm run lint
npm run preview
```

## Testing & Quality

The repository includes two distinct Playwright test modes. **They provide different evidence and must not be treated as interchangeable.**

### Browser regression tests (mocked API)

Install the browser once, then run:

```bash
npx playwright install chromium --no-shell
npm test
```

The default configuration uses `tests/browser/`, starts an isolated Vite server at `http://127.0.0.1:4178`, and runs desktop and mobile Chromium projects.

Tests start in English through `tests/fixtures/english-browser-state.json`; the application itself defaults to Arabic, which `default-language.spec.js` verifies.

The browser suite exercises the React application, routes, forms, session handling, and UI recovery behavior with **synthetic API contract fixtures**. Unmatched API calls are blocked. It does **not** test live backend authorization, database operations, or production deployment.

Useful commands:

```bash
npm run test:headed
npx playwright show-report
```

On Windows, if bundled Chromium cannot start, use installed Chrome in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test
```

### Local backend integration tests

The integration configuration uses `tests/integration/` and a separate Vite server on port **4179**.

Before running these tests, start the backend locally in `NODE_ENV=test` with an isolated, migrated test database. Keep the backend repository alongside the frontend repository in the project workspace.

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
$env:HCMS_ALLOW_INTEGRATION_ACCOUNT_CLEANUP = 'I_CONFIRM_LOCAL_HCMS_TEST_DB_CLEANUP'
npm run test:integration
```

These tests use a live local backend and create uniquely named test accounts. The cleanup workflow uses a backend test-only script and refuses to run unless `NODE_ENV=test`, `TEST_DB_NAME=hcms_test_db`, and the explicit `HCMS_ALLOW_INTEGRATION_ACCOUNT_CLEANUP` confirmation shown above are configured.

**Database safety:** Never point integration tests at development, shared, or production databases. Check all backend `DB_*` and `TEST_DB_*` settings before running them.

### Continuous integration

Every push and pull request to `develop` or `main` runs lint, the production build, and the full Playwright suite on desktop and mobile Chromium (`.github/workflows/ci.yml`). The report and traces are uploaded when a test fails.

For test coverage, limitations, and recorded verification, see [Sprint 8 Automated Browser Verification](src/docs/sprint-8-automated-verification.md). Sprint 10 developers should start with [`src/docs/ux-review-handoff.md`](src/docs/ux-review-handoff.md) and [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md).

## Project Structure

The following is a concise map of verified directories and entry points, not an exhaustive file tree:

```text
HCMS-Frontend/
├── .github/
│   └── workflows/ci.yml
├── public/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   └── applicationServices.js
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   ├── docs/
│   │   ├── sprint-8-automated-verification.md
│   │   └── ux-review-handoff.md
│   └── main.jsx
├── tests/
│   ├── browser/
│   ├── fixtures/
│   └── integration/
├── PROJECT_HANDOFF.md
├── .env.example
├── package.json
├── playwright.config.js
├── playwright.integration.config.js
├── vite.config.js
└── README.md
```

## Related Repository

**[HCMS Backend](https://github.com/ahalnaji002/HCMS-Backend)** — Node.js/Express REST API, database migrations, and backend documentation.

---

Developed collaboratively as a Computer Engineering graduation project.
