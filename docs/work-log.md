# Axis ERP Work Log

## 2026-06-25

### Toast and Inventory Filter UX

- Added toast exit animation so success messages animate both when appearing and disappearing.
- Kept toast placement in the bottom-right corner with centered content and clearer spacing.
- Changed inventory movement filters to apply keyword/date filters explicitly instead of updating the list while typing.

### Purchase and Supplier Master MVP

- Added customer master tables and customer create/list/update APIs.
- Added customer master management UI in the purchase/trading partner page.
- Added supplier master tables and purchase request tables through Flyway migration V9.
- Added supplier list, create, and update APIs with backend-owned Korean error messages.
- Added purchase request list and create APIs linked to active suppliers and active item masters.
- Added purchase request status filtering, approval, and cancellation APIs.
- Added processor and processed time persistence for purchase request approval and cancellation.
- Added purchase order conversion from approved purchase requests with duplicate conversion protection.
- Added a `구매/거래처` frontend route and sidebar menu.
- Added supplier registration, supplier list/edit modal, purchase request registration, and purchase request list UI.
- Added purchase request status filter and row-level approval/cancellation actions.
- Added a purchase request detail modal for request number, supplier, item, quantity, amount, requester, and memo.
- Kept supplier and purchase list search backend-owned through API query parameters.
- Verified the new route with the local browser after restarting the backend and applying the V9 migration.

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

### User Account Management

- Added backend user account DTOs per API request/response contract.
- Added `GET /api/users`, `GET /api/users/available-employees`, `POST /api/users`, and `PATCH /api/users/{id}/roles`.
- Added a database constraint so one employee can be connected to only one login account.
- Added frontend API DTOs and React Query hooks for user account management.
- Added initial account creation and role assignment UI, later moved into the dedicated user management flow.
- Kept user-facing API errors backend-owned and surfaced them through the shared frontend error helper.

### User Management Flow Revision

- Moved login account creation out of the permission screen.
- Added a dedicated user management page for employee creation, login account setup, and role assignment in one flow.
- Added `POST /api/users/employee-account` so employee and account creation succeed or fail together.
- Kept the permission screen focused on role-permission configuration only.
- Added shared frontend display label helpers to reduce raw code, role, status, and account identifier exposure in UI.

### Pagination and Attendance Calendar

- Added a shared frontend pagination component with a fixed page size of 20.
- Applied pagination to the organization employee list.
- Applied pagination to the registered user role management table.
- Added `GET /api/attendance/me/monthly` for monthly self attendance lookup.
- Replaced the attendance recent-record table with a monthly calendar component.

### Attendance Change Requests

- Added backend attendance change request persistence.
- Added self attendance change request API.
- Added admin pending request lookup and multi-approve API.
- Added a shared frontend modal component.
- Improved attendance calendar weekend coloring, year/month navigation, and readability.
- Added attendance change request modal and approver list/detail workflow.

### User Account Edit and Direct Attendance Update

- Added `PATCH /api/users/{id}` for combined user password and role updates.
- Replaced inline role editing in the user table with an edit modal.
- Split new employee account registration and existing employee account connection into separate user management sections.
- Added shared date and time field components for attendance edit forms.
- Added `PATCH /api/attendance/me` so users with `ATTENDANCE_UPDATE` can directly update attendance without approval requests.
- Updated the shared modal overlay to cover the full viewport without a top background gap.

### Custom Date and Time Pickers

- Replaced native date and time inputs in the shared attendance edit fields.
- Added a custom calendar dropdown opened from the calendar icon field.
- Added a custom time dropdown opened from the clock icon field.
- Kept the field output format compatible with backend DTOs: `yyyy-MM-dd` and `HH:mm`.

### Account Security and Attendance History

- Added BCrypt password encoding for new and updated account passwords.
- Kept legacy local plaintext passwords compatible and upgraded them on successful login.
- Added account active/inactive state and blocked login for inactive accounts.
- Added user search, status filter, role filter, and account active toggle in user management.
- Added attendance change request rejection and processing history APIs.
- Added rejection modal and processing history table in the attendance approval workflow.
- Prevented the current user from disabling their own account in both frontend and backend flows.
- Added attendance history search, status filter, and 20-item pagination.
- Adjusted custom date and time pickers to fit narrow viewports and align to the field action icon.

### Server-side Pagination and Permission Guard

- Added a shared backend `PageResponse<T>` contract for paged APIs.
- Converted `GET /api/users` to server-side pagination with search, active-state filter, and role filter.
- Converted the user management account table to consume the server-paged account response directly.
- Converted `GET /api/admin/attendance/change-requests/history` to server-side pagination with status, keyword, and work-date range filters.
- Added start/end date filters to the attendance change request history UI.
- Blocked self role changes that would remove any permission currently held by the logged-in account.

### Item and Inventory MVP

- Added item, warehouse, current stock, and inventory movement backend tables.
- Added paged item master APIs with search and active-state filters.
- Added warehouse lookup, inventory overview, current stock lookup, and inventory adjustment APIs.
- Added an inventory page with item registration, item edit, current stock lookup, and stock adjustment.
- Connected the inventory page to existing `ITEM_*` and `INVENTORY_*` permissions.

### Shared Text Field and Enter Search

- Added a shared frontend `TextField` component for text, email, number, and password inputs.
- Added password visibility toggle controls to password fields.
- Replaced major form inputs across login, organization, user management, attendance, and inventory screens with the shared text field.
- Changed text search fields to update backend API search parameters only when Enter is pressed.
- Kept search filtering backend-owned through existing API query parameters instead of client-side list filtering.
