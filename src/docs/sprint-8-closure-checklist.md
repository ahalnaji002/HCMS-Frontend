# Sprint 8 Closure Checklist

> This is the original closure record. For the later Playwright test suite,
> network failures, and HTTP 500 coverage, see the
> [2026-10-19 automated verification](./sprint-8-automated-verification.md).

## Review point

This checklist records the final Sprint 8 closure review on
`feature/8-13-final-closure`, created from `develop` commit `7ac0353`.
It covers the frontend repository only and does not replace backend release or
deployment verification.

## Sprint 8 issue traceability

The following GitHub Issues have acceptance-criteria evidence in the merged
codebase and are closed as completed:

| Issue | Delivery evidence |
| --- | --- |
| 8.1 | `auth-contract.md` documents the approved authentication contract and status-model separation. |
| 8.2–8.7 | Shared API/auth foundation, login and registration flows, approval-status handling, and route guards are implemented and documented. |
| 8.8–8.9 | Shared role layout/navigation and initial role dashboards are merged into `develop`. |
| 8.10 | `sprint-8-responsive-verification.md` records responsive, RTL, accessibility, and live role-layout checks. |
| 8.11 | `sprint-8-integration-verification.md` records live registration, login, `/api/auth/me`, RBAC, approval, rejection, and error-status checks. |
| 8.12 | `sprint-8-final-review.md` aligns the final code, routes, API boundary, limitations, and verification evidence. |

Issue 8.13 was the final Sprint 8 closure issue. Its branch, pull request, and
merged commit provide the final delivery traceability.

## Final scope review

- The final branch contains documentation and review changes only. It must not
  include `.env` files, credentials, generated `dist/` output, dependencies,
  or unrelated source changes.
- The authentication contract describes only backend routes that the frontend
  consumes. It does not invent endpoints or treat frontend guards as backend
  authorization.
- The existing documentation separates completed behavior from unavailable
  password recovery, token revocation, re-application, email notification,
  and unimplemented role modules.
- `develop` is the approved integration branch. Sprint 8 closure must not
  merge directly to `main`.

## Verification record

The final review repeated these commands successfully:

```powershell
npm run lint
npm run build
git diff --check
git status --short
git diff
```

At this original review point, the project had no configured automated test
runner or `test` script. Playwright coverage was added in the 2026-10-19
follow-up; see [automated verification](./sprint-8-automated-verification.md)
for its results and limits.

## Remaining work

At the original review point, no Sprint 8 implementation Issue remained open
other than this closure Issue. Issue 8.13 was subsequently merged into
`develop` at commit `2c56185`. Future frontend work remains tracked in GitHub
Issues rather than silently included in Sprint 8. The next planned scope is
Sprint 9, beginning with Issue #28, **Sprint 9 Requirements & API Contract**.
Sprint 10 work is also tracked separately in its own Issues.

## Pull request and closure record

The following steps record the original closure workflow; the closure was
subsequently merged into `develop` at commit `2c56185`, and its feature branch
was removed:

1. Review the final diff and working tree for intended files only.
2. Commit the verified documentation with a clear message.
3. Push `feature/8-13-final-closure`.
4. Create a pull request from that branch to `develop` that references #26.
5. Merge only after review, then close #26 and remove the merged feature
   branch.
