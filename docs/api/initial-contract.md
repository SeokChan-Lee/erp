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

## Supplier

### `GET /api/suppliers`

Requires `SUPPLIER_READ`.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `search`: optional keyword for supplier code, name, business number, or contact name.
- `status`: `ALL`, `ACTIVE`, or `INACTIVE`. Defaults to `ALL`.

Response:

```json
{
  "content": [
    {
      "id": 1,
      "code": "AX-SUP-001",
      "name": "Axis IT 공급사",
      "businessNumber": "101-88-00001",
      "contactName": "김공급",
      "phone": "02-1000-1000",
      "email": "it-supply@axis.local",
      "active": true
    }
  ],
  "totalItems": 1,
  "page": 1,
  "pageSize": 20
}
```

### `POST /api/suppliers`

Requires `SUPPLIER_CREATE`.

Request:

```json
{
  "code": "AX-SUP-003",
  "name": "구매 파트너",
  "businessNumber": "101-88-00003",
  "contactName": "홍담당",
  "phone": "02-3000-3000",
  "email": "partner@axis.local"
}
```

### `PATCH /api/suppliers/{id}`

Requires `SUPPLIER_UPDATE`.

Request:

```json
{
  "name": "구매 파트너",
  "businessNumber": "101-88-00003",
  "contactName": "홍담당",
  "phone": "02-3000-3000",
  "email": "partner@axis.local",
  "active": true
}
```

## Customer

### `GET /api/customers`

Requires `CUSTOMER_READ`.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `search`: optional keyword for customer code, name, business number, or contact name.
- `status`: `ALL`, `ACTIVE`, or `INACTIVE`. Defaults to `ALL`.

### `POST /api/customers`

Requires `CUSTOMER_CREATE`.

Request:

```json
{
  "code": "AX-CUS-003",
  "name": "신규 고객사",
  "businessNumber": "201-88-00003",
  "contactName": "홍고객",
  "phone": "02-4000-3000",
  "email": "customer@axis.local"
}
```

### `PATCH /api/customers/{id}`

Requires `CUSTOMER_UPDATE`.

Request:

```json
{
  "name": "신규 고객사",
  "businessNumber": "201-88-00003",
  "contactName": "홍고객",
  "phone": "02-4000-3000",
  "email": "customer@axis.local",
  "active": true
}
```

## Purchase

### `GET /api/purchases/requests`

Requires `PURCHASE_READ`.

Query parameters:

- `page`: 1-based page number. Defaults to `1`.
- `pageSize`: item count per page. Defaults to `20`; maximum `100`.
- `search`: optional keyword for request number, supplier, item, memo, or requester.
- `status`: `ALL`, `REQUESTED`, `APPROVED`, `CANCELED`, or `ORDERED`. Defaults to `ALL`.

### `POST /api/purchases/requests`

Requires `PURCHASE_CREATE`.

Request:

```json
{
  "supplierId": 1,
  "itemId": 1,
  "quantity": 5,
  "unitPrice": 1200000,
  "memo": "신규 입사자 장비 확보"
}
```

Response includes request number, supplier summary, item summary, quantity, unit price, total amount, request status, memo, requester, requested time, processor, and processed time.

### `PATCH /api/purchases/requests/{id}/approve`

Requires `PURCHASE_APPROVE`.

Approves a purchase request that is currently in request state.

### `PATCH /api/purchases/requests/{id}/cancel`

Requires `PURCHASE_UPDATE`.

Cancels a purchase request that is currently in request state.

### `POST /api/purchases/requests/{id}/order`

Requires `PURCHASE_UPDATE`.

Creates a purchase order from an approved purchase request and changes the request status to `ORDERED`. Duplicate order conversion for the same request is blocked by the backend.

### `GET /api/purchases/orders`

Requires `PURCHASE_READ`.

Query:

- `page`, `pageSize`
- `search`: server-side filter for order number, purchase request number, supplier, item, and order owner.
- `fromDate`, `toDate`: ISO date range for order creation date.

Returns paged purchase orders with the connected purchase request, supplier, item, total amount, order owner, and ordered time.

### `POST /api/purchases/orders/{id}/receive`

Requires `PURCHASE_UPDATE`.

Request:

```json
{
  "warehouseId": 1
}
```

Receives a purchase order into the selected warehouse. The backend blocks duplicate receiving, increases current stock by the ordered quantity, and records an inventory movement with the purchase order number.

### `POST /api/purchases/orders/{id}/receive/cancel`

Requires `PURCHASE_UPDATE`.

Cancels a received purchase order. The backend blocks cancellation for orders that were not received, blocks cancellation when stock would become negative, decreases current stock, clears receiving fields, and records an inventory movement with the purchase order number.

## Dashboard

### `GET /api/dashboard/summary`

Requires `DASHBOARD_VIEW`.

Returns initial dashboard metrics:

- attendance status counts
- pending approvals
- low-stock item count
- today activity count
- pending purchase requests
- pending purchase receipts
- registered sales orders
- pending sales shipments

## Sales

### `GET /api/sales/orders`

Requires `SALES_READ`.

Query:

- `page`, `pageSize`
- `search`: server-side filter for sales order number, customer, item, memo, and order owner.
- `status`: `ALL`, `REGISTERED`, `CANCELED`

Returns paged sales orders with customer, item, quantity, unit price, total amount, status, memo, order owner, and processed information.

### `POST /api/sales/orders`

Requires `SALES_CREATE`.

Request:

```json
{
  "customerId": 1,
  "itemId": 1,
  "quantity": 3,
  "unitPrice": 1500000,
  "memo": "신규 판매 수주"
}
```

Creates a sales order for an active customer and active item.

### `PATCH /api/sales/orders/{id}/cancel`

Requires `SALES_UPDATE`.

Cancels a registered sales order.

### `POST /api/sales/orders/{id}/ship`

Requires `SALES_UPDATE`.

Request:

```json
{
  "warehouseId": 1
}
```

Ships a registered sales order from the selected warehouse. The backend blocks duplicate shipping, blocks shipping when stock is insufficient, decreases current stock, and records an inventory movement with the sales order number.

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
