# Healthcare Conflict Management System — Frontend

The web interface for the **Healthcare Conflict Management System (HCMS)**, a healthcare coordination platform for patients, doctors, non-governmental organizations (NGOs), and administrators.

Built with **React, Vite, Tailwind CSS, and React Router**, the application supports Arabic and English, responsive layouts, role-specific workspaces, and API integration with the separate HCMS backend.

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
| Patient | Registration, profile, health intake, emergency alerts, care updates, and authorized diagnosis views |
| Doctor | Registration and application status, assigned-patient intake, medical notes, and individual diagnoses |
| NGO | Organization registration, application status, and role-specific workspace |
| Admin | Patient-intake review, doctor assignments, doctor availability and workload, emergency coordination, and correction requests |

The interface uses protected routes and role-aware navigation. The backend remains responsible for enforcing authorization and data access.

## Features

- **Bilingual experience:** English and Arabic localization, LTR/RTL support, language-aware typography using Inter and IBM Plex Sans Arabic.
- **Responsive design:** Shared HCMS branding, light/dark themes, mobile-friendly layouts, and role-specific workspaces.
- **Public entry flows:** Landing page, login, patient registration, and Doctor/NGO registration with application-status feedback.
- **Authentication UX:** Role-based redirects, protected routes, session restoration, logout, and user-friendly handling of API and network failures.
- **Patient workflows:** Self-reported health-intake submission and editing before review lock, emergency access, correction requests, and read-only diagnosis views.
- **Doctor workflows:** Assigned-patient intake review, private medical notes, and separately authored patient diagnoses.
- **Administrative workflows:** Explicit intake review and edit lock, multiple doctor assignments with internal reasons, doctor availability/capacity and workload indicators, emergency doctor assignment, and correction-request responses.

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
npm run test:integration
```

These tests use a live local backend and create uniquely named test accounts. The cleanup workflow uses a backend test-only script and refuses to run unless `NODE_ENV=test` and `TEST_DB_NAME=hcms_test_db` are configured.

**Database safety:** Never point integration tests at development, shared, or production databases. Check all backend `DB_*` and `TEST_DB_*` settings before running them.

For test coverage, limitations, and recorded verification, see [Sprint 8 Automated Browser Verification](src/docs/sprint-8-automated-verification.md).

## Project Structure

The following is a concise map of verified directories and entry points, not an exhaustive file tree:

```text
HCMS-Frontend/
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
│   │   └── sprint-8-automated-verification.md
│   └── main.jsx
├── tests/
│   ├── browser/
│   └── integration/
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
