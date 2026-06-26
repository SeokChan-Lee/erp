import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { Department, DepartmentCreatePayload, Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from "./dto";

export const organizationKeys = {
  departments: ["organization", "departments"] as const,
  employees: ["organization", "employees"] as const
};

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: organizationKeys.departments,
    queryFn: () => http<Department[]>("/departments")
  });
}

export function useEmployeesQuery() {
  return useQuery({
    queryKey: organizationKeys.employees,
    queryFn: () => http<Employee[]>("/employees")
  });
}

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DepartmentCreatePayload) =>
      http<Department>("/departments", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.departments });
    }
  });
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmployeeCreatePayload) =>
      http<Employee>("/employees", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.employees });
    }
  });
}

export function useUpdateEmployeeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EmployeeUpdatePayload }) =>
      http<Employee>(`/employees/${id}`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.employees });
    }
  });
}
