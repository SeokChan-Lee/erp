import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { TableFrame } from "../../../shared/ui/TableFrame";
import type { AttendanceChangeRequest } from "../api/dto";

type PendingAttendanceRequestsPanelProps = {
  requests: AttendanceChangeRequest[];
  selectedIds: number[];
  selectedSet: Set<number>;
  allSelected: boolean;
  loading: boolean;
  approvePending: boolean;
  rejectPending: boolean;
  onToggleAll: () => void;
  onToggleRequest: (requestId: number) => void;
  onDetail: (request: AttendanceChangeRequest) => void;
  onOpenReject: () => void;
  onApproveSelected: () => void;
};

export function PendingAttendanceRequestsPanel({
  requests,
  selectedIds,
  selectedSet,
  allSelected,
  loading,
  approvePending,
  rejectPending,
  onToggleAll,
  onToggleRequest,
  onDetail,
  onOpenReject,
  onApproveSelected
}: PendingAttendanceRequestsPanelProps) {
  return (
    <Panel title="근태 수정 승인" description="직원이 요청한 근태 수정 건을 확인하고 선택한 요청을 승인합니다.">
      {loading ? (
        <p className="text-sm font-semibold text-axis-muted">근태 수정 요청을 불러오는 중입니다.</p>
      ) : requests.length === 0 ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">승인 대기 중인 근태 수정 요청이 없습니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3"><input checked={allSelected} className="h-4 w-4 accent-axis-ink" type="checkbox" onChange={onToggleAll} /></th>
                <th className="px-4 py-3">직원</th>
                <th className="px-4 py-3">수정 일자</th>
                <th className="px-4 py-3">요청 시간</th>
                <th className="px-4 py-3">사유</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-4">
                    <input checked={selectedSet.has(request.id)} className="h-4 w-4 accent-axis-ink" type="checkbox" onChange={() => onToggleRequest(request.id)} />
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-axis-ink">{request.requesterName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.workDate}</td>
                  <td className="px-4 py-4 text-sm font-medium text-axis-ink">{request.requestedCheckInAt.slice(0, 5)} - {request.requestedCheckOutAt.slice(0, 5)}</td>
                  <td className="max-w-[280px] px-4 py-4 text-sm font-medium text-axis-muted"><span className="block truncate">{request.reason}</span></td>
                  <td className="px-4 py-4">
                    <Button className="h-8 px-3 text-xs" type="button" variant="secondary" onClick={() => onDetail(request)}>상세보기</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t border-axis-border bg-white px-4 py-3">
            <div className="flex gap-2">
              <Button disabled={selectedIds.length === 0 || rejectPending} type="button" variant="secondary" onClick={onOpenReject}>
                선택 {selectedIds.length}건 반려
              </Button>
              <Button disabled={selectedIds.length === 0 || approvePending} type="button" onClick={onApproveSelected}>
                {approvePending ? "승인 중" : `선택 ${selectedIds.length}건 승인`}
              </Button>
            </div>
          </div>
        </TableFrame>
      )}
    </Panel>
  );
}
