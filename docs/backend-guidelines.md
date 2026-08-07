# Axis ERP Backend Guidelines

## Stack Direction

- Java
- Spring Boot
- Spring Data JPA
- H2 file database for local development
- PostgreSQL driver prepared for later production-like persistence
- Cookie-based authentication
- Role and permission authorization
- Relational database

새 라이브러리가 필요한 경우 프로젝트 규칙에 따라 추가 전에 확인한다.

## Authentication

Login should use a cookie-based approach.

Recommended defaults:

- HttpOnly cookie
- Secure cookie in non-local environments
- SameSite=Lax
- CSRF protection for state-changing requests
- Logout invalidates the server-side session or token state

Current implementation:

- `axis_session` is an HttpOnly session cookie.
- The backend restores Spring Security authentication from the session cookie on every request.
- State-changing requests require the `X-XSRF-TOKEN` header issued through the `XSRF-TOKEN` cookie.
- Cookie security, SameSite policy, and session lifetime are environment properties.

## Authorization

- Every protected endpoint must perform backend permission checks.
- Use role and permission information from the authenticated principal.
- Do not rely on frontend-hidden controls for security.
- Add data-scope checks for self, department, company, and all-company access.

## Domain Boundaries

Initial backend modules:

- auth
- users
- roles
- permissions
- organization
- employees
- attendance
- customers
- suppliers
- items
- inventory
- purchases
- sales
- approvals
- dashboard

## Local Persistence

The current local development database is H2 file mode:

- JDBC URL: `jdbc:h2:file:./data/axis-erp`
- H2 console: `/h2-console`
- Schema strategy: Flyway migrations with `hibernate.ddl-auto=none`
- Active profile: `local` by default

This keeps local development simple while preserving a JPA model that can move to PostgreSQL.

Development seed accounts and the H2 console are enabled only in the `local` profile.

## Production Profile

Run production with the `prod` profile and provide the following environment variables:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `COOKIE_SAME_SITE` when a value other than `Lax` is required

The production profile uses PostgreSQL, disables the H2 console, and sends the session cookie with the Secure attribute. Schema changes must be added as ordered Flyway migrations under `db/migration`; do not enable Hibernate schema mutation.

Current persisted domains include:

- Departments
- Employees
- User accounts
- User roles
- Attendance records
- Items, warehouses, and inventory movements
- Customers, suppliers, purchases, and sales
- Role permissions and audit records

## API Direction

Use predictable REST-style APIs first.

Examples:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/employees`
- `POST /api/attendance/check-in`
- `POST /api/attendance/check-out`
- `GET /api/attendance/me/monthly`
- `GET /api/admin/attendance`
- `GET /api/dashboard/summary`

## API DTO Structure

Each backend API package should keep request and response DTO records separate from entities and services.

- Request DTOs should use the `*Request` suffix.
- Response DTOs should use the `*Response` suffix.
- API DTOs live under the owning module's `api` package, for example `auth.api`, `attendance.api`, `employee.api`.
- Controllers should accept request DTOs and return response DTOs.
- Entities should not be returned directly from controllers.
- Domain services may return response DTOs while the project is small; when domain complexity grows, introduce domain models and map them in the controller or mapper layer.

## Error Handling

Backend owns all managed API error messages.

- Return managed errors as `{ "message": "..." }`.
- Keep user-facing messages short and Korean.
- Convert authentication, authorization, not-found, conflict, validation, malformed request, and unexpected server errors through the global exception handler.
- Controllers and services should throw domain/status exceptions with a clear Korean reason when a specific message is needed.
- Do not let framework default error bodies, exception names, permission keys, stack traces, or raw validation internals become the user-facing message.

## Audit Direction

ERP actions should be audit-friendly. Important actions should eventually record:

- Actor
- Action
- Target resource
- Before and after values when appropriate
- Timestamp
- Request metadata when useful
