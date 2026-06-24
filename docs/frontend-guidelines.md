# Axis ERP Frontend Guidelines

## Stack

- React
- TypeScript
- Tailwind CSS
- Zustand for global client state
- Axios for API calls
- React Router for URL-based app navigation
- TanStack Query for server state
- React Hook Form and Zod for forms and validation
- date-fns for date formatting when native APIs are not enough
- lucide-react for icons
- Chart.js with react-chartjs-2 for statistics charts
- Pretendard font
- Custom UI components

## Fixed Rules

- Do not use MUI.
- Do not introduce new libraries without approval.
- Use Chart.js for statistics charts when charting is required.
- Use Axios for HTTP API calls.
- Use React Query for server state rather than duplicating server responses in Zustand.
- Use Zustand only for global client UI state and preferences.
- Use lucide-react icons in icon buttons, navigation, and tool controls where an icon exists.
- Prefer direct, application-specific components over generic heavy abstractions.
- Keep backend authorization as the source of truth.

## State Management

Use Zustand only for global client state such as:

- Authenticated user snapshot
- UI shell state
- Sidebar collapsed state
- User preferences
- Lightweight cross-page filters when needed

Do not put server data in Zustand by default. Server data should be fetched and cached through the approved API/data-fetching approach once selected.

## API DTO Structure

Each feature API must keep request and response DTO types in a dedicated `api/dto.ts` file.

- `api/dto.ts`: request payload, response body, enum/string-union, and nested DTO shapes.
- `api/*Api.ts`: endpoint hooks, query keys, mutation definitions, and HTTP calls only.
- Screens and components should import DTO types from `./api/dto`, not from `./api/*Api`.
- Keep DTO names aligned with backend contracts, such as `LoginPayload`, `AuthUser`, `EmployeeCreatePayload`, `Employee`.
- Do not mix view models, form-only state, or UI labels into API DTO files.

## Component Direction

Build custom components:

- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Modal
- Drawer
- Table
- Pagination
- Tabs
- Badge
- Toast
- Date input wrapper
- Layout shell
- Sidebar navigation
- Permission guard

Current shared UI components:

- `Button`
- `MetricCard`
- `Panel`
- `SelectField`

## Styling

- Tailwind CSS is the default styling tool.
- Pretendard should be self-hosted in the app before production release. Do not rely on a runtime CDN import for the core app font.
- Prefer semantic component props over exposing raw class composition everywhere.
- Keep dense ERP screens readable.
- Avoid marketing-style hero sections inside the app.
- Use stable dimensions for controls, tables, sidebars, and dashboard tiles.

## Frontend Permissions

Frontend permission logic may:

- Hide inaccessible menu items.
- Disable or hide restricted buttons.
- Redirect from routes that the current user cannot access.

Frontend permission logic must not:

- Be treated as security.
- Replace backend authorization.
- Assume a hidden button means an operation is protected.

## Error Display

Frontend displays backend-managed API errors directly.

- Use the shared HTTP utility so API errors become `ApiError` with the backend `message`.
- Show `getErrorMessage(error)` in screens and forms.
- Keep frontend fallback text generic and use it only for unmanaged errors.
- Do not map backend status codes into screen-specific user messages in the frontend unless the backend has no managed response.
- Frontend form validation may still show local field validation messages before an API request is sent.
