import { ArrowUpRight, Eye, Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { DateField } from "../../../shared/ui/DateField";
import { Modal } from "../../../shared/ui/Modal";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { AuditLog, AuditLogDomainFilter } from "../api/dto";

type DomainOption = {
  value: AuditLogDomainFilter;
  label: string;
};

export function LoginAuditPanel({
  logs,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onSelectLog
}: {
  logs: AuditLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onSelectLog: (log: AuditLog) => void;
}) {
  return (
    <Panel title="로그인 이력" description="사용자의 로그인과 로그아웃 기록을 확인합니다.">
      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
          로그인 이력을 불러오는 중입니다.
        </p>
      ) : (
        <TableFrame>
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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-muted">
                    {formatDateTime(log.occurredAt)}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-axis-ink">{eventLabel(log.eventType)}</td>
                  <td className="px-4 py-4 text-sm font-medium text-axis-muted">{log.detail || log.summary}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{log.actor}</td>
                  <td className="px-4 py-4">
                    <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectLog(log)}>
                      <Eye size={14} strokeWidth={2.2} />
                      상세
                    </Button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={5}>
                    로그인 이력이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}

export function WorkAuditPanel({
  logs,
  loading,
  searchInput,
  domainType,
  domainOptions,
  startDate,
  endDate,
  page,
  pageSize,
  totalItems,
  onSearchInputChange,
  onDomainTypeChange,
  onStartDateChange,
  onEndDateChange,
  onApplySearch,
  onClearFilters,
  onPageChange,
  onSelectLog,
  onNavigate
}: {
  logs: AuditLog[];
  loading: boolean;
  searchInput: string;
  domainType: AuditLogDomainFilter;
  domainOptions: DomainOption[];
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onSearchInputChange: (value: string) => void;
  onDomainTypeChange: (value: AuditLogDomainFilter) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApplySearch: () => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectLog: (log: AuditLog) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <Panel title="업무 이력" description="재고, 구매, 판매 처리처럼 추적이 필요한 업무 이력을 확인합니다.">
      <div className="mb-4 grid items-end gap-3 lg:grid-cols-[1fr_160px_160px_160px_auto_auto]">
        <TextField
          label="검색"
          placeholder="처리자, 참조번호, 작업 내용"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <SelectField label="업무 영역" value={domainType} options={domainOptions} onChange={onDomainTypeChange} />
        <DateField label="시작일" value={startDate} onChange={onStartDateChange} />
        <DateField label="종료일" value={endDate} onChange={onEndDateChange} />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>
          검색 적용
        </Button>
        <ResetButton onClick={onClearFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
          업무 이력을 불러오는 중입니다.
        </p>
      ) : (
        <TableFrame>
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
              {logs.map((log) => {
                const targetPath = auditTargetPath(log);
                return (
                  <tr key={log.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{formatDateTime(log.occurredAt)}</td>
                    <td className="px-4 py-4">
                      <DomainBadge domainType={log.domainType} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{log.summary}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{eventLabel(log.eventType)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{log.referenceNo || "-"}</td>
                    <td className="max-w-[360px] px-4 py-4 text-sm font-medium text-axis-muted">
                      <span className="block truncate" title={log.detail ?? ""}>
                        {log.detail ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{log.actor}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectLog(log)}>
                          <Eye size={14} strokeWidth={2.2} />
                          상세
                        </Button>
                        {targetPath ? (
                          <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="ghost" onClick={() => onNavigate(targetPath)}>
                            <ArrowUpRight size={14} strokeWidth={2.2} />
                            이동
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={7}>
                    조건에 맞는 업무 이력이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}

export function AuditLogDetailModal({
  selectedLog,
  onClose,
  onNavigate
}: {
  selectedLog: AuditLog | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <Modal
      open={selectedLog !== null}
      title="이력 상세"
      description="선택한 처리 이력의 기준 정보와 상세 내용을 확인합니다."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
          {selectedLog && auditTargetPath(selectedLog) ? (
            <Button type="button" onClick={() => onNavigate(auditTargetPath(selectedLog) ?? "/audit")}>
              원본 업무 이동
            </Button>
          ) : null}
        </>
      }
      onClose={onClose}
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
            <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-axis-ink">
              {selectedLog.detail || "등록된 상세 내용이 없습니다."}
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
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
