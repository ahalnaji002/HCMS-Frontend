# HCMS Authentication Contract

## Purpose

This document defines the authentication contract between the HCMS frontend
and the approved backend API.

The frontend must follow this document when implementing API requests,
authentication state, routes, and role-based access.

## Scope

The current release includes:

- Login.
- Patient registration.
- Doctor registration.
- NGO registration.
- Reading the authenticated user.
- JWT storage and transmission.
- Logout on the frontend.
- Pending and rejected approval states for Doctor and NGO accounts.

Password recovery and password reset are outside the current release scope.

The frontend must not build or connect Forgot Password or Reset Password flows.

## API Base URL

The API base URL comes from the environment file:

```env
VITE_API_URL=http://localhost:3000
```

The frontend reads the value through:

```js
import.meta.env.VITE_API_URL
```

## API Response Format

Successful backend responses use this general structure:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Validation errors use this general structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

The frontend must handle validation errors, unauthorized requests, forbidden
requests, and general server errors.

## Roles

The approved system roles are:

- `PATIENT`
- `DOCTOR`
- `NGO`
- `ADMIN`

A user must only see pages and actions allowed for their role.

## Public Routes

These routes are available before login:

| Route | Purpose |
| --- | --- |
| `/login` | Login interface |
| `/register/patient` | Patient registration |
| `/register/doctor` | Doctor registration |
| `/register/ngo` | NGO registration |

## Protected Routes

Protected routes require a valid JWT token.

The frontend will later protect:

- Patient dashboard.
- Doctor dashboard.
- NGO dashboard.
- Admin dashboard.
- Profile pages.
- Role-specific HCMS features.

If no valid token exists, redirect the user to `/login`.

## API Endpoints

| Action | Method | Endpoint |
| --- | --- | --- |
| Login | `POST` | `/api/auth/login` |
| Current authenticated user | `GET` | `/api/auth/me` |
| Patient registration | `POST` | `/api/auth/register/patient` |
| Doctor registration | `POST` | `/api/auth/register/doctor` |
| NGO registration | `POST` | `/api/auth/register/ngo` |

## Login

### Request Body

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Expected Frontend Behavior

After successful login:

1. Read the JWT token from the backend response.
2. Save the token in `localStorage`.
3. Load or save authenticated-user data.
4. Redirect the user to the dashboard matching their role.

## Patient Registration

### Request Body

```json
{
  "full_name": "Ahmed Shakshak",
  "email": "ahmed@example.com",
  "phone": "0591234567",
  "national_id": "123456789",
  "date_of_birth": "2004-12-19",
  "gender": "MALE",
  "address": "Hebron",
  "password": "Password123",
  "password_confirmation": "Password123"
}
```

A Patient account becomes active after successful registration.

## Doctor Registration

Doctor registration requires the approved doctor fields, including:

- Full name.
- Email.
- Password and password confirmation.
- Specialization.
- Unique license number.

A Doctor account requires approval and starts in the Pending state.

## NGO Registration

NGO registration requires the approved NGO fields, including:

- Full name.
- Email.
- Password and password confirmation.
- Organization name.

An NGO account requires approval and starts in the Pending state.

## Account States

| State | Meaning | Frontend behavior |
| --- | --- | --- |
| Active | The account is approved. | Redirect to the role dashboard. |
| Pending | The account awaits approval. | Show a pending-approval page. |
| Rejected | The account request was rejected. | Show a rejected-approval page and backend message if available. |

Pending and Rejected states apply to Doctor and NGO accounts.

## JWT Handling

The token is saved in `localStorage` under this key:

```js
hcms_access_token
```

Authenticated requests must send:

```http
Authorization: Bearer <token>
```

If the backend returns `401 Unauthorized`, the frontend must:

1. Remove the saved token.
2. Clear authenticated-user state.
3. Redirect to `/login`.

## Logout

Logout is a frontend-only action in the current release.

When the user logs out:

1. Remove `hcms_access_token` from `localStorage`.
2. Clear authenticated-user state.
3. Redirect to `/login`.

No backend logout endpoint is used in the current release.

## Current Frontend Audit

| Area | Current status | Next issue |
| --- | --- | ---|
| React, Vite, and Tailwind setup | Complete | — |
| Public routes | Basic routes exist | 8.7 |
| Login interface | Local validation exists | 8.3 |
| Patient registration | Local form and validation exist | 8.4 |
| Doctor and NGO registration | Not implemented | 8.5 |
| Shared API client | Basic Axios setup exists | 8.2 |
| Authenticated-user state | Not implemented | 8.2 |
| Pending and rejected pages | Not implemented | 8.6 |
| Role-based layouts and dashboards | Not implemented | 8.8 and 8.9 |
| Password recovery | Excluded from scope | Do not implement |

## Rules for Frontend Development

- Do not invent backend endpoints.
- Do not invent request fields or response fields.
- Do not assume permissions that the backend has not approved.
- Send the JWT through the `Authorization: Bearer <token>` header.
- Keep API calls inside API or service modules.
- Use the approved backend documentation as the source of truth.