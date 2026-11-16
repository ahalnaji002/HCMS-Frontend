# Sprint 10 Integration Verification

## Scope and test approach

The browser suite runs the real React routes, shared application services,
Axios client, forms, role navigation, and accessible feedback. It supplies
contract-shaped API responses at the browser boundary, so these checks verify
frontend integration and recovery behavior without writing to a shared
database. The separate live-backend test verifies real registration, login,
role authorization, and session handling; it does not claim to exercise all
Sprint 10 backend workflows.

## Acceptance coverage

| Area | Browser coverage |
|---|---|
| Doctor assistance request | `tests/browser/doctor-assistance-request.spec.js`: approved payload, required-field validation, backend validation, recoverable errors, missing Patient |
| NGO review, approval, and allocations | `tests/browser/ngo-assistance-requests.spec.js`: list/detail, loading/empty, status transitions, confirmation, completion prerequisites, conflict recovery, allocation create/edit/delete, read-only completed request |
| Emergency management | `tests/browser/admin-emergency-management.spec.js`, `tests/browser/admin-emergency-location.spec.js`, `tests/browser/patient-emergency.spec.js`: assignment, eligible Doctors, conflict/forbidden/server failures, retry, location, and public/patient dialog behavior |
| Messaging | `tests/browser/messaging.spec.js`: Patient/Doctor routes, history, read state, send payload, assignment denial/read-only state, empty and retryable errors |
| Notifications | `tests/browser/notifications.spec.js`: all supported roles, unread content, single/all read, empty and recoverable load failure |
| Patient reminders | `tests/browser/patient-reminders.spec.js`: empty/list, create/cancel, approved payloads, local-time validation, safe retry |
| Admin settings | `tests/browser/admin-system-settings.spec.js`: approved setting catalog, save/clear, validation, safe error and retry |
| Admin reports | `tests/browser/admin-reports.spec.js`: approved projections/filter, server pagination/totals, empty and retryable error |
| Role restrictions and cross-cutting feedback | `tests/browser/sprint-8.spec.js`, feature suites above: protected routes, login/session role guard, backend `403` handling, validation, conflict, `500`, network, empty, loading, retry |
| Responsive behavior | `tests/browser/responsive-consistency.spec.js`: mobile (375px), tablet (768px), laptop (1024px), desktop (1440px), menu access, active-link semantics, page overflow, and table scrolling |

## Results

Record only commands actually run and their observed outcomes here. The PR CI
run is the required full-suite result for this verification; the local live
backend test is separately gated by the repository's isolated test-database
and explicit cleanup authorization requirements.

| Check | Result |
|---|---|
| Browser suite | `$env:PLAYWRIGHT_CHANNEL = 'chrome'; npm test -- --workers=2 --reporter=line` — **302 passed** in 9.2 minutes (desktop Chromium and mobile Chromium emulation) |
| Lint | `npm run lint` — passed |
| Production build | `npm run build` — passed |
| Responsive browser check | Passed in both browser projects as part of the 302-test run; the test resized through 375px, 768px, 1024px, and 1440px |
| Live backend integration | Not run: local API port 3000 was not listening. The test also requires its explicit test-account cleanup authorization and isolated `hcms_test_db` |

## Limits

The browser feature suites use mocked API responses. They validate the
frontend's request/response wiring and user-visible behavior, but do not
replace backend API/database tests for the Sprint 10 workflows. The live test
in `tests/integration/live-backend.spec.js` currently covers auth, registration,
session restoration, one backend role-denial path, and client recovery from
simulated `500`/offline responses only. Mobile checks use Chromium device
emulation rather than physical devices.
