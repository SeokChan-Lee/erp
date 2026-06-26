import { useQuery } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type { AuditLog, AuditLogQueryParams } from "./dto";

export const auditKeys = {
  logs: (params: AuditLogQueryParams) => ["audit", "logs", params] as const
};

export function useAuditLogsQuery(params: AuditLogQueryParams) {
  return useQuery({
    queryKey: auditKeys.logs(params),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.domainType !== "ALL") {
        query.set("domainType", params.domainType);
      }
      if (params.startDate) {
        query.set("startDate", params.startDate);
      }
      if (params.endDate) {
        query.set("endDate", params.endDate);
      }
      return http<PageResponse<AuditLog>>(`/audit-logs?${query.toString()}`);
    }
  });
}
