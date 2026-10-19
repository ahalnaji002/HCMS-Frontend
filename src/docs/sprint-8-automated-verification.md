# Sprint 8 Automated Browser Verification

## Scope

Follow-up on 2026-10-19 to the manual verification recorded on 2026-10-17.
The frontend was fast-forwarded from `de62dda` to `2c56185` on `develop`.
Tests were added on `feature/sprint-8-automated-tests`.

Playwright drives the actual React application, Axios client, forms, storage,
route guards, and dashboard UI in a browser. Synthetic API responses follow
the documented frontend contract. Unmatched API requests are blocked. This
suite does not exercise backend authorization, database writes, or production
deployment and does not replace the earlier live integration evidence.

## Coverage

- Anonymous access to all four protected role routes.
- Required login fields without sending a request.
- Successful login, request payload, public requests without bearer headers,
  token storage, current-user bearer header, role redirection, and logout.
- Expired current-user session (`401`) clears its token.
- Login `400`, `401`, `500`, and network failures show safe messages, preserve
  input, unlock submission, and permit successful retry.
- Browser-wide offline mode during login, followed by reconnection and retry.
- Pending/rejected professional application results do not create sessions;
  rejection reasons are displayed and stale status clears when input changes.
- Dashboard network/`500` failures display a retry action; retry restores actual
  fixture counts without losing the session.
- Session restoration network/`500` failures deny protected access while
  retaining the token; a later successful restoration allows access again.
- Patient, Doctor, and NGO registration network/`500`/`409` failures retain all
  entered fields and can retry to success without creating a login session.

Network failures use `route.abort('internetdisconnected')`; a separate test
uses `context.setOffline(true)`. HTTP 500 uses browser-intercepted responses.
No shared backend is stopped or deliberately crashed.

## Execution environment

- Windows, Node.js v22.23.2, Playwright Test 1.64.1.
- Desktop Chrome and Pixel 7 viewport/device emulation; not physical-device testing.
- Isolated Vite server at `http://127.0.0.1:4178` with an overridden test API URL.
- The downloaded Chromium executable failed with a Windows side-by-side
  configuration error before any test action. Installed Google Chrome is used
  via `PLAYWRIGHT_CHANNEL=chrome`; no application workaround was needed.
- Initial application-status assertions were corrected to the existing approved
  labels, “Under review” and “Not approved”. No production behavior was changed.

## Verification results

Final browser run: **54 passed in 56.6 seconds** (27 scenarios on each of the
desktop and mobile projects), with no retries, failures, or skipped tests.

Real-backend browser integration against the isolated MySQL database also
passed in 20.2 seconds. It verified live Patient/Doctor/NGO registration,
Patient login and current-user lookup, backend `403` role authorization, `401`
invalid credentials, pending professional application responses, and client
recovery from simulated network/`500` failures. The three synthetic accounts
were removed from `hcms_test_db` after the run.

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test -- --max-failures=2
npm run test:integration
npm run lint
npm run build
git diff --check
npm audit
```

All six verification commands passed. The HTML report is generated at
`playwright-report/index.html` (ignored by Git). `npm audit --json` separately
reports zero vulnerabilities after compatible lockfile updates. Axios moved
from 1.19.0 to 1.20.0, `brace-expansion` from 5.0.9 to 5.0.12, and
`source-map-js` from 1.2.1 to 1.2.2. The direct dependency ranges remain
unchanged; `npm audit fix` updated the lockfile only.

## Remaining limitations

This suite covers selected Sprint 8 regressions, not every role feature or
accessibility requirement. It runs in English on a Chromium-based browser.
Firefox, WebKit, Arabic UI behavior, and live backend failure injection remain
outside this verification. The session-restoration failure behavior currently
redirects to login without an explanatory outage banner; the tests record that
existing behavior rather than changing the authentication flow.

The audit findings present before this follow-up are resolved in the lockfile.
