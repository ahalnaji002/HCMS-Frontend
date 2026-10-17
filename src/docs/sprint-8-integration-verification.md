# Sprint 8.11 Integration Verification

## Scope and environment

This record covers the implemented Sprint 8 authentication and role-layout
integration against the local HCMS Backend `develop` branch. It records
observed behaviour only; it does not add an API endpoint, change the backend
contract, or claim unsupported behaviour.

- Frontend branch: `feature/8-11-integration-testing` at `de62dda`.
- Backend branch: `develop` at `bea6138`.
- Backend base URL: `http://localhost:3000`.
- Frontend development server: `http://127.0.0.1:5173`.
- Local MySQL database was migrated and seeded before testing.
- Test accounts created during this verification use `@hcms.test` addresses
  and are local database data only.

## Live API verification

The following checks were run against the live backend on 2026-10-17. No
access tokens, passwords, or local secrets are recorded here.

| Scenario | Route / action | Expected result | Observed result |
| --- | --- | --- | --- |
| Anonymous current user | `GET /api/auth/me` without a bearer token | `401` | Passed: `401` |
| Invalid login request | `POST /api/auth/login` with invalid required values | `400` | Passed: `400` |
| Unknown credentials | `POST /api/auth/login` | `401` | Passed: `401` |
| Patient registration | `POST /api/auth/register/patient` with valid data | `201` | Passed: `201` |
| Duplicate patient data | Repeat the Patient registration | `409` | Passed: `409` |
| Patient authentication | Login, then `GET /api/auth/me` with its token | `200` and Patient user | Passed: both requests returned `200` |
| Role restriction | Patient token requests `GET /api/admin/join-requests` | `403` | Passed: `403` |
| Doctor registration | `POST /api/auth/register/doctor` | `201`; account is inactive and Join Request is pending | Passed: `201` |
| Pending Doctor login | Valid Doctor credentials before approval | `403` with `data.application.status = PENDING`, no session | Passed |
| NGO registration | `POST /api/auth/register/ngo` | `201`; account is inactive and Join Request is pending | Passed: `201` |
| Pending NGO login | Valid NGO credentials before review | `403` with `data.application.status = PENDING`, no session | Passed |
| Administrator review | Admin lists pending requests, approves Doctor request | `200`; Join Request becomes `APPROVED`, account becomes `ACTIVE` | Passed |
| Approved Doctor | Doctor logs in and calls `GET /api/auth/me` after approval | both requests return `200` | Passed |
| Rejected NGO | Admin rejects NGO request with a reason, then NGO logs in | `403` with `data.application.status = REJECTED` and rejection reason | Passed |

These checks distinguish the two state models correctly: `PENDING`,
`APPROVED`, and `REJECTED` are Join Request states. A newly registered Doctor
or NGO has a User Account with `INACTIVE` status; approval changes that User
Account to `ACTIVE`.

## Frontend integration coverage

- Login sends requests through the shared Axios client and redirects a
  successful active user using the returned backend role.
- `AuthProvider` restores a saved session with `GET /api/auth/me`; a `401`
  clears the saved token and authenticated user state.
- `RequireRole` redirects an unauthenticated visitor to `/login` and redirects
  an authenticated user who opens another role's route to that user's own
  role route. This is a user-experience guard; backend role authorization was
  independently verified by the Patient-to-admin `403` check above.
- Logout is intentionally frontend-only: it clears the stored token and user
  state, then navigates to `/login`. The approved backend contract has no
  logout or token-revocation endpoint.
- Login and registration forms provide client-side required-field validation.
  Backend `400`, `401`, `403`, `409`, network, and server-error categories are
  mapped by `normalizeApiError` to user-facing states. The live checks above
  exercised `400`, `401`, `403`, and `409`.
- Responsive public auth screens and the shared role layout were visually
  verified in English and Arabic at `360x800`, `768x1024`, `1024x768`, and
  `1440x900`. The detailed evidence is in
  [Sprint 8.10 Responsive Verification](./sprint-8-responsive-verification.md).

## Known limitations and follow-up

- The frontend has no configured automated test runner and no `test` script.
  This issue therefore records manual/live integration evidence rather than
  claiming automated tests exist or pass.
- The network-error presentation was reviewed in the frontend error mapper but
  was not reproduced by stopping the local backend during this run.
- No intentional `500` response was induced against the shared backend. The
  frontend maps a received `5xx` response to its generic server-error state;
  a safely reproducible backend failure fixture is needed before treating this
  scenario as live-tested.
- The backend now exposes the latest `PENDING` or `REJECTED` Join Request
  projection only after valid Doctor or NGO credentials are submitted to the
  login endpoint. There is no separate application-status lookup endpoint.
- Re-application after rejection and email notifications remain future
  enhancements. They were not implemented, inferred, or treated as successful
  integration behaviour.

## Build verification

The following frontend commands were run successfully on 2026-10-17:

```powershell
npm run lint
npm run build
git diff --check
```
