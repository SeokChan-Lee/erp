# Axis ERP Initial API Contract

This contract is the first backend/frontend agreement. It intentionally starts small and uses in-memory backend data until persistence is introduced.

## Auth

### `POST /api/auth/login`

Request:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "username": "admin",
  "displayName": "System Admin",
  "roles": ["SUPER_ADMIN"],
  "permissions": ["DASHBOARD_VIEW"]
}
```

Sets an HttpOnly `axis_session` cookie.

## Error Response

All managed API errors must return a backend-owned message.

```json
{
  "message": "아이디 또는 비밀번호가 올바르지 않습니다."
}
```

Rules:

- Backend owns user-facing API error messages.
- Frontend displays `message` as-is when present.
- Frontend fallback text is used only when the response is not in the managed error shape or the error is not an API response.
- Do not expose Spring default `error`, stack traces, exception names, or permission keys to users.
- Validation errors should be converted by the backend into short Korean messages such as `이메일 값을 확인해 주세요.`

### `POST /api/auth/logout`

Clears the `axis_session` cookie.

### `GET /api/auth/me`

Returns the current authenticated user.

## Attendance

### `POST /api/attendance/check-in`

Creates or updates today's attendance check-in for the current user.

### `POST /api/attendance/check-out`

Creates or updates today's attendance check-out for the current user.

### `GET /api/attendance/me/today`

Returns today's attendance for the current user.

### `GET /api/attendance/me/monthly?year=2026&month=6`

Requires `ATTENDANCE_READ_SELF`.

Returns the current user's attendance records in the requested month.

### `POST /api/attendance/change-requests`

Requires `ATTENDANCE_READ_SELF`.

Creates a self attendance change request.

Request:

```json
{
  "workDate": "2026-06-24",
  "requestedCheckInAt": "09:00",
  "requestedCheckOutAt": "18:00",
  "reason": "외근 후 근태 누락"
}
```

### `PATCH /api/attendance/me`

Requires `ATTENDANCE_UPDATE`.

Directly updates the current user's attendance record without the approval workflow.

Request:

```json
{
  "workDate": "2026-06-24",
  "requestedCheckInAt": "09:00",
  "requestedCheckOutAt": "18:00"
}
```

### `GET /api/admin/attendance/change-requests`

Requires `ATTENDANCE_APPROVE`.

Returns pending attendance change requests.

### `PATCH /api/admin/attendance/change-requests/approve`

Requires `ATTENDANCE_APPROVE`.

Approves selected change requests and updates attendance records.

Request:

```json
{
  "requestIds": [1, 2]
}
```

### `PATCH /api/admin/attendance/change-requests/reject`

Requires `ATTENDANCE_APPROVE`.

Rejects selected change requests and records the reject reason.

Request:

```json
{
  "requestIds": [1, 2],
  "rejectReason": "증빙이 부족합니다."
}
```

### `GET /api/admin/attendance/change-requests/history`

Requires `ATTENDANCE_APPROVE`.

Returns paged attendance change request history including `PENDING`, `APPROVED`, and `REJECTED` records.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `status`: optional `PENDING`, `APPROVED`, or `REJECTED`.
- `startDate`: optional work-date range start in `yyyy-MM-dd`.
- `endDate`: optional work-date range end in `yyyy-MM-dd`.
- `search`: optional keyword for username, reason, reject reason, or processor.

Response:

```json
{
  "content": [
    {
      "id": 1,
      "username": "hong.gildong",
      "requesterName": "홍길동",
      "workDate": "2026-06-24",
      "requestedCheckInAt": "09:00:00",
      "requestedCheckOutAt": "18:00:00",
      "reason": "외근 후 근태 누락",
      "status": "APPROVED",
      "requestedAt": "2026-06-24T09:10:00",
      "processedAt": "2026-06-24T10:00:00",
      "processedBy": "admin",
      "rejectReason": null
    }
  ],
  "totalItems": 1,
  "page": 1,
  "pageSize": 20
}
```

### `GET /api/admin/attendance/today`

Requires `ATTENDANCE_READ_ALL`.

Returns today's attendance records.

## Dashboard

### `GET /api/dashboard/summary`

Requires `DASHBOARD_VIEW`.

Returns initial dashboard metrics:

- attendance status counts
- pending approvals
- low-stock item count
- recent activity count

## Organization

### `GET /api/departments`

Requires `EMPLOYEE_READ`.

Returns department master data.

### `GET /api/employees`

Requires `EMPLOYEE_READ`.

Returns employee master data with department summary.

### `PATCH /api/employees/{id}`

Requires `EMPLOYEE_UPDATE`.

Request:

```json
{
  "displayName": "운영 담당자",
  "email": "employee@axis.local",
  "positionTitle": "운영 담당자",
  "status": "ACTIVE",
  "departmentId": 2
}
```

Response:

Returns the updated employee master data with department summary.

## Roles

### `GET /api/roles`

Requires `ROLE_READ`.

Returns role permission settings.

```json
[
  {
    "role": "ADMIN",
    "permissions": ["DASHBOARD_VIEW", "USER_READ", "ROLE_READ"]
  }
]
```

### `PATCH /api/roles/{role}/permissions`

Requires `ROLE_UPDATE`.

`SUPER_ADMIN` is fixed to all permissions and cannot be updated.

Request:

```json
{
  "permissions": ["DASHBOARD_VIEW", "ROLE_READ"]
}
```

Response:

Returns the updated role permission setting.

## Users

All user account APIs return backend-managed errors in the shared `{ "message": "..." }` shape.

### `GET /api/users`

Requires `USER_READ`.

Returns paged login accounts with connected employee summary, account status, and assigned roles.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `search`: optional keyword for account, employee, position, or department.
- `status`: optional `ACTIVE` or `INACTIVE`. Omit or pass `ALL` for all accounts.
- `role`: optional role code such as `EMPLOYEE` or `SUPER_ADMIN`.

```json
{
  "content": [
    {
      "id": 1,
      "username": "admin",
      "displayName": "시스템 관리자",
      "employee": {
        "id": 1,
        "employeeNo": "AX-001",
        "displayName": "시스템 관리자",
        "departmentName": "운영관리",
        "positionTitle": "시스템 관리자"
      },
      "roles": ["SUPER_ADMIN"],
      "active": true
    },
  ],
  "totalItems": 1,
  "page": 1,
  "pageSize": 20
}
```

### `GET /api/users/available-employees`

Requires `USER_READ`.

Returns employees that do not have a connected login account.

### `POST /api/users`

Requires `USER_CREATE`.

Request:

```json
{
  "username": "hong.gildong",
  "password": "1234",
  "employeeId": 3,
  "roles": ["EMPLOYEE"]
}
```

### `PATCH /api/users/{id}`

Requires `USER_UPDATE`.

Updates account password, roles, and active state in one request.

Backend guard:

- The currently logged-in account cannot deactivate itself.
- The currently logged-in account cannot change its own roles if the resulting role set loses any currently held permission.

Request:

```json
{
  "password": "new-password",
  "roles": ["HR_MANAGER"],
  "active": true
}
```

Response:

Returns the created user account.

### `POST /api/users/employee-account`

Requires both `EMPLOYEE_CREATE` and `USER_CREATE`.

Creates an employee master record and a connected login account in one transaction.

Request:

```json
{
  "employeeNo": "E-0002",
  "displayName": "홍길동",
  "email": "member@axis.local",
  "positionTitle": "운영 담당자",
  "status": "ACTIVE",
  "departmentId": 2,
  "username": "hong.gildong",
  "password": "1234",
  "roles": ["EMPLOYEE"]
}
```

Response:

Returns the created user account with connected employee summary.

### `PATCH /api/users/{id}/roles`

Requires `USER_UPDATE`.

Request:

```json
{
  "roles": ["EMPLOYEE", "VIEWER"]
}
```

Response:

Returns the updated user account.

## Item and Inventory

All item and inventory APIs return backend-managed errors in the shared `{ "message": "..." }` shape.

### `GET /api/items`

Requires `ITEM_READ`.

Returns paged item master data.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `search`: optional keyword for item code, name, or category.
- `status`: optional `ACTIVE` or `INACTIVE`. Omit or pass `ALL` for all items.

### `POST /api/items`

Requires `ITEM_CREATE`.

Creates an item master record and initializes zero stock rows for existing warehouses.

Request:

```json
{
  "sku": "AX-ITM-004",
  "name": "무선 키보드",
  "category": "IT 장비",
  "unit": "개",
  "safetyStock": 10
}
```

### `PATCH /api/items/{id}`

Requires `ITEM_UPDATE`.

Updates item name, category, unit, safety stock, and active state.

### `GET /api/inventory/warehouses`

Requires `INVENTORY_READ`.

Returns warehouse master data.

### `GET /api/inventory/stocks`

Requires `INVENTORY_READ`.

Returns current stock by item and warehouse.

Query parameters:

- `search`: optional keyword for item code, item name, category, or warehouse.
- `warehouseId`: optional warehouse filter.

### `GET /api/inventory/overview`

Requires `INVENTORY_READ`.

Returns item count, active item count, safety-stock shortage count, and warehouse count.

### `POST /api/inventory/adjustments`

Requires `INVENTORY_ADJUST`.

Adjusts current stock and records an inventory movement. The resulting stock quantity cannot be negative.

Request:

```json
{
  "itemId": 1,
  "warehouseId": 1,
  "quantityDelta": 5,
  "reason": "월말 실사 차이 보정"
}
```

### `PATCH /api/users/{id}`

Requires `USER_UPDATE`.

Updates a user account's roles and optionally changes the password. Empty passwords should be omitted.
Passwords are stored as BCrypt hashes. Existing local plaintext passwords are upgraded to BCrypt after successful login.

Request:

```json
{
  "password": "1234",
  "roles": ["EMPLOYEE", "VIEWER"],
  "active": true
}
```

Response:

Returns the updated user account.
