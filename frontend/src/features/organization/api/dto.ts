export type Department = {
  id: number;
  code: string;
  name: string;
  description: string;
};

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED";

export type Employee = {
  id: number;
  employeeNo: string;
  displayName: string;
  email: string;
  positionTitle: string;
  status: EmployeeStatus;
  department: {
    id: number;
    code: string;
    name: string;
  };
};

export type EmployeeCreatePayload = {
  employeeNo: string;
  displayName: string;
  email: string;
  positionTitle: string;
  status: EmployeeStatus;
  departmentId: number;
};

export type EmployeeUpdatePayload = {
  displayName: string;
  email: string;
  positionTitle: string;
  status: EmployeeStatus;
  departmentId: number;
};
