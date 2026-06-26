export type AuditLogDomainFilter = "ALL" | "AUTH" | "INVENTORY" | "PURCHASE" | "SALES";

export type AuditLog = {
  id: number;
  domainType: "AUTH" | "INVENTORY" | "PURCHASE" | "SALES";
  eventType: string;
  referenceNo: string;
  summary: string;
  detail: string | null;
  actor: string;
  occurredAt: string;
};

export type AuditLogQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  domainType: AuditLogDomainFilter;
  startDate: string;
  endDate: string;
};
