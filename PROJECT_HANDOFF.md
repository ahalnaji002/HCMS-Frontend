# HCMS Frontend — Project Handoff

## Project Purpose

HCMS is a frontend for the Healthcare Conflict Management System.

The project uses React, Vite, Tailwind CSS, React Router, and Axios.
The current Sprint 8 work builds the authentication foundation and interfaces
before role-based dashboards and HCMS features.

## Technology Stack

- React 19
- Vite 8
- React Router 7
- Tailwind CSS 4
- Axios
- Git and GitHub

## Running the Project

From the project folder, run:

```bash
npm run dev
```

Then open the local address shown by Vite, usually:

```text
http://localhost:5173
```

## Styling Setup

Tailwind CSS is enabled through:

- `vite.config.js` using `@tailwindcss/vite`.
- `src/index.css` using:

```css
@import "tailwindcss";
```

## Routing

`src/main.jsx` wraps the application with `BrowserRouter`.

`src/App.jsx` currently defines:

| URL | Behavior |
| --- | --- |
| `/` | Redirects to `/login` |
| `/login` | Displays the login page |
| `/register/patient` | Displays the patient-registration page |

Doctor and NGO registration routes will be added in Issue 8.5.

Password recovery and password-reset routes are intentionally excluded from the
current release.

## Authentication Contract

The approved frontend/backend contract is documented in:

```text
src/docs/auth-contract.md
```

This document is the source of truth for:

- Approved authentication endpoints.
- JWT handling.
- Roles.
- Account states.
- Registration requirements.
- API response and error behavior.
- Public and protected routes.

Do not invent endpoints, request fields, response fields, or permissions that
are not approved in the contract.

## Current Authentication Pages

### `src/pages/auth/Login.jsx`

The Login page includes:

- Controlled email and password fields using React `useState`.
- Local validation for required fields.
- A submit handler that currently logs valid data to the browser console.
- A React Router link to `/register/patient`.
- Temporary Doctor and NGO registration links until their pages exist.

The page is not connected to the backend login endpoint yet.
That work belongs to Issue 8.3.

### `src/pages/auth/RegisterPatient.jsx`

The Patient Registration page includes:

- Full name.
- Email.
- Optional Palestinian phone number.
- National ID.
- Date of birth.
- Gender.
- Address.
- Password.
- Password confirmation.

The page includes local validation for:

- Required fields.
- Palestinian phone numbers beginning with `059` or `056`.
- A nine-digit national ID that does not begin with zero.
- A date of birth that is not in the future.
- A strong password.
- Matching password confirmation.

The page is not connected to the backend yet.
The backend integration belongs to Issue 8.4.

## API Layer

### `src/services/api.js`

This file creates the shared Axios client.

It:

- Reads the API URL from `VITE_API_URL`.
- Retrieves `hcms_access_token` from `localStorage`.
- Adds the token to authenticated requests through:

```http
Authorization: Bearer <token>
```

### `src/services/auth.js`

This file contains authentication-related API functions.

It currently includes:

- `registerPatient(patientData)`

The function sends a request to:

```http
POST /api/auth/register/patient
```

More shared authentication functions will be added in Issue 8.2.

## Authentication Status

| Area | Status | Related Issue |
| --- | --- | --- |
| Authentication contract | Complete | 8.1 |
| Existing frontend audit | Complete | 8.1 |
| Shared API foundation | In progress | 8.2 |
| Login API integration | Not started | 8.3 |
| Patient registration API integration | Not started | 8.4 |
| Doctor and NGO registration | Not started | 8.5 |
| Pending and rejected approval pages | Not started | 8.6 |
| Protected and role-restricted routes | Not started | 8.7 |
| Shared role-based layouts | Not started | 8.8 |
| Role dashboards | Not started | 8.9 |

## Git Repository

Remote repository:

```text
https://github.com/ahalnaji002/HCMS-Frontend.git
```

Current development branch:

```text
feature/auth-pages
```

Before committing changes, check the working tree:

```bash
git status
```

## Next Step

Continue with Issue 8.2:

1. Complete the shared Axios API client.
2. Add shared authentication functions for login and current user.
3. Add centralized handling for unauthorized requests.
4. Prepare a reusable authentication state foundation.