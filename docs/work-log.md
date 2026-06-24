# Axis ERP Work Log

## 2026-06-24

### Dropdown Component Refactor

- Added a shared `SelectField` component under `frontend/src/shared/ui`.
- Moved dropdown open/close state and outside-click closing into the shared component.
- Reduced the dropdown menu gap from `8px` to `4px`.
- Updated the organization employee form to use the shared dropdown component for department and employee status.

### API Error Policy

- Added backend-managed API error response shape: `{ "message": "..." }`.
- Added a global backend exception handler for status, validation, malformed request, and unexpected errors.
- Converted authentication and authorization messages to Korean service messages.
- Updated the frontend HTTP utility to display only backend `message` for managed API errors.
- Updated dashboard, attendance, login, and organization screens to use the shared frontend error message helper.

### Employee Management

- Added `PATCH /api/employees/{id}` for employee updates.
- Added employee status management in the organization employee table.
- Verified employee status can be changed and restored through the API.
- Added employee basic information edit UI in the organization screen.
- Reused the shared `SelectField` for edit-form department and status controls.

### API DTO Structure

- Split frontend feature API DTO types into `api/dto.ts` files.
- Kept frontend `*Api.ts` files focused on query keys, hooks, mutations, and HTTP calls.
- Moved backend auth, attendance, and dashboard API request/response records into module `api` packages.
- Standardized new backend DTO names around `*Request` and `*Response`.

### Role Permission Management

- Added persisted `role_permissions` backend table.
- Added `GET /api/roles` for role permission lookup.
- Added `PATCH /api/roles/{role}/permissions` for role permission updates.
- Updated the access-control frontend screen to load, edit, and save backend role permissions.
- Kept `SUPER_ADMIN` fixed to all permissions to avoid accidental lockout.
