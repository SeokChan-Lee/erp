import type { EmployeeUpdatePayload } from "./api/dto";

export type EmployeeEditForm = EmployeeUpdatePayload & {
  id: number;
};
