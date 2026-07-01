import { useMemo, useState } from "react";
import { ArrowUpRight, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { ResetButton } from "../../shared/ui/ResetButton";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { useAuditLogsQuery } from "./api/auditApi";
import type { AuditLog, AuditLogDomainFilter, AuditLogQueryParams } from "./api/dto";

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

      <Panel title="로그인 이력" description="사용자의 로그인과 로그아웃 기록을 확인합니다.">
        {loginLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            로그인 이력을 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">일시</th>
                  <th className="px-4 py-3">작업</th>
                  <th className="px-4 py-3">내용</th>
                  <th className="px-4 py-3">사용자</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {loginLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-muted">{formatDateTime(log.occurredAt)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-axis-ink">{eventLabel(log.eventType)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-axis-muted">{log.detail || log.summary}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{log.actor}</td>
                    <td className="px-4 py-4">
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => setSelectedLog(log)}>
                        <Eye size={14} strokeWidth={2.2} />
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
                {loginLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={5}>
                      로그인 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={loginPage} pageSize={PAGE_SIZE} totalItems={totalLoginLogs} onPageChange={setLoginPage} />
          </div>
        )}
      </Panel>

      <Panel title="업무 이력" description="재고, 구매, 판매 처리처럼 추적이 필요한 업무 이력을 확인합니다.">
        <div className="mb-4 grid items-end gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto_auto]">
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
              setWorkPage(1);
            }}
          />
          <DateField
            label="시작일"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              setWorkPage(1);
            }}
          />
          <DateField
            label="종료일"
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              setWorkPage(1);
            }}
          />
          <Button className="h-11" type="button" variant="secondary" onClick={applySearch}>
            검색 적용
          </Button>
          <ResetButton onClick={clearFilters} />
        </div>

        {workLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            업무 이력을 불러오는 중입니다.
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
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {workLogs.map((log) => {
                  const targetPath = auditTargetPath(log);
                  return (
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
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => setSelectedLog(log)}>
                            <Eye size={14} strokeWidth={2.2} />
                            상세
                          </Button>
                          {targetPath ? (
                            <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="ghost" onClick={() => navigate(targetPath)}>
                              <ArrowUpRight size={14} strokeWidth={2.2} />
                              이동
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {workLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={7}>
                      조건에 맞는 업무 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={workPage} pageSize={PAGE_SIZE} totalItems={totalWorkLogs} onPageChange={setWorkPage} />
          </div>
        )}
      </Panel>

      <Modal
        open={selectedLog !== null}
        title="이력 상세"
        description="선택한 처리 이력의 기준 정보와 상세 내용을 확인합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedLog(null)}>
              닫기
            </Button>
            {selectedLog && auditTargetPath(selectedLog) ? (
              <Button type="button" onClick={() => navigate(auditTargetPath(selectedLog) ?? "/audit")}>
                원본 업무 이동
              </Button>
            ) : null}
          </>
        }
        onClose={() => setSelectedLog(null)}
      >
        {selectedLog ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="처리 일시" value={formatDateTime(selectedLog.occurredAt)} />
              <InfoItem label="업무 영역" value={domainLabel(selectedLog.domainType)} />
              <InfoItem label="작업" value={eventLabel(selectedLog.eventType)} />
              <InfoItem label="참조번호" value={selectedLog.referenceNo || "-"} />
              <InfoItem label="처리자" value={selectedLog.actor} />
            </div>
            <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <p className="text-xs font-bold text-axis-muted">요약</p>
              <p className="mt-2 text-sm font-bold text-axis-ink">{selectedLog.summary}</p>
            </div>
            <div className="rounded-lg border border-axis-border p-4">
              <p className="text-xs font-bold text-axis-muted">상세 내용</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-axis-ink">{selectedLog.detail || "등록된 상세 내용이 없습니다."}</p>
            </div>
          </div>
        ) : null}
      </Modal>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border px-4 py-3">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-axis-ink">{value}</p>
    </div>
  );
}

function auditTargetPath(log: AuditLog) {
  if (!log.referenceNo) return null;

  const query = new URLSearchParams();
  if (log.domainType === "PURCHASE") {
    if (log.eventType.startsWith("PURCHASE_REQUEST")) {
      query.set("requestSearch", log.referenceNo);
    } else {
      query.set("orderSearch", log.referenceNo);
    }
    return `/purchase?${query.toString()}`;
  }
  if (log.domainType === "SALES") {
    query.set("search", log.referenceNo);
    return `/sales?${query.toString()}`;
  }
  if (log.domainType === "INVENTORY") {
    query.set("movementSearch", log.referenceNo);
    return `/inventory?${query.toString()}`;
  }
  return null;
}

function domainLabel(domainType: AuditLog["domainType"]) {
  if (domainType === "AUTH") return "인증";
  if (domainType === "INVENTORY") return "재고";
  if (domainType === "PURCHASE") return "구매";
  return "판매";
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    AUTH_LOGIN: "로그인",
    AUTH_LOGOUT: "로그아웃",
    WAREHOUSE_CREATE: "창고 등록",
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
