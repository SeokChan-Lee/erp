import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getErrorMessage } from "../../shared/api/http";
import { useAuditLogsQuery } from "./api/auditApi";
import type { AuditLog, AuditLogDomainFilter, AuditLogQueryParams } from "./api/dto";
import { AuditLogDetailModal, LoginAuditPanel, WorkAuditPanel } from "./components/AuditLogSections";

const PAGE_SIZE = 20;

export function AuditLogView() {
  const navigate = useNavigate();
  const [loginPage, setLoginPage] = useState(1);
  const [workPage, setWorkPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [domainType, setDomainType] = useState<AuditLogDomainFilter>("WORK");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loginParams = useMemo<AuditLogQueryParams>(
    () => ({
      page: loginPage,
      pageSize: PAGE_SIZE,
      search: "",
      domainType: "AUTH",
      startDate: "",
      endDate: ""
    }),
    [loginPage]
  );

  const workParams = useMemo<AuditLogQueryParams>(
    () => ({
      page: workPage,
      pageSize: PAGE_SIZE,
      search,
      domainType,
      startDate,
      endDate
    }),
    [domainType, endDate, search, startDate, workPage]
  );

  const { data: loginLogsPage, error: loginError, isLoading: loginLoading } = useAuditLogsQuery(loginParams);
  const { data: workLogsPage, error: workError, isLoading: workLoading } = useAuditLogsQuery(workParams);
  const loginLogs = loginLogsPage?.content ?? [];
  const totalLoginLogs = loginLogsPage?.totalItems ?? 0;
  const workLogs = workLogsPage?.content ?? [];
  const totalWorkLogs = workLogsPage?.totalItems ?? 0;
  const error = loginError || workError;
  const domainOptions = [
    { value: "WORK" as const, label: "전체 업무" },
    { value: "INVENTORY" as const, label: "재고" },
    { value: "PURCHASE" as const, label: "구매" },
    { value: "SALES" as const, label: "판매" }
  ];

  const applySearch = () => {
    setSearch(searchInput.trim());
    setWorkPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDomainType("WORK");
    setStartDate("");
    setEndDate("");
    setWorkPage(1);
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error)}
        </p>
      ) : null}

      <LoginAuditPanel
        logs={loginLogs}
        loading={loginLoading}
        page={loginPage}
        pageSize={PAGE_SIZE}
        totalItems={totalLoginLogs}
        onPageChange={setLoginPage}
        onSelectLog={setSelectedLog}
      />

      <WorkAuditPanel
        logs={workLogs}
        loading={workLoading}
        searchInput={searchInput}
        domainType={domainType}
        domainOptions={domainOptions}
        startDate={startDate}
        endDate={endDate}
        page={workPage}
        pageSize={PAGE_SIZE}
        totalItems={totalWorkLogs}
        onSearchInputChange={setSearchInput}
        onDomainTypeChange={(value) => {
          setDomainType(value);
          setWorkPage(1);
        }}
        onStartDateChange={(value) => {
          setStartDate(value);
          setWorkPage(1);
        }}
        onEndDateChange={(value) => {
          setEndDate(value);
          setWorkPage(1);
        }}
        onApplySearch={applySearch}
        onClearFilters={clearFilters}
        onPageChange={setWorkPage}
        onSelectLog={setSelectedLog}
        onNavigate={navigate}
      />

      <AuditLogDetailModal selectedLog={selectedLog} onClose={() => setSelectedLog(null)} onNavigate={navigate} />
    </div>
  );
}
