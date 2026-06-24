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
