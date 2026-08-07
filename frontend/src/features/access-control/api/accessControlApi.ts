import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { RoleCode, RolePermission, RolePermissionUpdatePayload } from "./dto";

export const accessControlKeys = {
  roles: ["access-control", "roles"] as const
};

export function useRolePermissionsQuery() {
  return useQuery({
    queryKey: accessControlKeys.roles,
    queryFn: () => http<RolePermission[]>("/roles")
  });
}

export function useUpdateRolePermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, payload }: { role: RoleCode; payload: RolePermissionUpdatePayload }) =>
      http<RolePermission>(`/roles/${role}/permissions`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accessControlKeys.roles });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  });
}

export function useUpdateRoleDefaultPermissionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, payload }: { role: RoleCode; payload: RolePermissionUpdatePayload }) =>
      http<RolePermission>(`/roles/${role}/default-permissions`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accessControlKeys.roles });
    }
  });
}
