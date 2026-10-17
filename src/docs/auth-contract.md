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
- Displaying the latest Doctor or NGO application status returned by login.

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

Protected routes require an authenticated session and enforce the required
user role. The frontend route guard is implemented:

- While the session is loading, the route shows a loading state.
- If the user is not authenticated, the route redirects to `/login`.
- If the authenticated user's role does not match the route, the user is
  redirected to the home route for their own role.
- If the role matches, the route renders its page.

The protected role routes are:

| Route | Required role |
| --- | --- |
| `/patient` | `PATIENT` |
| `/doctor` | `DOCTOR` |
| `/ngo` | `NGO` |
| `/admin` | `ADMIN` |

The route guard protects access; the contents and feature coverage of each
role's pages are documented and delivered separately from this authentication
contract.

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

The request requires `full_name`, `email`, `password`,
`password_confirmation`, `national_id`, `date_of_birth`, and `gender`. Optional
fields are `phone` and `address`. The frontend validates the same approved
constraints as the backend: National ID is nine digits and does not start with
zero; a supplied phone has ten digits and starts with `059` or `056`; date of
birth is a valid non-future `YYYY-MM-DD` date; gender is `MALE` or `FEMALE`;
password has at least eight characters, an uppercase letter, a lowercase
letter, and a digit; confirmation matches; and address is at most 255
characters. Email must be valid, full name at most 150 characters, and email
at most 255 characters. Passwords over 72 UTF-8 bytes are rejected by the
backend.

The frontend displays backend `400` field errors next to their fields and a
recoverable `409` conflict message for duplicate email or National ID. A
successful `201` response displays the active-account outcome and a link to
login. It does not store a token or start an authenticated session.

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

Doctor and NGO applicants can check their latest status from the login page by
submitting the same email and password used at registration. The backend checks
the credentials first. For valid credentials belonging to an inactive
professional account, `POST /api/auth/login` returns `403` without a token and
includes `data.application` only when the latest Join Request is `PENDING` or
`REJECTED`:

```json
{
  "success": false,
  "message": "Account is not active",
  "data": {
    "application": {
      "request_type": "DOCTOR",
      "status": "PENDING",
      "rejection_reason": null,
      "submitted_at": "2026-10-08T09:30:00.000Z",
      "reviewed_at": null
    }
  }
}
```

For a rejected request, `status` is `REJECTED`, `rejection_reason` contains
the administrator's recorded reason, and `reviewed_at` may be populated. The
frontend displays this response on the login page and creates no session. A
wrong email or password returns `401` and must never display application data.
Other inactive or suspended accounts continue to receive the generic inactive
account message. Successful login remains the only outcome for active accounts.

There is no separate status-lookup endpoint. The frontend must not store or
infer application status across login attempts, provide a re-application flow,
or assume email notifications are sent.

HTTP authentication and authorization errors are separate from both status
models:

| HTTP status | Meaning |
| --- | --- |
| `401 Unauthorized` | The request does not contain valid credentials or a valid token. |
| `403 Forbidden` | Login credentials may be valid for an inactive account; professional applicants can receive the documented `data.application` projection. Other forbidden responses remain generic. |

## JWT Handling

The token is saved in `localStorage` under this key:

```js
hcms_access_token
```

Authenticated requests must send:

```http
Authorization: Bearer <token>
```

If a request receives `401 Unauthorized`, the shared Axios interceptor removes
the saved token. During application-start session restoration, `AuthProvider`
also clears its authenticated-user state after a `401`; `RequireRole` then
redirects an unauthenticated visitor to `/login`. The current interceptor does
not itself navigate or synchronously reset React context for every in-session
request, so the backend remains the authority for rejecting expired or invalid
tokens.

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
| Public and role-restricted routes | Complete | 8.7 |
| Login API integration | Complete | 8.3 |
| Patient registration API integration | Complete | 8.4 |
| Doctor and NGO registration | Complete | 8.5 |
| Shared API client | Complete | 8.2 |
| Authenticated-user state | Complete | 8.2 |
| Approval-status views | Complete; shown after credential verification on login | 8.6 |
| Shared role workspace layout and role navigation | Complete; localized role-specific menus show unavailable modules as disabled | 8.8 |
| Initial role dashboards | Complete; API-backed role summaries include loading, empty, and retryable error states | 8.9 |
| Responsive authentication and layout baseline | Complete; evidence is in `sprint-8-responsive-verification.md` | 8.10 |
| Sprint 8 integration verification | Complete; evidence and known limits are in `sprint-8-integration-verification.md` | 8.11 |
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
