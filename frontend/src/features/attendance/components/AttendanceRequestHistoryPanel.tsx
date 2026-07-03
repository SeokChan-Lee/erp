import { Button } from "../../../shared/ui/Button";
import { DateField } from "../../../shared/ui/DateField";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { AttendanceChangeRequest, AttendanceChangeRequestStatus } from "../api/dto";
import { StatusBadge } from "./attendanceDisplay";

type AttendanceRequestHistoryPanelProps = {
  requests: AttendanceChangeRequest[];
  totalItems: number;
  page: number;
  pageSize: number;
  loading: boolean;
  searchInput: string;
  statusFilter: "ALL" | AttendanceChangeRequestStatus;
  statusOptions: Array<{ value: "ALL" | AttendanceChangeRequestStatus; label: string }>;
  startDate: string;
  endDate: string;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: "ALL" | AttendanceChangeRequestStatus) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
};

export function AttendanceRequestHistoryPanel({
  requests,
  totalItems,
  page,
  pageSize,
  loading,
  searchInput,
  statusFilter,
  statusOptions,
  startDate,
  endDate,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onStartDateChange,
  onEndDateChange,
  onResetFilters,
  onPageChange
}: AttendanceRequestHistoryPanelProps) {
  return (
    <Panel title="근태 수정 처리 이력" description="근태 수정 요청의 승인, 반려 처리 결과를 확인합니다.">
      {loading ? (
        <p className="text-sm font-semibold text-axis-muted">처리 이력을 불러오는 중입니다.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid items-end gap-3 xl:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_auto]">
            <TextField label="검색" placeholder="직원, 일자, 사유, 처리자" value={searchInput} onChange={(event) => onSearchInputChange(event.target.value)} onEnter={onApplySearch} />
            <SelectField label="처리 상태" value={statusFilter} options={statusOptions} onChange={onStatusChange} />
            <DateField label="시작일" value={startDate} onChange={onStartDateChange} />
            <DateField label="종료일" value={endDate} onChange={onEndDateChange} />
            <ResetButton className="w-full" onClick={onResetFilters} />
          </div>

          {requests.length === 0 ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">조건에 맞는 근태 수정 이력이 없습니다.</p>
          ) : (
            <TableFrame>
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                  <tr>
                    <th className="px-4 py-3">직원</th>
                    <th className="px-4 py-3">수정 일자</th>
                    <th className="px-4 py-3">요청 시간</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">처리자</th>
                    <th className="px-4 py-3">사유</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-axis-border bg-white">
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-4 text-sm font-bold text-axis-ink">{request.requesterName}</td>
                      <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.workDate}</td>
                      <td className="px-4 py-4 text-sm font-medium text-axis-ink">{request.requestedCheckInAt.slice(0, 5)} - {request.requestedCheckOutAt.slice(0, 5)}</td>
                      <td className="px-4 py-4"><StatusBadge status={request.status} /></td>
                      <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.processedBy ?? "-"}</td>
                      <td className="max-w-[320px] px-4 py-4 text-sm font-medium text-axis-muted">
                        <span className="block truncate">{request.status === "REJECTED" ? request.rejectReason : request.reason}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />
            </TableFrame>
          )}
        </div>
      )}
    </Panel>
  );
}
