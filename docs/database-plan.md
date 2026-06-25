# Axis ERP Database Plan

## Current Local Database

Axis ERP currently uses Spring Data JPA with an H2 file database for local development.

- Database file: `backend/data/axis-erp.mv.db`
- Ignored by Git: yes
- Console: `http://127.0.0.1:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/axis-erp`
- Username: `sa`
- Password: empty

## Current Tables

Flyway migrations currently create and manage:

- `departments`
- `employees`
- `app_users`
- `app_user_roles`
- `role_permissions`
- `attendance_records`
- `attendance_change_requests`
- `items`
- `warehouses`
- `inventory_stocks`
- `inventory_movements`
- `suppliers`
- `purchase_requests`

## Seed Data

The local development seeder creates:

- Department `MGMT`
- Department `OPS`
- Employee `A-0001`
- Employee `E-0001`
- User `admin / admin123`
- User `employee / employee123`
- Warehouse `MAIN`
- Warehouse `SUB`
- Initial item and stock records
- Supplier `AX-SUP-001`
- Supplier `AX-SUP-002`

## Next Steps

1. Move sessions from in-memory storage to persistent or Redis-backed session storage.
2. Add purchase approval and purchase order tables after the request workflow is confirmed.
3. Add customer master and sales order tables.
4. Add audit logs for security-sensitive and inventory-changing actions.
5. Add PostgreSQL local profile once the local database server strategy is selected.
