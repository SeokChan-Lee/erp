import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  AvailableEmployee,
  Department,
  EmployeeAccountCreatePayload,
  UserAccount,
  UserAccountCreatePayload,
  UserAccountsQueryParams,
  UserAccountRolesUpdatePayload,
  UserAccountUpdatePayload
} from "./dto";

export const userManagementKeys = {
  departments: ["user-management", "departments"] as const,
  usersRoot: ["user-management", "users"] as const,
  users: (params: UserAccountsQueryParams) => ["user-management", "users", params] as const,
  availableEmployees: ["user-management", "available-employees"] as const
};

export function useUserManagementDepartmentsQuery() {
  return useQuery({
    queryKey: userManagementKeys.departments,
    queryFn: () => http<Department[]>("/departments")
  });
}

export function useUserAccountsQuery(params: UserAccountsQueryParams) {
  return useQuery({
    queryKey: userManagementKeys.users(params),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.status !== "ALL") {
        query.set("status", params.status);
      }
      if (params.role !== "ALL") {
        query.set("role", params.role);
      }
      return http<PageResponse<UserAccount>>(`/users?${query.toString()}`);
    }
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
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.usersRoot });
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
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.usersRoot });
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
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.usersRoot });
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
      void queryClient.invalidateQueries({ queryKey: userManagementKeys.usersRoot });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}
