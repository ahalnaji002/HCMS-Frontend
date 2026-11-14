# Sprint 10.1 — NGO, Admin, and Shared API Contract

This Frontend reference maps Sprint 10 screens to the Backend API documented
and implemented on the available Backend `develop` checkout, reviewed on
2026-11-11. It is derived from `HCMS-Backend/docs/api/README.md`, the matching
Backend routes, validators, services, and Swagger definitions. The approved
Backend contract remains authoritative; this document cannot extend it or
create new behavior. If the Backend changes, update this reference from its
approved documentation before relying on the change in the UI.

Successful APIs use `{ success, message, data }`; failures use
`{ success: false, message, errors? }`. Protected requests use the shared
Axios client and its bearer token. Backend authentication, role, ownership,
assignment, and state checks are authoritative. The status code list below is
a guide only: use the response documented for each endpoint rather than
assuming every endpoint returns every status.

## Sprint 10 screen and endpoint map

| Issue / screen | Approved endpoints and data | Roles and UI boundary |
|---|---|---|
| [#57 — Doctor creates assistance request](https://github.com/ahalnaji002/HCMS-Frontend/issues/57) | `POST /api/doctor/patients/:patientId/assistance-requests` with exactly `request_type` and `description`; returns `data.assistance_request` (`201`). Admin flow: `GET /api/admin/assistance-requests` → `data.assistance_requests`; `GET /api/admin/assistance-requests/:requestId` → `data.assistance_request`; `PATCH /api/admin/assistance-requests/:requestId/assign` with `{ "ngo_id": n }`. | `DOCTOR`; requires an `ACTIVE` assignment to the Patient. The server derives Patient and Doctor IDs; request starts `PENDING` and unassigned (`ngo_id = null`). Do not send status, IDs, NGO, review, or timestamp fields. Admin assignment requires an active NGO, but no Admin active-NGO listing route is currently documented. |
| [#13 — NGO assistance request list/detail](https://github.com/ahalnaji002/HCMS-Frontend/issues/13) | `GET /api/ngo/assistance-requests` → `data.assistance_requests`; `GET /api/ngo/assistance-requests/:requestId` → `data.assistance_request`. | `NGO`; list and detail expose requests assigned to the authenticated NGO only. Another NGO's request is forbidden; a missing request is not found. |
| [#15 — NGO review/status](https://github.com/ahalnaji002/HCMS-Frontend/issues/15) | `PATCH /api/ngo/assistance-requests/:requestId/status` with `{ "status": "..." }`. | `NGO`, assigned request only. Valid transitions: `PENDING → UNDER_REVIEW`; `UNDER_REVIEW → APPROVED` or `REJECTED`; `APPROVED → COMPLETED`. Completion requires at least one allocation. Invalid/stale transitions return `409`. |
| [#17 — NGO resource allocations](https://github.com/ahalnaji002/HCMS-Frontend/issues/17) | `POST/GET /api/ngo/assistance-requests/:requestId/resources`; `PATCH/DELETE /api/ngo/assistance-requests/:requestId/resources/:resourceId`. Read projections are also available through Patient, Doctor, and Admin scoped resource routes. | `NGO` owning the request may create only when it is `APPROVED`. Create fields: `resource_name`, positive integer `quantity`; optional `delivery_date`, `notes`. Edits are partial. Once `COMPLETED`, allocations remain readable but cannot be changed or deleted. Other roles have read-only access limited to their relationship with the request. |
| [#21 — Admin emergency monitoring/assignment](https://github.com/ahalnaji002/HCMS-Frontend/issues/21) | `GET /api/admin/emergency-alerts` → `data.emergency_alerts`; `GET /api/admin/emergency-alerts/:alertId` → `data.emergency_alert`; `PATCH /api/admin/emergency-alerts/:alertId/assign` with `{ "doctor_id": n }`. Eligible Doctor list: `GET /api/admin/active-doctors` → `data.doctors`. | `ADMIN`. Assignment requires a `PENDING_ASSIGNMENT` alert and an active Doctor in General Medicine or Emergency Medicine. Successful assignment sets `ASSIGNED`; stale assignment returns `409`. |
| [#23 — Patient/Doctor messaging](https://github.com/ahalnaji002/HCMS-Frontend/issues/23) | `GET /api/messages/conversations` → `data.conversations`; `GET /api/messages/conversations/:userId` → `data.messages`; `POST /api/messages` with `{ "receiver_id": n, "message_text": "..." }`; `PATCH /api/messages/:messageId/read` with `{}`. | `PATIENT` and `DOCTOR` only. Sending requires the exact Patient–Doctor pair to have a current `ACTIVE` assignment. A receiver may mark a message read; repeated reads are idempotent. Existing history remains available after assignment ends, but new sends are denied. |
| [#25 — Notifications](https://github.com/ahalnaji002/HCMS-Frontend/issues/25) | `GET /api/notifications` → `data.notifications`; `GET /api/notifications/unread-count` → `data.unread_count`; `PATCH /api/notifications/:notificationId/read` with `{}`; `PATCH /api/notifications/read-all` with `{}` → `data.updated_count`. | Any active authenticated role (`PATIENT`, `DOCTOR`, `NGO`, `ADMIN`); own notifications only. Read actions are idempotent. There is no client create/delete endpoint. |
| [#27 — Patient reminders](https://github.com/ahalnaji002/HCMS-Frontend/issues/27) | `POST /api/patient/reminders` with `{ "type": "MEDICATION"|"APPOINTMENT", "reference_id": "...", "remind_at": "YYYY-MM-DDTHH:mm:ss" }`; `GET /api/patient/reminders`; `GET /api/patient/reminders/:reminderId`; `PATCH /api/patient/reminders/:reminderId/cancel` with `{}`. | `PATIENT` only, own reminders and owned treatment-plan references. Values: `PENDING → SENT` by the Backend's due worker or `PENDING → CANCELLED` by the Patient. Date-time is a local wall-clock value with no timezone suffix and must be in the future. |
| [#29 — Admin system settings](https://github.com/ahalnaji002/HCMS-Frontend/issues/29) | `GET /api/admin/settings` → `data.settings`; `GET /api/admin/settings/:key` → `data.setting`; `PATCH /api/admin/settings/:key` with `{ "setting_value": ... }`. | `ADMIN` only. Only catalog keys `system_name`, `support_email`, `support_phone` are exposed. No create, delete, or bulk update. Never display or edit environment secrets. |
| [#30 — Admin reports/statistics](https://github.com/ahalnaji002/HCMS-Frontend/issues/30) | Dashboards: `GET /api/admin/dashboard`, `/api/doctor/dashboard`, `/api/ngo/dashboard`, `/api/patient/dashboard`. Admin reports: `GET /api/admin/reports/patients`, `/treatment-plans`, `/assistance-requests`. | Each dashboard is for its named authenticated role. Reports are `ADMIN` only. Metrics are Backend counts; keep numeric zero values. Reports paginate with `page`/`limit` (default 1/20, maximum 100); only Assistance Request reports accept `status`. Render only the safe fields returned by the API. |
| [#75 — Doctor emergency status](https://github.com/ahalnaji002/HCMS-Frontend/issues/75) | `PATCH /api/doctor/emergency-alerts/:alertId/status` with `{ "status": "IN_PROGRESS"|"RESOLVED" }`. | Assigned `DOCTOR` only. Valid transitions: `ASSIGNED → IN_PROGRESS → RESOLVED`. **The Backend currently documents no endpoint to list alerts assigned to a Doctor**, so the screen cannot be completed against the current contract until the separately tracked Backend list endpoint is approved and available. |
| [#76 — Public emergency form](https://github.com/ahalnaji002/HCMS-Frontend/issues/76) | `POST /api/emergency-alerts` with required `phone`, optional `location`, `description`; returns `data.emergency_alert` (`201`). | Public visitor; no auth. Creation only; visitor alert has no registered Patient (`patient_id = null`). No public list/detail/tracking/cancellation route. Rate limiting can return `429`. |
| [#77 — Patient cancels emergency alert](https://github.com/ahalnaji002/HCMS-Frontend/issues/77) | `GET /api/patient/emergency-alerts`; `GET /api/patient/emergency-alerts/:alertId`; `PATCH /api/patient/emergency-alerts/:alertId/cancel` with `{}`. | `PATIENT`, own alert only. New alerts are `PENDING_ASSIGNMENT`; Patient can cancel only that state, producing `CANCELLED`. The current Backend responds `400` with a documented message if the alert is no longer pending; refresh the list after that stale-state response. |
| [#78 — Patient assistance tracking](https://github.com/ahalnaji002/HCMS-Frontend/issues/78) | `GET /api/patient/assistance-requests`; `GET /api/patient/assistance-requests/:requestId`; `GET /api/patient/assistance-requests/:requestId/resources`. | `PATIENT`, own requests and their allocations only; read-only. The request status is `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, or `COMPLETED`. |
| [#79 — Admin user/organization management](https://github.com/ahalnaji002/HCMS-Frontend/issues/79) | **No current documented Backend list/search/filter/activate/deactivate endpoints for users or organizations.** New endpoints are tracked in the Backend repository. | Do not create `/admin/users` or `/admin/organizations` data behavior until approved endpoints and payloads exist. This is a Backend dependency, not a Frontend API design decision. |

Issues #32 (responsive/consistency polish), #34 (integration verification), and
#36 (documentation/review/closure) are cross-cutting delivery tasks; they do
not add API endpoints.

## Approved workflows and presentation states

### Assistance requests and allocations

```text
Doctor creates → PENDING, NGO unassigned
Admin assigns an active NGO → still PENDING
NGO: PENDING → UNDER_REVIEW → APPROVED or REJECTED
NGO: APPROVED → COMPLETED (requires at least one allocation)
```

The Admin assignment endpoint accepts only `ngo_id`; assignment does not change
the request status. The API currently has no documented Admin endpoint to list
active NGOs for the selector, even though the assignment endpoint requires the
Admin to choose an active NGO ID. Treat that selector as a known Backend gap;
do not infer candidates from unrelated responses or add a route. An allocation
may be created only for an approved request and does not itself change request
status. The Patient and original submitting Doctor can read allocations, but
cannot mutate them.

### Emergency alerts

```text
Visitor or Patient creates → PENDING_ASSIGNMENT
Admin assigns an eligible active Doctor → ASSIGNED
Assigned Doctor → IN_PROGRESS → RESOLVED
Patient may cancel own PENDING_ASSIGNMENT → CANCELLED
```

The Patient can track only their own alerts. Public visitors can submit only;
they cannot track or manage an alert through a public API. Admin assignment
lists active Doctors, then the Backend enforces emergency-eligible specialties.
Doctor status mutation exists, but the Doctor's assigned-alert listing endpoint
is a current Backend gap tracked separately.

### Messaging and notifications

Messaging is synchronous REST history between an assigned Patient and Doctor.
The current contract has no pagination, realtime transport, attachments,
message edit/delete, or separate read-receipt stream. Ending an assignment
blocks new sends but does not erase existing conversation history.

Notifications are generated only by Backend events. Current event recipients
and triggers are: assigned Doctor on Admin emergency assignment; registered
Patient on the assigned Doctor's emergency transitions to `IN_PROGRESS` and
`RESOLVED`; affected Patient on a Treatment Plan update; and beneficiary
Patient plus submitting Doctor on each successful Assistance Request status
transition. Visitor alerts have no Patient recipient. Message and Resource
Allocation actions do not generate notifications. There is no API for manually
creating notifications or for email, SMS, push, filtering, or pagination.

### Reminders

Only Patients have Reminder endpoints. Accepted types are `MEDICATION` and
`APPOINTMENT`; each reference must belong to that Patient through a Treatment
Plan. `remind_at` is exact local `YYYY-MM-DDTHH:mm:ss`, later than now, and
must not be converted to UTC by the UI. The API stores and returns the MySQL
`DATETIME` as a local wall-clock string (`YYYY-MM-DD HH:mm:ss`), without a
timezone suffix. The Backend worker scans due reminders
once per minute; successful delivery changes `PENDING` to `SENT` and creates a
Notification in the same transaction. Patient cancellation is permitted only
while `PENDING`; no reschedule, delete, manual send, or failed/retry state is
exposed.

### Settings, dashboards, and reports

The settings catalog contains only `system_name` (trimmed string, 1–100),
`support_email` (nullable valid email, 1–255), and `support_phone` (nullable,
10 digits beginning `059` or `056`). Keys are fixed. Environment variables,
credentials, JWT secrets, and deployment secrets are not settings and must not
be requested or displayed.

Dashboards provide current Backend-derived metrics for the authenticated role.
Admin reports expose only safe projections: Patient (`id`, `user_id`,
`full_name`, `created_at`); Treatment Plan (`id`, `patient_id`, `doctor_id`,
`status`, `start_date`, `end_date`, `created_at`); Assistance Request (`id`,
`patient_id`, `doctor_id`, `ngo_id`, `status`, `request_type`, `created_at`,
`updated_at`). Assistance report also accepts one status filter. No report
endpoint currently provides trends, grouping, export, date filtering, or
authoritative metrics to calculate in the browser.

## Shared response and error behavior

- `400`: malformed path/body/query or validation error. Use backend `errors`
  when present; do not assume identical fields for every operation.
- `401`: authentication missing or invalid; use the established auth flow.
- `403`: wrong role, inactive account, or missing required assignment; do not
  treat a frontend route guard as authorization.
- `404`: missing resource. For ownership-scoped operations it can also conceal
  a resource owned by someone else; do not disclose existence.
- `409`: invalid/stale state transition for endpoints that document it.
- `429`: public emergency rate limit; present a recoverable, localized message.
- `500` and network failure: safe localized error and retry where safe; never
  show internal Backend details.

After a successful write, update or reload the affected resource. After a
stale-state error, refresh when the endpoint's workflow permits it. Keep
loading, empty, validation, success, forbidden, missing, conflict, and server
error states distinct where the endpoint can produce them.

## Known Backend gaps and explicitly unsupported behavior

- Doctor-assigned Emergency Alert list: required for #75, not present in the
  reviewed API reference/routes; status PATCH alone cannot populate the page.
- Admin list of active NGOs for Assistance Request assignment: assignment
  requires `ngo_id`, but no approved list endpoint is documented.
- User and organization management: list/search/filter/activate/deactivate
  endpoints for #79 are pending Backend work.
- Public emergency alerts have no visitor tracking or management API.
- Messaging has no realtime, attachment, edit/delete, or pagination support.
- Notification delivery through email, SMS, or push is not part of this API.
- Patient reminders have no rescheduling, deleting, or manual delivery route.
- Reports have no date filters, trends, grouping, analytics, or export.
- Settings expose no secrets and do not support arbitrary keys or bulk edits.

These are recorded limitations/dependencies, not approved requests to add
Backend routes. Any future change requires an approved Backend contract first.
