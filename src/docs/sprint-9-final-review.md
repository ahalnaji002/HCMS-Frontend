# Sprint 9 Frontend — Final Review

This review is based on the Sprint 9 Patient and Doctor work present on
`develop` after Issue 9.13, with one navigation correction made during this
review. It describes the frontend implementation and its verified boundaries;
the approved Backend API documentation and implementation remain the authority
for endpoint behavior, response shapes, and authorization.

## Screens and routes

| Screen | Route and role | Delivered interface |
| --- | --- | --- |
| Patient workspace | `/patient` — authenticated `PATIENT` | Role dashboard; own intake and correction requests; profile view/edit; own medical record read view; own treatment plans with read-only details, medications, and appointments; active Doctor assignments and diagnoses; emergency-alert list/create. |
| Doctor workspace | `/doctor` — authenticated `DOCTOR` | Role dashboard; assigned-patient list and selection; selected patient's intake, medical record, diagnoses, notes, treatment plans, medications, and appointments. Supported Doctor changes are limited to the documented operations below. |

`RequireRole` redirects unauthenticated users to `/login` and routes an
authenticated user to their own role path. These redirects support navigation
only; Backend authentication, ownership checks, active-assignment checks, and
RBAC are the security boundary. The full route table, including public and
other-role routes, is in `src/app/App.jsx` and `src/presentation/routing/roleRoutes.js`.

The Patient and Doctor workspaces share `RoleLayout` and the role-dashboard
feature. The UI exposes only implemented navigation links; disabled entries
remain marked “Coming soon”. Sprint 9 does not deliver NGO or Administrator
workspaces as part of its Patient/Doctor scope.

## API dependencies

Requests use the shared Axios client at `src/infrastructure/http/apiClient.js`;
the backend base URL comes from `VITE_API_URL`. Feature repositories are
injected through application services rather than called directly from the
screen components.

| Area | Frontend API dependencies |
| --- | --- |
| Patient dashboard and workspace | `GET /api/patient/dashboard`; `GET/POST/PUT /api/patient/intake`; `GET/PATCH /api/profile`; `GET /api/patient/medical-record`; `GET /api/patient/doctor-assignments`; `GET /api/patient/diagnoses`; `GET/POST /api/patient/emergency-alerts`; `GET/POST /api/patient/intake-correction-requests`. |
| Patient treatment | `GET /api/patient/treatment-plans` and `GET /api/patient/treatment-plans/:planId`; read-only `GET` of each plan's `/medications` and `/appointments`. |
| Doctor dashboard and workspace | `GET /api/doctor/dashboard`; `GET /api/doctor/patients`; selected patient `GET` of `/intake`, `/medical-notes`, `/diagnoses`, and `/medical-record`; supported medical-record `POST/PATCH`, medical-note `POST`, and diagnosis `POST`. |
| Doctor treatment | Patient-scoped plan `GET/POST/PATCH` at `/api/doctor/patients/:patientId/treatment-plans` and its `/:planId`; plan medication and appointment `GET/POST/PATCH/DELETE` under `/api/doctor/treatment-plans/:planId/{medications,appointments}` and their resource IDs. |

This is a screen dependency summary, not a replacement for
[`sprint-9-1-api-contract.md`](./sprint-9-1-api-contract.md), which records the
approved request/response details, role and assignment rules, date/time
semantics, and endpoint-specific error behavior. The frontend does not add
endpoints or move authorization/business rules out of the Backend.

## Reusable implementation patterns

- `apiClient.js` centralizes `VITE_API_URL`, bearer-token attachment, and
  clearing the stored token on an authenticated `401`.
- `createApplicationServices` and the application-services context inject
  feature repositories. Patient and Doctor hooks own loading, draft, mutation,
  success, and error state; presentational section components render it.
- Patient and Doctor treatment-plan sections use separate role-specific
  repositories and screens. Patient views are read-only; Doctor mutations
  follow the documented assignment-protected API operations.
