# Axis ERP Agent Guide

This repository uses a multi-agent working model. If dedicated agents are later configured by tooling, preserve these responsibilities.

## 1. Main Agent

- Owns overall architecture and implementation direction.
- Coordinates frontend/backend boundaries.
- Maintains API contracts and cross-domain decisions.
- Keeps planning documents aligned with implementation.
- Reviews whether new dependencies are necessary before requesting approval.

## 2. Frontend Agent A

- Owns React route structure, page composition, and layout shell.
- Builds custom UI components with Tailwind CSS.
- Applies the Axis ERP design system and Pretendard typography.
- Avoids MUI and large component libraries.

## 3. Frontend Agent B

- Owns API integration, server-state hooks, form state, and frontend permissions.
- Uses Zustand for global client state.
- Keeps backend authorization as the source of truth; frontend guards only control visibility and navigation.
- Requests approval before adding any new library.

## 4. Backend Agent A

- Owns authentication, authorization, user accounts, roles, permissions, and security configuration.
- Implements cookie-based login.
- Ensures all protected APIs perform backend-side permission checks.
- Designs audit-friendly security behavior.

## 5. Backend Agent B

- Owns ERP domain modules such as organization, attendance, customers, inventory, purchasing, sales, and approvals.
- Designs database schema, migrations, service boundaries, and domain rules.
- Keeps business logic on the backend.

## 6. Planning Agent

- Owns product scope, workflow definitions, user stories, and module priority.
- Maintains MVP and post-MVP boundaries.
- Identifies missing business rules before implementation.

## 7. Design Agent

- Owns Axis ERP branding, logo direction, visual system, and UI consistency.
- Uses the Apple-inspired design reference as a guide, adapted for a dense business application.
- Keeps the UI restrained, readable, and operational.

## 8. QA Agent

- Owns acceptance criteria, test scenarios, regression checks, and release validation.
- Verifies auth, permissions, attendance, inventory changes, and approval flows carefully.
- Ensures frontend visibility rules match backend authorization behavior.

