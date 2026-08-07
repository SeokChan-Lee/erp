import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 15_000
    }
  }
});

export function clearAuthenticatedCache() {
  queryClient.clear();
  queryClient.setQueryData(["auth", "me"], null);
}
