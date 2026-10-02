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
- The documented registration outcome for Doctor and NGO accounts.

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

The frontend currently provides role-specific placeholder routes while the full
dashboards are pending:

| Route | Required role |
| --- | --- |
| `/patient` | `PATIENT` |
| `/doctor` | `DOCTOR` |
| `/ngo` | `NGO` |
| `/admin` | `ADMIN` |

The full role dashboards and feature pages will be implemented later:

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

A Doctor registration creates two separate records:

- The User Account starts as `INACTIVE`.
- The Join Request starts as `PENDING`.

When an administrator approves the request, the Join Request becomes
`APPROVED` and the User Account becomes `ACTIVE`.

## NGO Registration

NGO registration requires the approved NGO fields, including:

- Full name.
- Email.
- Password and password confirmation.
- Organization name.

An NGO registration creates two separate records:

- The User Account starts as `INACTIVE`.
- The Join Request starts as `PENDING`.

When an administrator approves the request, the Join Request becomes
`APPROVED` and the User Account becomes `ACTIVE`.

## User Account Status and Join Request Status

User Account Status and Join Request Status are different backend concepts.
The frontend must never use one as though it were the other.

### User Account Status

| Status | Meaning |
| --- | --- |
| `INACTIVE` | A newly registered Doctor or NGO cannot access authenticated features. |
| `ACTIVE` | The account is enabled after the associated Join Request is approved. |

### Join Request Status

| Status | Meaning |
| --- | --- |
| `PENDING` | The Doctor or NGO registration awaits administrator review. |
| `APPROVED` | The administrator approved the request; the associated User Account becomes `ACTIVE`. |
| `REJECTED` | The administrator rejected the request. This is not a User Account Status. |

## Current Frontend Visibility of Approval Status

`POST /api/auth/login` must be handled only according to its documented backend
response. The frontend must not infer a Join Request status from a failed login
or assume that login returns `PENDING`, `APPROVED`, `REJECTED`, or a rejection
reason.

The current frontend contract does not document an endpoint or response field
that exposes a Doctor or NGO Join Request status or rejection reason to the
applicant. Do not build a status lookup, rejected-account screen, or
re-application flow until the backend documents the required API behavior.

HTTP authentication and authorization errors are separate from both status
models:

| HTTP status | Meaning |
| --- | --- |
| `401 Unauthorized` | The request does not contain valid credentials or a valid token. |
| `403 Forbidden` | The authenticated request is not permitted to perform the requested action. |

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
| Approval-status views | Not implemented; wait for a documented applicant-facing backend contract | 8.6 |
| Role-based layouts and dashboards | Not implemented | 8.8 and 8.9 |
| Password recovery | Excluded from scope | Do not implement |

## Rules for Frontend Development

- Do not invent backend endpoints.
- Do not invent request fields or response fields.
- Do not assume permissions that the backend has not approved.
- Send the JWT through the `Authorization: Bearer <token>` header.
- Keep API calls inside API or service modules.
- Use the approved backend documentation as the source of truth.

## Future Enhancements

The following items are not implemented in the current release and must not be
assumed by Sprint 8:

- A Doctor or NGO re-application flow after a rejected Join Request, including
  retaining previous request history.
- Email notifications when a Join Request is approved or rejected.
