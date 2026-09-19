# HCMS Frontend — Codex Instructions

## Project Overview

HCMS (Healthcare Conflict Management System) is a responsive web application
for patients, doctors, NGOs, and administrators.

This repository contains only the frontend application.

The frontend communicates with the HCMS backend through RESTful APIs.

---

## Technology Stack

- React
- Vite
- React Router
- Axios
- JavaScript
- Tailwind CSS

Do not introduce new frontend frameworks, state-management libraries,
UI libraries, or major dependencies without explicit approval.

---

## Frontend Responsibilities

The frontend is responsible for:

- Rendering user interfaces
- Navigation and routing
- Collecting and validating user input
- Calling backend APIs
- Displaying backend responses and errors
- Providing role-appropriate user experiences
- Supporting responsive layouts

Do not move backend business logic into the frontend.

Security-sensitive authorization decisions must remain enforced by the backend.

---

## Project Structure

Preserve the existing project structure.

Expected areas may include:

src/

- assets/
- components/
- pages/
- layouts/
- services/
- hooks/
- context/
- utils/

Use reusable components when appropriate.

Avoid creating duplicate components for the same UI behavior.

Do not perform large structural refactors unless explicitly requested.

---

## API Integration

Use the existing shared Axios/API service for backend communication.

Use environment variables for the backend base URL.

Do not hard-code backend URLs throughout components.

Do not invent API endpoints.

Do not change an existing API contract without explicit approval.

If the required backend endpoint or response format is unknown, stop and ask
for clarification instead of assuming it.

Handle loading, success, empty, and error states where appropriate.

---

## Authentication

Authentication is handled by the HCMS backend using JWT.

The frontend may:

- collect login credentials
- store authentication state according to the approved project approach
- send authentication tokens with protected API requests
- redirect users according to authentication and role state

Do not invent token storage or refresh-token behavior without approval.

Do not rely on frontend route protection as a security boundary.

Backend authorization remains the source of truth.

---

## Roles

The system supports four roles:

- PATIENT
- DOCTOR
- NGO
- ADMIN

Render navigation, dashboards, pages, and actions according to the
authenticated user's role.

Do not expose role-specific controls to users who should not use them.

However, remember that hiding UI elements is not a replacement for backend RBAC.

---

## Role-Based Interfaces

The approved HCMS system includes interfaces for:

### Patient

- personal profile
- medical records
- treatment plans
- medications and appointments
- emergency alerts
- assistance request tracking
- messages
- notifications and reminders

### Doctor

- assigned patients
- medical records and notes
- treatment plan management
- medications and appointments
- emergency handling
- assistance request submission
- messaging

### NGO

- assigned assistance requests
- request review
- assistance status updates
- resource allocation
- notifications

### Administrator

- user management
- Doctor and NGO approval
- system monitoring
- emergency management
- organization management
- activity monitoring
- reports
- system settings

Do not implement features outside the approved project scope unless explicitly requested.

---

## Routing

Use React Router for navigation.

Protected pages should require authentication.

Role-restricted pages should check the authenticated user's role.

Keep routing logic organized.

Do not duplicate route definitions unnecessarily.

Do not change the routing architecture without approval.

---

## Forms and Validation

Perform user-friendly client-side validation where appropriate.

Backend validation remains authoritative.

Do not assume client-side validation is sufficient for security or data integrity.

Display clear validation and API error messages to the user.

Do not silently ignore backend errors.

---

## UI and UX

The application must remain responsive for:

- desktop
- laptop
- tablet
- mobile browser sizes

Use Tailwind CSS for styling and preserve the project's existing design language.

Do not replace Tailwind CSS with another styling solution unless explicitly requested.

Maintain consistent layouts, spacing, typography, and component behavior.

Prefer reusable components over repeated markup.

Keep interfaces simple and easy to navigate.

Do not redesign existing approved screens unless explicitly requested.

Do not make unrelated styling changes while implementing a functional task.

---

## State Management

Use the project's existing React state approach.

Prefer local state when state is only needed within a component or small feature.

Use shared context only when data genuinely needs to be shared across multiple
areas of the application.

Do not introduce Redux, Zustand, or another state management library without
explicit approval.

---

## Error Handling

Handle API errors explicitly.

Do not assume every API request succeeds.

Where applicable, handle:

- loading state
- validation errors
- unauthorized responses
- forbidden responses
- not-found responses
- server errors
- empty data states

Avoid exposing internal backend error details directly to users.

---

## Development Workflow

Work on one focused feature or task at a time.

Before implementing a large or cross-cutting frontend task, inspect the
relevant files and produce a plan first.

Do not modify unrelated files.

Do not perform cleanup, refactoring, formatting changes, dependency upgrades,
or redesigns unless required by the task.

Preserve working functionality unless the task explicitly changes it.

---

## Testing and Verification

After implementation:

1. Run relevant tests if tests exist.
2. Run linting or other project validation commands when applicable.
3. Verify the application builds successfully when appropriate.
4. Report exactly which commands were executed.
5. Report the actual result of each command.

Never claim a test, lint check, or build passed if it was not executed.

If verification cannot be completed, state that clearly.

---

## Git Rules

Do not create commits unless explicitly requested.

Do not push changes unless explicitly requested.

Do not merge branches.

Do not force-push.

Before suggesting a commit, review:

- git status
- git diff

Keep changes small and focused.

---

## Documentation and External Libraries

When implementation depends on current React, Vite, React Router, Axios,
or other library behavior, use current official documentation.

When Context7 MCP is available, use it when current library documentation
is needed instead of relying only on memory.

Do not update package versions unless required and explicitly approved.

---

## Source of Truth

Frontend behavior must follow the approved HCMS project documentation,
backend API contracts, and approved UI decisions.

Important project references include:

- Software Requirements Specification (SRS)
- approved UI/UX designs
- backend API contracts
- approved role and workflow decisions

If a requested implementation conflicts with these sources, stop and report
the conflict.

Do not resolve high-impact product or architecture ambiguity independently.
Ask for clarification first.
