# Sprint 9.1 — Patient and Doctor Medical Workflow Contract

This reference records the Backend contract available on `develop` for Frontend
Sprint 9 issues #19, #38, #39, #40, #4, #41, #2, #31, #33, #35, and #37. It is
based on the maintained Backend `docs/api/README.md`, the corresponding route,
controller, validator, service, and Swagger source, plus merged Backend PR #102.
The Backend repository is evidence only and is not changed by this document.

The Backend response envelope is `{ success, message, data }` for successful
requests and `{ success: false, message, errors? }` for failures. The exact
resource key in `data` is shown below where the Swagger contract or existing
Frontend consumer establishes it. Use the OpenAPI schemas for complete
resource fields; do not infer fields from a screen mockup. Protected requests
use the existing bearer token through the shared API client. Backend role and
ownership checks remain authoritative.

## Issue and screen contract map

| Issue / screen | Approved endpoints and request | Response data | Role, ownership, and assignment rule |
|---|---|---|---|
| [#19 Administrator Doctor & NGO Approval](https://github.com/ahalnaji002/HCMS-Frontend/issues/19) | `GET /api/admin/join-requests`; `GET /api/admin/join-requests/:id`; `PATCH /api/admin/join-requests/:id/approve`; `PATCH /api/admin/join-requests/:id/reject` with `{ "rejection_reason": "..." }` on reject. | List: `data.join_requests` (pending only); detail and review mutations: `data.join_request`. Approve/reject records reviewer and review time. | `ADMIN` only. Covers Doctor/NGO applications, not patient registration. Reject reason is required, non-empty and at most 500 characters. Review is atomic; repeated or incompatible review is `409`. |
| [#38 Doctor Assigned Patients](https://github.com/ahalnaji002/HCMS-Frontend/issues/38) | `GET /api/doctor/patients`; `GET /api/doctor/patients/:patientId`. No documented search/filter query. | List: `data.patients` of safe Patient profile projections. Detail: `data.patient`. The assigned-Patient projection excludes `national_id`. | Authenticated `DOCTOR`; each row/detail requires an `ACTIVE` assignment from this Doctor to that Patient. Invalid unsigned BIGINT id `400`, missing Patient `404`, absent/inactive assignment `403`. |
| [#39 Doctor–Patient Assignment Views](https://github.com/ahalnaji002/HCMS-Frontend/issues/39) | Admin history: `GET /api/admin/doctor-patient-assignments`, `GET /api/admin/doctor-patient-assignments/:id`, `PATCH /api/admin/doctor-patient-assignments/:id/status` with `{ "status": "ACTIVE" | "INACTIVE" }`. Patient active view: `GET /api/patient/doctor-assignments`. Doctor active view: `GET /api/doctor/patients`. | Admin list includes active/inactive history, newest first; detail returns one assignment. Patient and Doctor views expose active relationships only. | Assignment history/status operations are `ADMIN` only. Patient sees own active Doctors; Doctor sees Patients currently assigned to that Doctor. Neither Patient nor Doctor can inspect history or change assignment status. Status changes preserve history; only one active row per Doctor–Patient pair. |
| [#40 Doctor Medical Records & Notes](https://github.com/ahalnaji002/HCMS-Frontend/issues/40) | Record: `POST /api/doctor/patients/:patientId/medical-record` (initial creation, no client fields required); `GET` same path; `PATCH` same path with approved record fields. Notes: `POST /api/doctor/patients/:patientId/medical-notes` with `{ "note": "non-empty text" }`; `GET` same path. Patient record: `GET /api/patient/medical-record`. | Record endpoints use `data.medical_record`; note list uses `data.medical_notes`. Record fields: `blood_type`, `allergies`, `chronic_diseases`, `medical_history`, `previous_surgeries`. A patient has at most one record. Note fields and timestamps follow `MedicalNote`; list is limited to notes by the current Doctor. | Doctor record/note access requires an active assignment. Patient may read only their own single record. The server derives Doctor and record identity for notes. Notes support create/read only: no edit/delete endpoint exists. Record mutation is separate from note mutation. |
| [#4 Shared Medical UI States & Components](https://github.com/ahalnaji002/HCMS-Frontend/issues/4) | No endpoint of its own. Reuse the endpoint-specific contracts in this reference. | Render resource-specific success, empty, validation, and error states; do not treat an absent resource as an empty collection where the API returns `404`. | State components must preserve role and assignment boundaries. A `401` may invalidate authentication; a `403` must not reveal previously loaded patient data. |
| [#41 Doctor Treatment Plan Management](https://github.com/ahalnaji002/HCMS-Frontend/issues/41) | Doctor: `POST /api/doctor/patients/:patientId/treatment-plans`, `GET` collection and `GET /:planId`, `PATCH /:planId`. Create requires `{ title, start_date }`; `general_instructions` and `end_date` are optional. PATCH accepts `title`, `general_instructions`, `status`, `start_date`, and/or `end_date`; at least one field is required. Patient read: `GET /api/patient/treatment-plans`, `GET /:planId`. | Doctor collection `data.treatment_plans`; detail/create/update `data.treatment_plan`. Patient collection/detail use the same plan resource shape. Plan fields include `id`, `patient_id`, `doctor_id`, `title`, `general_instructions`, `status`, `start_date`, `end_date`, timestamps. | Doctor operations require a current active assignment to the Patient. Patient may read own plans only. Status values are `ACTIVE`, `COMPLETED`, `CANCELLED`. A currently assigned Doctor may continue care on an older Doctor's plan; original `doctor_id` remains unchanged. |
| [#2 Doctor Medication & Appointment Management](https://github.com/ahalnaji002/HCMS-Frontend/issues/2) | Doctor medication: `POST/GET /api/doctor/treatment-plans/:planId/medications`, `GET/PATCH/DELETE /:medicationId`. Create requires `{ medication_name, dosage, frequency }`; `duration` and `instructions` are optional. PATCH accepts one or more of `medication_name`, `dosage`, `frequency`, `duration`, `instructions`. Doctor appointment: `POST/GET /api/doctor/treatment-plans/:planId/appointments`, `GET/PATCH/DELETE /:appointmentId`. Create requires `{ appointment_date, purpose }`; `location` and `notes` are optional. PATCH accepts `appointment_date`, `purpose`, `location`, `status`, and/or `notes`. Patient has GET collection/detail under `/api/patient/treatment-plans/:planId/{medications,appointments}`. | Resource envelope keys are `medications`, `medication`, `appointments`, or `appointment` under `data` for list/detail/mutation respectively. Medication fields: `id`, `treatment_plan_id`, `medication_name`, `dosage`, `frequency`, `duration`, `instructions`, timestamps. Appointment fields: `id`, `treatment_plan_id`, `appointment_date`, `purpose`, `location`, `status`, `notes`, timestamps. | Doctor mutations require an active assignment to the plan's Patient. Patient reads only under own plans. Medication has no status field; do not render a medication status control. Medication and appointment deletion are supported for Doctor. Appointment statuses: `SCHEDULED`, `COMPLETED`, `CANCELLED`. |
| [#31 Patient Profile](https://github.com/ahalnaji002/HCMS-Frontend/issues/31) | `GET /api/profile`; `PATCH /api/profile` with one or more allowed fields. Patient fields: `full_name`, `phone`, `date_of_birth`, `gender`, `address`. Doctor fields: `full_name`, `phone`. `date_of_birth` request value is a valid `YYYY-MM-DD` date and cannot be in the future. | `data.profile` is the caller's safe role-specific profile. For Patient GET and PATCH responses, the controller serializes `date_of_birth` through `formatDateOnly`, yielding a date-only `YYYY-MM-DD` string. Patient profile also contains immutable `national_id`; Doctor includes `specialization` and `license_number`. `PATCH` returns the updated `data.profile`. | GET: any authenticated role, own profile only. PATCH: `PATIENT` or `DOCTOR` only. Unknown, protected, and cross-role fields are rejected. Patient phone may be null or exactly 10 digits starting `059`/`056`; gender is `MALE`/`FEMALE`; address is string or null, max 255; full name is non-empty, max 150. Doctor has the same full-name and phone rules. Email, national ID, specialization, license, account status, and role are not PATCH fields. |
| [#33 Patient Medical Records](https://github.com/ahalnaji002/HCMS-Frontend/issues/33) | `GET /api/patient/medical-record`; there is no list or detail-by-id patient endpoint. | `data.medical_record` containing the single own record and its approved fields. If no record exists, handle the API's `404` as an absent-record state if confirmed by the endpoint response. | `PATIENT`, own record only, read-only. One record per Patient. No Patient create/update/delete API is documented. |
| [#35 Patient Treatment Plans](https://github.com/ahalnaji002/HCMS-Frontend/issues/35) | `GET /api/patient/treatment-plans`; `GET /api/patient/treatment-plans/:planId`. | `data.treatment_plans` and `data.treatment_plan`. A plan can be presented with related medication/appointment screens using their separate endpoints. | `PATIENT`, own plans only; read-only. No Patient mutation endpoint. |
| [#37 Patient Medications & Appointments](https://github.com/ahalnaji002/HCMS-Frontend/issues/37) | `GET /api/patient/treatment-plans/:planId/medications`, `GET .../medications/:medicationId`; same pattern for `/appointments`. No server-side upcoming/past filter is documented. | `data.medications` / `data.medication`; `data.appointments` / `data.appointment`. | `PATIENT`, read-only and only under own plans. Upcoming/past grouping is a presentation decision over returned strings; it is not an API filter contract. |

### Request and response rules

- Successful responses use HTTP `200` for reads and updates; creates normally use
  `201`. Use each operation's Swagger response as the final source for its exact
  code. Do not assume a mutation succeeded until its response resolves.
- Plan `start_date` and `end_date` are calendar dates, request and response
  format `YYYY-MM-DD`. `end_date: null` means there is no upper bound and must
  remain null in the UI and API client. A non-null end date cannot precede the
  start date.
- A treatment-plan date reduction is rejected if it would leave an existing
  appointment outside the proposed inclusive plan period. The UI must show the
  conflict and let the Doctor resolve affected appointments before retrying the
  plan update; it must not imply the plan dates were saved.
- `appointment_date` is a Palestinian local wall-clock string in
  `Asia/Hebron`, request and response `YYYY-MM-DD HH:mm:ss`. Do not append `Z` or
  an offset, convert it to UTC, or parse/format it through `Date` in a way that
  shifts the wall-clock value. The appointment calendar date must be within the
  plan's inclusive date range. `end_date: null` removes the upper boundary.
- Profile `date_of_birth` request: `YYYY-MM-DD`, valid calendar date, and not
  in the future. Profile GET and PATCH response: the controller also emits a
  `YYYY-MM-DD` string via `formatDateOnly`; this is distinct from the
  appointment wall-clock contract. Swagger declares `format: date` for the
  request and Patient profile schema.
- The response helper passes through the first ten characters when Knex returns
  a string; for a JavaScript `Date`, it constructs the output from local date
  getters. The checked Knex/mysql2 config does not explicitly set `dateStrings`,
  `timezone`, or `typeCast`. Therefore, the output *shape* is date-only, but
  process-timezone independence of the value on the Date-object driver path has
  not been demonstrated. Keep this as an open verification point; do not infer
  or extend the approved Sprint 9 treatment-date contract from it.
- Error mapping: `400` shows field/request validation feedback; `401` follows
  the shared authentication flow; `403` shows access denied and clears data the
  user is no longer permitted to see; `404` shows a missing-resource or
  no-record state appropriate to the endpoint; `409` explains a conflict or
  invalid current state and permits retry only after the user resolves it;
  `500` and network failures show a recoverable error and retry where safe.
  Avoid exposing internal error details. Keep distinct loading, successful,
  empty, and error states. A successful write should update or refresh the
  affected resource. A rejected write must not be displayed as saved.
- DST gap/repeated-time policy is unresolved if a future feature interprets an
  appointment wall-clock as an absolute instant or schedules execution. The
  current stored/displayed string contract is defined and does not require that
  policy to render appointments.

## Existing implementation and later Sprint work

This document records contracts; the absence of a screen is planned feature
work, not by itself a #28 documentation failure. On Frontend `develop`, the
application currently has role workspace routes `/patient`, `/doctor`, `/admin`
and the existing intake/care-coordination implementation. Doctor repositories
already call assigned patients, intake, medical notes, diagnoses, and medical
record operations. Patient repositories call profile read, assignments,
diagnoses, alerts, and intake-correction operations. Admin repositories cover
intakes, active doctors, and assignments created from intake, but not Join
Request approval or assignment history/status. Sprint 9 plan, medication,
appointment, and Patient medical-record screens and clients are not yet
implemented. Role navigation marks those entries unavailable.

Later tasks must include these observed safety/error follow-ups:

- #38/#39/#40: `useDoctorWorkspace.js` retains the previous patient's intake,
  notes, and diagnoses while another patient's requests are pending or after
  a failed/forbidden request (`src/presentation/features/doctor-workspace/useDoctorWorkspace.js`,
  selection effect). Clear or isolate patient-scoped data on selection and on
  `401/403`; add a regression test that switches patients, rejects the second
  patient's request with `403`, and proves no first-patient data remains
  visible after loading/error resolution.
- #31 and shared states #4: `usePatientWorkspace.js` swallows profile and alert
  request errors (`src/presentation/features/patient-workspace/usePatientWorkspace.js`,
  profile/alerts effect). Profile currently uses the loading text when no
  profile exists, so a failed request is indistinguishable from an in-flight
  one (`PatientCareSummary.jsx`). Add explicit settled/error states and a
  regression test proving `403/500/network` does not leave an endless loading
  display. The same principle applies to patient assignment/diagnosis requests
  whose catches currently ignore failures.
- #41/#2/#35/#37: add tests for exact plan date strings, null end date,
  appointment string preservation near midnight, inclusive start/end boundaries,
  and no UTC or process-timezone shift. Test all request and response views
  (list and detail) that the UI uses.
- #19/#39/#40/#2: test form validation and rendering for backend `400`,
  duplicate/state `409`, role/assignment `403`, missing `404`, and recoverable
  `500`/network failures. Verify deletion confirmation and refresh only for the
  supported Doctor medication/appointment DELETE operations.

## Confirmed resolutions and issue wording

The following are contract clarifications already supported by the Backend and
approved Sprint 9 decisions; they do not add Backend scope:

- #40: replace “viewing and editing medical notes” with “create and read
  medical notes; notes are authored by the current Doctor and cannot be edited
  or deleted through the current API.” Medical-record PATCH remains supported.
- #39: state explicitly that assignment history and status changes are
  Administrator-only; Patient and Doctor screens show only their supported
  active assignments. No Doctor/Patient status action is part of this UI.
- #2: replace medication status actions with medication details and supported
  Doctor create/read/update/delete actions. Keep appointment status actions
  (`SCHEDULED`, `COMPLETED`, `CANCELLED`) and add supported Doctor appointment
  deletion to the criteria.
- #33: refer to the Patient's single own medical record, not a record list;
  show read-only detail and the appropriate absent-record state.
- #37: describe upcoming/past as client presentation grouping only, unless
  server filtering is separately implemented and approved.
- #38: remove any implication that server search/filter exists. A client-side
  filter may be a later UI decision, but is not an API contract.

No new edit or deletion behavior should be promised for notes, no medication
status should be modeled, and no assignment history/status control should be
shown to Patient or Doctor roles. These are contract clarifications. Any request
to add note editing/deletion, medication status, or broader assignment access
would be a scope change requiring explicit product approval and a Backend API
change; it is not silently decided here.

## HCMS-Frontend #28 acceptance checklist

- [x] Map every planned Sprint 9 issue/screen to the current endpoint(s),
  request shape, response resource key, role, ownership, and assignment rule.
- [x] Record supported and unsupported actions, including the four approved
  resolutions (notes, assignment history, medication status/deletion, single
  medical record).
- [x] Define loading, empty, success, validation, unauthorized, forbidden,
  not-found, conflict, server, and network behavior at the shared contract
  level and call out applicable workflow-specific cases.
- [x] Document the approved plan-date and Asia/Hebron appointment-string
  semantics, inclusive plan boundaries, and null end-date behavior.
- [x] Separate existing Frontend implementation from future Sprint 9 work;
  record stale-data and swallowed-error findings with regression checks.
- [x] Provide corrected wording for incompatible issue criteria and separate
  contract clarifications from scope changes requiring approval.
- [x] Link this reference from `PROJECT_HANDOFF.md` and verify that link.

The reference closes the documentation portion of #28. It does not mark any
implementation issue complete or claim that planned screens already exist.

## Evidence references

Backend source of truth on `develop`:

- `HCMS-Backend/docs/api/README.md` — maintained API reference sections
  “Profiles”, “Admin Join Requests”, “Admin Doctor-Patient Assignments”,
  “Doctor assigned Patients”, “Medical Records and Notes”, “Treatment Plans”,
  “Treatment Medications”, and “Treatment Appointments”.
- `HCMS-Backend/src/docs/swagger/joinRequests.js`,
  `doctorPatientAssignments.js`, `patientDoctorAssignments.js`,
  `doctorPatients.js`, `doctorClinicalRecords.js`,
  `doctorTreatmentPlans.js`, `doctorTreatmentMedications.js`,
  `doctorTreatmentAppointments.js`, and `schemas.js` — operation-level schemas
  and response resource keys.
- `HCMS-Backend/src/routes/profileRoutes.js`,
  `middleware/validateProfileUpdate.js`, and `services/profileService.js` —
  verified profile permissions, field allowlists, validation, and returned
  profile fields.
- `HCMS-Backend/src/controllers/profileController.js` and
  `src/utils/formatDateOnly.js` — GET and PATCH profile response serialization;
  `knexfile.js` — mysql2 client configuration, with no explicit date parsing
  overrides.
- Backend PR [#102](https://github.com/ahalnaji002/HCMS-Backend/pull/102) —
  merged contract corrections and timezone-independent plan-date and
  Asia/Hebron appointment-string behavior.

Frontend implementation evidence on `develop`:

- `src/infrastructure/repositories/doctorWorkspaceRepository.js`,
  `patientWorkspaceRepository.js`, and `adminPatientIntakesRepository.js` —
  existing API calls and clear absence of the later Sprint 9 clients.
- `src/presentation/features/doctor-workspace/useDoctorWorkspace.js` and
  `DoctorWorkspaceFeature.jsx` — selected-patient loading/error behavior and
  stale-data risk.
- `src/presentation/features/patient-workspace/usePatientWorkspace.js` and
  `components/PatientCareSummary.jsx` — swallowed profile/alert errors and
  profile loading presentation.
- `src/presentation/layouts/roleNavigation.js`, `src/app/App.jsx`, and
  `PROJECT_HANDOFF.md` — available role navigation/routes and current
  implementation inventory.