- Doctor navigation links for treatment plans, medications, and appointments
  now point to the implemented `#doctor-treatment-plans` section. The final
  review caught that these three entries were still disabled after the screen
  shipped; a browser assertion now checks all three links.
- Patient-scoped Doctor data is cleared when selection changes and when an
  access-denied response indicates assignment access was lost. Browser tests
  cover switching patients and denied access to treatment data.
- Form labels, visible validation feedback, `role="alert"`/`role="status"`
  messages, retry actions, and explicit empty states are used in relevant
  workflows. The shared role layout provides responsive navigation, language
  and theme toggles, and an account menu.

## Requirements, responsive behavior, and accessibility review

- The reviewed role routes require the expected authenticated role, while
  actual access remains enforced by the Backend.
- `RoleLayout` changes its navigation presentation for small screens, exposes
  its expanded state and controlled navigation element, and uses visible
  keyboard-focus outlines on its controls and links. The page language setup
  switches document direction between LTR and RTL.
- Sprint 9 browser tests are configured to run in the Playwright `chromium` and
  `mobile-chromium` projects (Desktop Chrome and Pixel 7 device emulation).
  The previously completed suite verified workflows in both browser projects;
  the navigation regression assertion added during this review still requires
  a completed test run. This is not a visual comparison at every viewport size.
- Source review found accessible labels/landmarks and focus states in shared
  navigation and key Sprint 9 forms. Several buttons use `min-h-10` (40px),
  while others use `min-h-11` (44px); a formal touch-target audit has not been
  performed. No automated WCAG/axe audit or assistive-technology review is
  claimed.

## Verification evidence and limitations

The last completed full suite was run on the merged Sprint 9 implementation
before this review's navigation correction. Other results below identify
whether they were recorded before or after that correction:

| Command | Result |
| --- | --- |
| `npm test -- --workers=2 --reporter=line` | Passed before this review: 134 browser tests across desktop Chromium and mobile Chromium. |
| `npm test -- --list` | Passed during this review; discovered all 134 tests, including the Doctor workflow test that contains the navigation assertion. This lists tests but does not execute them. |
| Focused and full `npm test` runs after the navigation fix | Started the Playwright web-server step but stalled before test-case output; interrupted and not counted as pass. |
| `npm run lint` | Passed after the Doctor navigation fix. |
| `npm run build` | Passed after the Doctor navigation fix. |
| `git diff --check` | Passed after the code and documentation changes. |

Browser test execution was attempted several times during this review after
the navigation assertion was added, including the focused Doctor workflow
spec. Those invocations started the Playwright web-server step but did not
produce test-case output; they were interrupted and are not counted as
successful verification. `npm test -- --list` completed and discovered 134
tests, but listing tests is not execution. The last completed full run is the
134-pass result above from before the navigation correction. Lint, build, and
diff checks have now passed after the correction.

Playwright browser tests stub API responses. The Backend at
`http://localhost:3000` was unavailable during the preceding integration run;
no live Backend/database integration result is claimed. The separate
`npm run test:integration` suite was not run for this review.

The Sprint 9 API reference also records a remaining timezone verification point
for Patient profile date serialization on the Backend's JavaScript `Date`
driver path, and an unresolved DST gap/repeated-wall-time policy if appointments
are ever interpreted as absolute instants. The current UI preserves the
approved date-only and `Asia/Hebron` wall-clock string contracts; this review
does not change those contracts or infer new Backend behavior.

## Review conclusion

Sprint 9 frontend scope is documented as implemented on `develop`, and the
review-caught Doctor navigation gap has been corrected in this branch. The
latest completed full browser run passed 134 tests before that small
navigation-only correction; lint, build, and diff checks pass after it. Browser
execution after the correction stalled in this environment and remains a
verification limitation. This review does not claim live Backend verification,
full visual coverage at all viewport sizes, or a formal accessibility
conformance audit. Known verification gaps remain explicitly listed above.
