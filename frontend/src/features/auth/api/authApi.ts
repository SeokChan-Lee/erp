import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, http } from "../../../shared/api/http";
import type { AuthUser, LoginPayload } from "./dto";

export const authKeys = {
  me: ["auth", "me"] as const
};

export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => http<AuthUser>("/auth/me"),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      return failureCount < 1;
    }
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) =>
      http<AuthUser>("/auth/login", {
        method: "POST",
        json: payload
      }),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
    }
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => http<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.removeQueries({ queryKey: ["dashboard"] });
      queryClient.removeQueries({ queryKey: ["attendance"] });
    }
  });
}
