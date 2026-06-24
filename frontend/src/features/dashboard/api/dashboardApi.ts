import { useQuery } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { DashboardSummary } from "./dto";

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => http<DashboardSummary>("/dashboard/summary")
  });
}
