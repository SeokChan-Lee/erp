# Axis ERP Permission Model

## Direction

Axis ERP should use a role-based permission model.

- Users have one or more roles.
- Roles contain permissions.
- Backend APIs must enforce permissions.
- Frontend permission guards only control route, menu, and button visibility.
- Backend authorization is always the source of truth.

## Default Roles

| Role | Purpose |
| --- | --- |
| `SUPER_ADMIN` | Full system control |
| `ADMIN` | Company-level administration |
| `HR_MANAGER` | Employee and attendance management |
| `SALES_MANAGER` | Sales and customer management |
| `PURCHASE_MANAGER` | Purchasing and supplier management |
| `INVENTORY_MANAGER` | Item, warehouse, and inventory management |
| `APPROVER` | Approval processing |
| `EMPLOYEE` | Standard employee access |
| `VIEWER` | Read-only access |

## Permission Naming

Use resource-action names.

Examples:

- `USER_READ`
- `USER_CREATE`
- `USER_UPDATE`
- `USER_DELETE`
- `ROLE_READ`
- `ROLE_UPDATE`
- `EMPLOYEE_READ`
- `EMPLOYEE_CREATE`
- `EMPLOYEE_UPDATE`
- `EMPLOYEE_DELETE`
- `ATTENDANCE_CHECK_IN`
- `ATTENDANCE_CHECK_OUT`
- `ATTENDANCE_READ_SELF`
- `ATTENDANCE_READ_DEPARTMENT`
- `ATTENDANCE_READ_ALL`
- `ATTENDANCE_UPDATE`
- `ATTENDANCE_APPROVE`
- `CUSTOMER_READ`
- `CUSTOMER_CREATE`
- `CUSTOMER_UPDATE`
- `CUSTOMER_DELETE`
- `SUPPLIER_READ`
- `SUPPLIER_CREATE`
- `SUPPLIER_UPDATE`
- `SUPPLIER_DELETE`
- `ITEM_READ`
- `ITEM_CREATE`
- `ITEM_UPDATE`
- `ITEM_DELETE`
- `INVENTORY_READ`
- `INVENTORY_MOVE`
- `INVENTORY_ADJUST`
- `PURCHASE_READ`
- `PURCHASE_CREATE`
- `PURCHASE_UPDATE`
- `PURCHASE_APPROVE`
- `SALES_READ`
- `SALES_CREATE`
- `SALES_UPDATE`
- `APPROVAL_READ`
- `APPROVAL_PROCESS`
- `DASHBOARD_VIEW`
- `STATISTICS_VIEW`

## Role Defaults

### SUPER_ADMIN

- All permissions

### ADMIN

- Company-level user, employee, organization, dashboard, and configuration permissions
- No direct bypass of security/audit rules

### HR_MANAGER

- Employee read/create/update
- Attendance read all
- Attendance update
- Attendance approve
- Dashboard view

### SALES_MANAGER

- Customer read/write
- Item and warehouse read for sales order registration and shipment
- Sales read/write
- Dashboard view
- Statistics view for sales scope

### PURCHASE_MANAGER

- Supplier read/write
- Item and warehouse read for purchase request registration and receiving
- Purchase read/write
- Purchase approve when also assigned `APPROVER`
- Dashboard view

### INVENTORY_MANAGER

- Item read/write
- Inventory read/move/adjust
- Dashboard view
- Inventory statistics

### APPROVER

- Approval read
- Approval process
- Domain-specific approval permissions must still be checked when needed

### EMPLOYEE

- Own profile read
- Attendance check-in
- Attendance check-out
- Attendance read self
- Own approval requests

### VIEWER

- Read-only permissions explicitly assigned by domain

## Data Scope

Permission checks should eventually combine action permission and data scope.

Recommended scopes:

- `SELF`
- `DEPARTMENT`
- `COMPANY`
- `ALL`

Example:

- `ATTENDANCE_READ_SELF` allows only the current user's records.
- `ATTENDANCE_READ_DEPARTMENT` allows records for employees in departments the user manages.
- `ATTENDANCE_READ_ALL` allows company-wide attendance records.
