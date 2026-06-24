import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type {
  AvailableEmployee,
  Department,
  EmployeeAccountCreatePayload,
  UserAccount,
  UserAccountCreatePayload,
  UserAccountRolesUpdatePayload,
  UserAccountUpdatePayload
} from "./dto";

export const userManagementKeys = {
  departments: ["user-management", "departments"] as const,
  users: ["user-management", "users"] as const,
  availableEmployees: ["user-management", "available-employees"] as const
};

export function useUserManagementDepartmentsQuery() {
  return useQuery({
    queryKey: userManagementKeys.departments,
    queryFn: () => http<Department[]>("/departments")
  });
}

export function useUserAccountsQuery() {
  return useQuery({
    queryKey: userManagementKeys.users,
    queryFn: () => http<UserAccount[]>("/users")
  });
}

export function useAvailableEmployeesQuery() {
  return useQuery({
    queryKey: userManagementKeys.availableEmployees,
    queryFn: () => http<AvailableEmployee[]>("/users/available-employees")
  });
}

export function useCreateEmployeeAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: EmployeeAccountCreatePayload) =>
      http<UserAccount>("/users/employee-account", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.users });
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.availableEmployees });
      void queryClient.invalidateQueries({ queryKey: ["organization", "employees"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}

export function useCreateUserAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserAccountCreatePayload) =>
      http<UserAccount>("/users", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.users });
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.availableEmployees });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}

export function useUpdateUserRolesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserAccountRolesUpdatePayload }) =>
      http<UserAccount>(`/users/${userId}/roles`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.users });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}

export function useUpdateUserAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserAccountUpdatePayload }) =>
      http<UserAccount>(`/users/${userId}`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.users });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}
