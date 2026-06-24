# Axis ERP Product Plan

## Product Name

Axis ERP

Axis represents the central operating point of a business. The product should feel like a calm, reliable control center for company operations.

## MVP Goal

Build a practical ERP foundation that can support daily operations before expanding into advanced finance, accounting, manufacturing, or analytics.

## Initial Modules

### 1. Authentication and Accounts

- Login and logout
- Cookie-based authenticated session
- Current user profile
- Password change
- User account management
- Role assignment
- Permission assignment through roles

### 2. Organization and Employees

- Company profile
- Department management
- Position and title management
- Employee management
- Employment status: active, leave, resigned
- Employee contact and basic work information

### 3. Attendance Management

- Check in
- Check out
- Daily attendance status
- Monthly attendance view
- Late, early leave, absence, normal work status
- Admin correction with reason
- Attendance correction approval flow
- Department and company-wide attendance monitoring

### 4. Customer and Supplier Management

- Customer companies
- Supplier companies
- Contact persons
- Business status
- Basic transaction metadata

### 5. Item and Inventory Management

- Item master
- Item categories
- Warehouse management
- Stock-in
- Stock-out
- Current stock
- Low-stock dashboard signal
- Inventory movement history

### 6. Purchasing

- Purchase request
- Purchase order
- Purchase status
- Purchase approval
- Supplier linkage

### 7. Sales

- Sales order
- Customer linkage
- Order status
- Shipment preparation status
- Sales summary for dashboards

### 8. Approvals

- Approval request
- Approval, rejection, and cancellation
- Approval history
- Reusable approval target types:
  - Attendance correction
  - Purchase request
  - Sales exception
  - Inventory correction

### 9. Dashboard and Statistics

- Today's attendance summary
- Pending approvals
- Low-stock items
- Recent purchase and sales activity
- Monthly attendance statistics
- Inventory movement statistics
- Sales and purchase trend charts

Charts should use Chart.js when charting is required.

## MVP Priority

Phase 1:

- Auth
- User, role, permission basics
- Organization and employee management
- Attendance check-in/check-out
- Attendance list and monthly view
- Basic dashboard

Phase 2:

- Customer and supplier management
- Item and inventory basics
- Approval foundation

Phase 3:

- Purchase workflow
- Sales workflow
- Inventory movement history
- Statistics using Chart.js

Phase 4:

- Advanced approval rules
- Audit logs
- Department-level analytics
- Export features

