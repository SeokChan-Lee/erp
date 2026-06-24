import type { RoleCode } from "../../../shared/config/accessControlMeta";
import type { EmployeeStatusCode } from "../../../shared/config/domainLabels";

export type Department = {
  id: number;
  code: string;
  name: string;
  description: string;
};

export type UserAccount = {
  id: number;
  username: string;
  displayName: string;
  employee: {
    id: number;
    employeeNo: string;
    displayName: string;
    departmentName: string;
    positionTitle: string;
  } | null;
  roles: RoleCode[];
};

export type AvailableEmployee = {
  id: number;
  employeeNo: string;
  displayName: string;
  positionTitle: string;
  status: EmployeeStatusCode;
  department: {
    id: number;
    code: string;
    name: string;
  };
};

export type EmployeeAccountCreatePayload = {
  employeeNo: string;
  displayName: string;
  email: string;
  positionTitle: string;
  status: EmployeeStatusCode;
  departmentId: number;
  username: string;
  password: string;
  roles: RoleCode[];
};

export type UserAccountCreatePayload = {
  username: string;
  password: string;
  employeeId: number;
  roles: RoleCode[];
};

export type UserAccountRolesUpdatePayload = {
  roles: RoleCode[];
};

export type UserAccountUpdatePayload = {
  password?: string;
  roles: RoleCode[];
};
