export type AuthUser = {
  username: string;
  displayName: string;
  employee: AuthEmployeeProfile | null;
  roles: string[];
  permissions: string[];
};

export type AuthEmployeeProfile = {
  id: number;
  employeeNo: string;
  displayName: string;
  email: string;
  positionTitle: string;
  status: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};
