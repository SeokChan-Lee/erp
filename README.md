# Axis ERP

Axis ERP is an operations-first ERP system for managing people, attendance, customers, inventory, purchasing, sales, approvals, and business dashboards.

The project is planned as a full-stack monorepo:

- Frontend: React, TypeScript, Tailwind CSS, Zustand
- Backend: Java, Spring Boot
- Auth: cookie-based login
- UI: custom components, no MUI
- Font: Pretendard

## Product Direction

Axis ERP starts with the representative workflows most companies need before expanding into deeper ERP modules:

- Authentication and account management
- Organization, departments, positions, and employees
- Attendance and work-hour management
- Customers and suppliers
- Item and inventory management
- Purchasing and sales workflows
- Approval flows
- Dashboards and statistics

## Development Rules

Additional libraries must be approved before use. Chart features should use Chart.js when statistics or dashboard charts are needed.

See the planning documents in `docs/` for product scope, permission design, frontend rules, backend rules, and visual direction.

