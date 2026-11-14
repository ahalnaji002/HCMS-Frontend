# Sprint 10.2 — Doctor Assistance Request Verification

## Frontend behavior

- The form is available in an assigned Patient's Doctor workspace.
- It submits only `request_type` and `description` to
  `POST /api/doctor/patients/:patientId/assistance-requests`.
- The Doctor and Patient IDs, NGO assignment, request status, review data, and
  timestamps remain Backend-managed.
- The browser validates non-empty trimmed values, the 100-character
  `request_type` limit, and the 65,535-byte UTF-8 `description` limit.
- Backend validation feedback is mapped to localized field messages. A `403`
  clears the selected Patient's cached details; `404`, `409`, server, and
  network errors are shown as localized recoverable messages.
- On `201`, the UI shows the request projection returned by the API. The
  current contract has no Doctor route to list or reload that Doctor's
  Assistance Requests, so the UI does not invent one.

## Verification performed

| Command | Result |
|---|---|
| `npm run lint` (Frontend) | Passed |
| `npm run build` (Frontend) | Passed |
| `npm test -- tests/browser/doctor-assistance-request.spec.js --reporter=list` with `PLAYWRIGHT_CHANNEL=chrome` | 14 passed across desktop and mobile Chromium |
| `npm test -- test/integration/13-assistance-requests.test.js` (Backend) | 59 passed using the Backend's isolated temporary test database; the runner dropped that database after completion |

The Frontend browser tests cover the exact request payload, client validation,
Backend validation feedback, assignment denial, the missing-intake `409`, and
server errors. The Backend integration suite exercises the real API lifecycle,
including Doctor creation, Administrator assignment, NGO review/status, and
resource allocation.

The full Frontend browser suite (184 tests, before the last two focused cases
were added) had 182 passing tests and two failures in existing Sprint 8
login/offline tests (`sprint-8.spec.js`); neither failure is in the new
Assistance Request tests. Both failed tests passed when rerun individually, so
the failures did not reproduce.

## Current contract limitation

The approved contract does not expose an Administrator endpoint for listing
active NGOs, nor a Doctor endpoint for listing/reloading submitted Assistance
Requests. These are Backend gaps, not Frontend requirements to add routes for.
The creation screen therefore displays the successful server response and
does not implement the downstream Administrator/NGO interface.
