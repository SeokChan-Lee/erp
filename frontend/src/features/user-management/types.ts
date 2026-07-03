import type { RoleCode } from "../../shared/config/accessControlMeta";

export type UserAccountCreateForm = {
  employeeId: number;
  username: string;
  password: string;
  roles: RoleCode[];
};

export type UserAccountEditForm = {
  password: string;
  passwordConfirm: string;
  departmentId: number;
  roles: RoleCode[];
  active: boolean;
};
