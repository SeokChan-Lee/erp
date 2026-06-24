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

The initial JPA model creates:

- `departments`
- `employees`
- `app_users`
- `app_user_roles`
- `attendance_records`

## Seed Data

The local development seeder creates:

- Department `MGMT`
- Department `OPS`
- Employee `A-0001`
- Employee `E-0001`
- User `admin / admin123`
- User `employee / employee123`

## Next Steps

1. Add Flyway migrations before the schema grows further.
2. Replace plaintext passwords with hashed passwords.
3. Move sessions from in-memory storage to persistent or Redis-backed session storage.
4. Add department and employee APIs.
5. Add monthly attendance query APIs.
6. Add PostgreSQL local profile once the local database server strategy is selected.
