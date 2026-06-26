import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { useAuditLogsQuery } from "./api/auditApi";
import type { AuditLog, AuditLogDomainFilter, AuditLogQueryParams } from "./api/dto";

const PAGE_SIZE = 20;

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [domainType, setDomainType] = useState<AuditLogDomainFilter>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo<AuditLogQueryParams>(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search,
      domainType,
      startDate,
      endDate
    }),
    [domainType, endDate, page, search, startDate]
  );

  const { data: logsPage, error, isLoading } = useAuditLogsQuery(params);
  const logs = logsPage?.content ?? [];
  const totalLogs = logsPage?.totalItems ?? 0;
  const domainOptions = [
    { value: "ALL" as const, label: "전체" },
    { value: "AUTH" as const, label: "인증" },
    { value: "INVENTORY" as const, label: "재고" },
    { value: "PURCHASE" as const, label: "구매" },
    { value: "SALES" as const, label: "판매" }
  ];

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setDomainType("ALL");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error)}
        </p>
      ) : null}

      <Panel title="운영 이력" description="로그인, 재고, 구매, 판매 처리처럼 추적이 필요한 업무 이력을 확인합니다.">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto_auto]">
          <TextField
            label="검색"
            placeholder="처리자, 참조번호, 작업 내용"
            value={searchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setSearchInput(event.target.value)}
            onEnter={applySearch}
          />
          <SelectField
            label="업무 영역"
            value={domainType}
            options={domainOptions}
            onChange={(value) => {
              setDomainType(value);
              setPage(1);
            }}
          />
          <DateField
            label="시작일"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              setPage(1);
            }}
          />
          <DateField
            label="종료일"
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              setPage(1);
            }}
          />
          <Button className="mt-7 h-11" type="button" variant="secondary" onClick={applySearch}>
            검색 적용
          </Button>
          <Button className="mt-7 h-11" type="button" variant="ghost" onClick={clearFilters}>
            초기화
          </Button>
        </div>

        {isLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            운영 이력을 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">일시</th>
                  <th className="px-4 py-3">영역</th>
                  <th className="px-4 py-3">작업</th>
                  <th className="px-4 py-3">참조</th>
                  <th className="px-4 py-3">내용</th>
                  <th className="px-4 py-3">처리자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{formatDateTime(log.occurredAt)}</td>
                    <td className="px-4 py-4"><DomainBadge domainType={log.domainType} /></td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{log.summary}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{eventLabel(log.eventType)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{log.referenceNo || "-"}</td>
                    <td className="max-w-[360px] px-4 py-4 text-sm font-medium text-axis-muted">
                      <span className="block truncate" title={log.detail ?? ""}>{log.detail ?? "-"}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{log.actor}</td>
                  </tr>
                ))}
                {logs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>
                      조건에 맞는 운영 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} totalItems={totalLogs} onPageChange={setPage} />
          </div>
        )}
      </Panel>
    </div>
  );
}

function DomainBadge({ domainType }: { domainType: AuditLog["domainType"] }) {
  const meta =
    domainType === "AUTH"
      ? { label: "인증", className: "bg-axis-bg text-axis-muted" }
      : domainType === "INVENTORY"
        ? { label: "재고", className: "bg-emerald-50 text-emerald-700" }
        : domainType === "PURCHASE"
          ? { label: "구매", className: "bg-blue-50 text-blue-700" }
          : { label: "판매", className: "bg-violet-50 text-violet-700" };

  return <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", meta.className].join(" ")}>{meta.label}</span>;
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    AUTH_LOGIN: "로그인",
    AUTH_LOGOUT: "로그아웃",
    INVENTORY_ADJUST: "재고 조정",
    PURCHASE_REQUEST_CREATE: "구매 요청 생성",
    PURCHASE_REQUEST_APPROVE: "구매 요청 승인",
    PURCHASE_REQUEST_CANCEL: "구매 요청 취소",
    PURCHASE_ORDER_CREATE: "구매 발주 전환",
    PURCHASE_ORDER_RECEIVE: "구매 입고",
    PURCHASE_ORDER_RECEIVE_CANCEL: "구매 입고 취소",
    SALES_ORDER_CREATE: "판매 수주 등록",
    SALES_ORDER_CANCEL: "판매 수주 취소",
    SALES_ORDER_SHIP: "판매 출고",
    SALES_ORDER_SHIP_CANCEL: "판매 출고 취소"
  };
  return labels[eventType] ?? eventType;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
