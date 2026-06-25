import { FormEvent, useMemo, useState } from "react";

import {
  useApproveAttendanceChangeRequestsMutation,
  useAttendanceChangeRequestHistoryQuery,
  useAttendanceMutation,
  useCreateAttendanceChangeRequestMutation,
  useMonthlyAttendanceQuery,
  usePendingAttendanceChangeRequestsQuery,
  useRejectAttendanceChangeRequestsMutation,
  useTodayAttendanceQuery,
  useUpdateAttendanceMutation
} from "./api/attendanceApi";
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestHistoryParams,
  AttendanceChangeRequestStatus
} from "./api/dto";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { attendanceStatusMeta } from "./config/attendanceMeta";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { TimeField } from "../../shared/ui/TimeField";

const HISTORY_PAGE_SIZE = 20;

const initialRequestForm = {
  workDate: formatDateInputValue(new Date()),
  requestedCheckInAt: "09:00",
  requestedCheckOutAt: "18:00",
  reason: ""
};

export function AttendanceView({ permissions = [] }: { permissions?: string[] }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState(initialRequestForm);
  const [selectedRequestIds, setSelectedRequestIds] = useState<number[]>([]);
  const [detailRequest, setDetailRequest] = useState<AttendanceChangeRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [historySearchInput, setHistorySearchInput] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"ALL" | AttendanceChangeRequestStatus>("ALL");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const canApproveAttendance = permissions.includes("ATTENDANCE_APPROVE");
  const canUpdateAttendance = permissions.includes("ATTENDANCE_UPDATE");
  const { data: today, error } = useTodayAttendanceQuery();
  const {
    data: monthlyRecords = [],
    error: monthlyError,
    isLoading: monthlyLoading
  } = useMonthlyAttendanceQuery(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1);
  const {
    data: pendingRequests = [],
    error: pendingRequestsError,
    isLoading: pendingRequestsLoading
  } = usePendingAttendanceChangeRequestsQuery(canApproveAttendance);
  const historyParams = useMemo<AttendanceChangeRequestHistoryParams>(
    () => ({
      page: historyPage,
      pageSize: HISTORY_PAGE_SIZE,
      search: historySearch,
      status: historyStatusFilter,
      startDate: historyStartDate,
      endDate: historyEndDate
    }),
    [historyEndDate, historyPage, historySearch, historyStartDate, historyStatusFilter]
  );
  const {
    data: requestHistoryPage,
    error: requestHistoryError,
    isLoading: requestHistoryLoading
  } = useAttendanceChangeRequestHistoryQuery(historyParams, canApproveAttendance);
  const createChangeRequest = useCreateAttendanceChangeRequestMutation();
  const updateAttendance = useUpdateAttendanceMutation(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1);
  const approveChangeRequests = useApproveAttendanceChangeRequestsMutation(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1);
  const rejectChangeRequests = useRejectAttendanceChangeRequestsMutation();
  const checkInMutation = useAttendanceMutation("check-in");
  const checkOutMutation = useAttendanceMutation("check-out");
  const loading = checkInMutation.isPending || checkOutMutation.isPending;

  const status = today ? attendanceStatusMeta[today.status].label : "확인 중";
  const checkInDisabled = loading || Boolean(today?.checkInAt);
  const checkOutDisabled = loading || Boolean(today?.checkOutAt);
  const requestFormReady =
    requestForm.workDate.length > 0 &&
    requestForm.requestedCheckInAt.length > 0 &&
    requestForm.requestedCheckOutAt.length > 0 &&
    (canUpdateAttendance || requestForm.reason.trim().length > 0);
  const allSelected = pendingRequests.length > 0 && selectedRequestIds.length === pendingRequests.length;

  const selectedRequestSet = useMemo(() => new Set(selectedRequestIds), [selectedRequestIds]);
  const historyStatusOptions = useMemo(
    () => [
      { value: "ALL" as const, label: "전체" },
      { value: "PENDING" as const, label: "대기" },
      { value: "APPROVED" as const, label: "승인" },
      { value: "REJECTED" as const, label: "반려" }
    ],
    []
  );
  const requestHistory = requestHistoryPage?.content ?? [];
  const totalHistoryItems = requestHistoryPage?.totalItems ?? 0;

  const handleRequestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestFormReady) return;

    if (canUpdateAttendance) {
      updateAttendance.mutate(
        {
          workDate: requestForm.workDate,
          requestedCheckInAt: requestForm.requestedCheckInAt,
          requestedCheckOutAt: requestForm.requestedCheckOutAt
        },
        {
          onSuccess: () => {
            setRequestOpen(false);
            setRequestForm(initialRequestForm);
          }
        }
      );
      return;
    }

    createChangeRequest.mutate(
      {
        ...requestForm,
        reason: requestForm.reason.trim()
      },
      {
        onSuccess: () => {
          setRequestOpen(false);
          setRequestForm(initialRequestForm);
        }
      }
    );
  };

  const toggleRequest = (requestId: number) => {
    setSelectedRequestIds((current) =>
      current.includes(requestId) ? current.filter((id) => id !== requestId) : [...current, requestId]
    );
  };

  const toggleAllRequests = () => {
    setSelectedRequestIds(allSelected ? [] : pendingRequests.map((request) => request.id));
  };

  const handleApproveSelected = () => {
    if (selectedRequestIds.length === 0) return;
    approveChangeRequests.mutate(
      { requestIds: selectedRequestIds },
      {
        onSuccess: () => setSelectedRequestIds([])
      }
    );
  };

  const handleRejectSelected = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedRequestIds.length === 0 || rejectReason.trim().length === 0) return;

    rejectChangeRequests.mutate(
      {
        requestIds: selectedRequestIds,
        rejectReason: rejectReason.trim()
      },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setRejectReason("");
          setSelectedRequestIds([]);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <Panel title="오늘 근태" description="로그인 쿠키를 기준으로 현재 사용자의 출퇴근 기록을 처리합니다.">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-medium text-axis-muted">현재 상태</p>
            <p className="mt-2 text-3xl font-semibold text-axis-ink">{status}</p>
            <p className="mt-2 text-sm text-axis-muted">
              출근 {formatTime(today?.checkInAt)} / 퇴근 {formatTime(today?.checkOutAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button disabled={checkInDisabled} onClick={() => checkInMutation.mutate()}>
              출근하기
            </Button>
            <Button disabled={checkOutDisabled} variant="secondary" onClick={() => checkOutMutation.mutate()}>
              퇴근하기
            </Button>
            <Button type="button" variant="secondary" onClick={() => setRequestOpen(true)}>
              {canUpdateAttendance ? "근태 수정" : "근태 수정 요청"}
            </Button>
          </div>
        </div>
      </Panel>

      {error ||
      monthlyError ||
      pendingRequestsError ||
      requestHistoryError ||
      checkInMutation.error ||
      checkOutMutation.error ||
      createChangeRequest.error ||
      updateAttendance.error ||
      rejectChangeRequests.error ||
      approveChangeRequests.error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(
            error ||
              monthlyError ||
              pendingRequestsError ||
              requestHistoryError ||
              checkInMutation.error ||
              checkOutMutation.error ||
              createChangeRequest.error ||
              updateAttendance.error ||
              rejectChangeRequests.error ||
              approveChangeRequests.error
          )}
        </p>
      ) : null}

      <Panel title="월간 근태 캘린더" description="일자별 출근, 퇴근, 근태 상태를 캘린더로 확인합니다.">
        {monthlyLoading ? (
          <p className="rounded-lg border border-axis-border bg-white px-4 py-5 text-sm font-semibold text-axis-muted">
            월간 근태 기록을 불러오는 중입니다.
          </p>
        ) : (
          <AttendanceCalendar
            monthDate={visibleMonth}
            records={monthlyRecords}
            onMonthChange={setVisibleMonth}
          />
        )}
      </Panel>

      {canApproveAttendance ? (
        <Panel title="근태 수정 승인" description="직원이 요청한 근태 수정 건을 확인하고 선택한 요청을 승인합니다.">
          {pendingRequestsLoading ? (
            <p className="text-sm font-semibold text-axis-muted">근태 수정 요청을 불러오는 중입니다.</p>
          ) : pendingRequests.length === 0 ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
              승인 대기 중인 근태 수정 요청이 없습니다.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-axis-border">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        checked={allSelected}
                        className="h-4 w-4 accent-axis-ink"
                        type="checkbox"
                        onChange={toggleAllRequests}
                      />
                    </th>
                    <th className="px-4 py-3">직원</th>
                    <th className="px-4 py-3">수정 일자</th>
                    <th className="px-4 py-3">요청 시간</th>
                    <th className="px-4 py-3">사유</th>
                    <th className="px-4 py-3">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-axis-border bg-white">
                  {pendingRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-4">
                        <input
                          checked={selectedRequestSet.has(request.id)}
                          className="h-4 w-4 accent-axis-ink"
                          type="checkbox"
                          onChange={() => toggleRequest(request.id)}
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-axis-ink">{request.requesterName}</td>
                      <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.workDate}</td>
                      <td className="px-4 py-4 text-sm font-medium text-axis-ink">
                        {request.requestedCheckInAt.slice(0, 5)} - {request.requestedCheckOutAt.slice(0, 5)}
                      </td>
                      <td className="max-w-[280px] px-4 py-4 text-sm font-medium text-axis-muted">
                        <span className="block truncate">{request.reason}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Button className="h-8 px-3 text-xs" type="button" variant="secondary" onClick={() => setDetailRequest(request)}>
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end border-t border-axis-border bg-white px-4 py-3">
                <div className="flex gap-2">
                  <Button
                    disabled={selectedRequestIds.length === 0 || rejectChangeRequests.isPending}
                    type="button"
                    variant="secondary"
                    onClick={() => setRejectOpen(true)}
                  >
                    선택 {selectedRequestIds.length}건 반려
                  </Button>
                  <Button
                    disabled={selectedRequestIds.length === 0 || approveChangeRequests.isPending}
                    type="button"
                    onClick={handleApproveSelected}
                  >
                    {approveChangeRequests.isPending ? "승인 중" : `선택 ${selectedRequestIds.length}건 승인`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      ) : null}

      {canApproveAttendance ? (
        <Panel title="근태 수정 처리 이력" description="근태 수정 요청의 승인, 반려 처리 결과를 확인합니다.">
          {requestHistoryLoading ? (
            <p className="text-sm font-semibold text-axis-muted">처리 이력을 불러오는 중입니다.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr_auto]">
                <TextField
                  label="검색"
                  placeholder="직원, 일자, 사유, 처리자"
                  value={historySearchInput}
                  onChange={(event) => setHistorySearchInput(event.target.value)}
                  onEnter={() => {
                    setHistorySearch(historySearchInput.trim());
                    setHistoryPage(1);
                  }}
                />
                <SelectField
                  label="처리 상태"
                  value={historyStatusFilter}
                  options={historyStatusOptions}
                  onChange={(status) => {
                    setHistoryStatusFilter(status);
                    setHistoryPage(1);
                  }}
                />
                <DateField
                  label="시작일"
                  value={historyStartDate}
                  onChange={(startDate) => {
                    setHistoryStartDate(startDate);
                    setHistoryPage(1);
                  }}
                />
                <DateField
                  label="종료일"
                  value={historyEndDate}
                  onChange={(endDate) => {
                    setHistoryEndDate(endDate);
                    setHistoryPage(1);
                  }}
                />
                <div className="flex items-end">
                  <Button
                    className="h-11 w-full px-3"
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setHistoryStartDate("");
                      setHistoryEndDate("");
                      setHistoryPage(1);
                    }}
                  >
                    기간 초기화
                  </Button>
                </div>
              </div>

              {requestHistory.length === 0 ? (
                <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
                  조건에 맞는 근태 수정 이력이 없습니다.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-axis-border">
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
                      {requestHistory.map((request) => (
                        <tr key={request.id}>
                          <td className="px-4 py-4 text-sm font-bold text-axis-ink">{request.requesterName}</td>
                          <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.workDate}</td>
                          <td className="px-4 py-4 text-sm font-medium text-axis-ink">
                            {request.requestedCheckInAt.slice(0, 5)} - {request.requestedCheckOutAt.slice(0, 5)}
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-axis-muted">{request.processedBy ?? "-"}</td>
                          <td className="max-w-[320px] px-4 py-4 text-sm font-medium text-axis-muted">
                            <span className="block truncate">{request.status === "REJECTED" ? request.rejectReason : request.reason}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    page={historyPage}
                    pageSize={HISTORY_PAGE_SIZE}
                    totalItems={totalHistoryItems}
                    onPageChange={setHistoryPage}
                  />
                </div>
              )}
            </div>
          )}
        </Panel>
      ) : null}

      <Modal
        open={requestOpen}
        title={canUpdateAttendance ? "근태 직접 수정" : "근태 수정 요청"}
        description={
          canUpdateAttendance
            ? "권한이 있는 사용자는 승인 요청 없이 근태 기록을 바로 수정합니다."
            : "수정할 날짜와 출퇴근 시간, 요청 사유를 입력합니다."
        }
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRequestOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!requestFormReady || createChangeRequest.isPending || updateAttendance.isPending}
              type="submit"
              form="attendance-change-request-form"
            >
              {canUpdateAttendance
                ? updateAttendance.isPending
                  ? "수정 중"
                  : "수정하기"
                : createChangeRequest.isPending
                  ? "요청 중"
                  : "요청하기"}
            </Button>
          </>
        }
        onClose={() => setRequestOpen(false)}
      >
        <form id="attendance-change-request-form" className="space-y-4" onSubmit={handleRequestSubmit}>
          <DateField
            label="날짜"
            value={requestForm.workDate}
            onChange={(workDate) => setRequestForm((current) => ({ ...current, workDate }))}
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TimeField
              label="출근 시간"
              value={requestForm.requestedCheckInAt}
              onChange={(requestedCheckInAt) => setRequestForm((current) => ({ ...current, requestedCheckInAt }))}
              required
            />
            <TimeField
              label="퇴근 시간"
              value={requestForm.requestedCheckOutAt}
              onChange={(requestedCheckOutAt) => setRequestForm((current) => ({ ...current, requestedCheckOutAt }))}
              required
            />
          </div>
          {canUpdateAttendance ? null : (
            <label className="block">
              <span className="text-sm font-semibold text-axis-ink">요청 사유</span>
              <textarea
                className="mt-2 min-h-32 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
                value={requestForm.reason}
                onChange={(event) => setRequestForm((current) => ({ ...current, reason: event.target.value }))}
                placeholder="근태 수정이 필요한 사유를 입력해 주세요."
                required
              />
            </label>
          )}
        </form>
      </Modal>

      <Modal
        open={detailRequest !== null}
        title="근태 수정 요청 상세"
        description="요청 사유와 수정 시간을 확인합니다."
        footer={
          <Button type="button" onClick={() => setDetailRequest(null)}>
            확인
          </Button>
        }
        onClose={() => setDetailRequest(null)}
      >
        {detailRequest ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="직원" value={detailRequest.requesterName} />
              <InfoItem label="수정 일자" value={detailRequest.workDate} />
              <InfoItem label="출근 시간" value={detailRequest.requestedCheckInAt.slice(0, 5)} />
              <InfoItem label="퇴근 시간" value={detailRequest.requestedCheckOutAt.slice(0, 5)} />
            </div>
            <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <p className="text-xs font-bold text-axis-muted">요청 사유</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-axis-ink">{detailRequest.reason}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={rejectOpen}
        title="근태 수정 요청 반려"
        description="선택한 요청을 반려하고 직원이 확인할 사유를 남깁니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
              취소
            </Button>
            <Button
              disabled={rejectReason.trim().length === 0 || rejectChangeRequests.isPending}
              type="submit"
              form="attendance-reject-form"
            >
              {rejectChangeRequests.isPending ? "반려 중" : "반려하기"}
            </Button>
          </>
        }
        onClose={() => setRejectOpen(false)}
      >
        <form id="attendance-reject-form" onSubmit={handleRejectSelected}>
          <label className="block">
            <span className="text-sm font-semibold text-axis-ink">반려 사유</span>
            <textarea
              className="mt-2 min-h-32 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="반려 사유를 입력해 주세요."
              required
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceChangeRequestStatus }) {
  const meta = {
    PENDING: { label: "대기", className: "bg-axis-bg text-axis-muted" },
    APPROVED: { label: "승인", className: "bg-emerald-50 text-emerald-700" },
    REJECTED: { label: "반려", className: "bg-rose-50 text-rose-700" }
  }[status];

  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", meta.className].join(" ")}>
      {meta.label}
    </span>
  );
}
