export type RoleCode =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "HR_MANAGER"
  | "SALES_MANAGER"
  | "PURCHASE_MANAGER"
  | "INVENTORY_MANAGER"
  | "APPROVER"
  | "EMPLOYEE"
  | "VIEWER";

export type PermissionCode = string;

export type RolePermission = {
  role: RoleCode;
  permissions: PermissionCode[];
};

export type RolePermissionUpdatePayload = {
  permissions: PermissionCode[];
};
