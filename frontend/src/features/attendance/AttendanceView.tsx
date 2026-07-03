import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  useApproveAttendanceChangeRequestsMutation,
  useAttendanceChangeRequestHistoryQuery,
  useAttendanceMutation,
  useAttendanceSettingsQuery,
  useCreateAttendanceChangeRequestMutation,
  useMonthlyAttendanceQuery,
  usePendingAttendanceChangeRequestsQuery,
  useRejectAttendanceChangeRequestsMutation,
  useTodayAttendanceQuery,
  useUpdateAttendanceSettingsMutation,
  useUpdateAttendanceMutation
} from "./api/attendanceApi";
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestHistoryParams,
  AttendanceSettings,
  AttendanceChangeRequestStatus
} from "./api/dto";
import { AttendanceRequestHistoryPanel } from "./components/AttendanceRequestHistoryPanel";
import { AttendanceSettingsPanel } from "./components/AttendanceSettingsPanel";
import { formatDateInputValue, InfoItem, normalizeTimeInputValue } from "./components/attendanceDisplay";
import { MonthlyAttendancePanel } from "./components/MonthlyAttendancePanel";
import { PendingAttendanceRequestsPanel } from "./components/PendingAttendanceRequestsPanel";
import { TodayAttendancePanel } from "./components/TodayAttendancePanel";
import { attendanceStatusMeta } from "./config/attendanceMeta";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { Modal } from "../../shared/ui/Modal";
import { TimeField } from "../../shared/ui/TimeField";

const HISTORY_PAGE_SIZE = 20;

const initialRequestForm = {
  workDate: formatDateInputValue(new Date()),
  requestedCheckInAt: "09:00",
  requestedCheckOutAt: "18:00",
  reason: ""
};

function defaultRequestFormFromSettings(settings?: AttendanceSettings) {
  return {
    workDate: formatDateInputValue(new Date()),
    requestedCheckInAt: normalizeTimeInputValue(settings?.standardCheckInAt) || initialRequestForm.requestedCheckInAt,
    requestedCheckOutAt: normalizeTimeInputValue(settings?.standardCheckOutAt) || initialRequestForm.requestedCheckOutAt,
    reason: ""
  };
}

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
  const [settingsForm, setSettingsForm] = useState({
    standardCheckInAt: "",
    standardCheckOutAt: "",
    lateAfterAt: ""
  });
  const canApproveAttendance = permissions.includes("ATTENDANCE_APPROVE");
  const canUpdateAttendance = permissions.includes("ATTENDANCE_UPDATE");
  const canUpdateAttendanceSettings = permissions.includes("ATTENDANCE_SETTINGS_UPDATE");
  const { data: today, error } = useTodayAttendanceQuery();
  const { data: attendanceSettings, error: settingsError } = useAttendanceSettingsQuery();
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
  const updateAttendanceSettings = useUpdateAttendanceSettingsMutation();
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
  const settingsFormReady =
    settingsForm.standardCheckInAt.length > 0 &&
    settingsForm.standardCheckOutAt.length > 0 &&
    settingsForm.lateAfterAt.length > 0 &&
    settingsForm.standardCheckOutAt > settingsForm.standardCheckInAt &&
    settingsForm.lateAfterAt >= settingsForm.standardCheckInAt &&
    settingsForm.lateAfterAt < settingsForm.standardCheckOutAt;
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

  useEffect(() => {
    if (!attendanceSettings) return;

    const nextSettingsForm = {
      standardCheckInAt: normalizeTimeInputValue(attendanceSettings.standardCheckInAt),
      standardCheckOutAt: normalizeTimeInputValue(attendanceSettings.standardCheckOutAt),
      lateAfterAt: normalizeTimeInputValue(attendanceSettings.lateAfterAt)
    };
    setSettingsForm(nextSettingsForm);
    if (!requestOpen) {
      setRequestForm((current) => ({
        ...current,
        requestedCheckInAt: nextSettingsForm.standardCheckInAt,
        requestedCheckOutAt: nextSettingsForm.standardCheckOutAt
      }));
    }
  }, [attendanceSettings, requestOpen]);

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
            setRequestForm(defaultRequestFormFromSettings(attendanceSettings));
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
          setRequestForm(defaultRequestFormFromSettings(attendanceSettings));
        }
      }
    );
  };

  const handleSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settingsFormReady) return;

    updateAttendanceSettings.mutate(settingsForm);
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

  const resetHistoryFilters = () => {
    setHistorySearchInput("");
    setHistorySearch("");
    setHistoryStatusFilter("ALL");
    setHistoryStartDate("");
    setHistoryEndDate("");
    setHistoryPage(1);
  };

  return (
    <div className="space-y-6">
      <TodayAttendancePanel
        today={today}
        status={status}
        settings={attendanceSettings}
        checkInDisabled={checkInDisabled}
        checkOutDisabled={checkOutDisabled}
        canUpdateAttendance={canUpdateAttendance}
        onCheckIn={() => checkInMutation.mutate()}
        onCheckOut={() => checkOutMutation.mutate()}
        onOpenRequest={() => setRequestOpen(true)}
      />

      {error ||
      monthlyError ||
      settingsError ||
      pendingRequestsError ||
      requestHistoryError ||
      checkInMutation.error ||
      checkOutMutation.error ||
      createChangeRequest.error ||
      updateAttendance.error ||
      updateAttendanceSettings.error ||
      rejectChangeRequests.error ||
      approveChangeRequests.error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(
            error ||
              monthlyError ||
              settingsError ||
              pendingRequestsError ||
              requestHistoryError ||
              checkInMutation.error ||
              checkOutMutation.error ||
              createChangeRequest.error ||
              updateAttendance.error ||
              updateAttendanceSettings.error ||
              rejectChangeRequests.error ||
              approveChangeRequests.error
          )}
        </p>
      ) : null}

      {canUpdateAttendanceSettings ? (
        <AttendanceSettingsPanel
          form={settingsForm}
          setForm={setSettingsForm}
          formReady={settingsFormReady}
          updatePending={updateAttendanceSettings.isPending}
          onSubmit={handleSettingsSubmit}
        />
      ) : null}

      <MonthlyAttendancePanel visibleMonth={visibleMonth} records={monthlyRecords} loading={monthlyLoading} onMonthChange={setVisibleMonth} />

      {canApproveAttendance ? (
        <PendingAttendanceRequestsPanel
          requests={pendingRequests}
          selectedIds={selectedRequestIds}
          selectedSet={selectedRequestSet}
          allSelected={allSelected}
          loading={pendingRequestsLoading}
          approvePending={approveChangeRequests.isPending}
          rejectPending={rejectChangeRequests.isPending}
          onToggleAll={toggleAllRequests}
          onToggleRequest={toggleRequest}
          onDetail={setDetailRequest}
          onOpenReject={() => setRejectOpen(true)}
          onApproveSelected={handleApproveSelected}
        />
      ) : null}

      {canApproveAttendance ? (
        <AttendanceRequestHistoryPanel
          requests={requestHistory}
          totalItems={totalHistoryItems}
          page={historyPage}
          pageSize={HISTORY_PAGE_SIZE}
          loading={requestHistoryLoading}
          searchInput={historySearchInput}
          statusFilter={historyStatusFilter}
          statusOptions={historyStatusOptions}
          startDate={historyStartDate}
          endDate={historyEndDate}
          onSearchInputChange={setHistorySearchInput}
          onApplySearch={() => {
            setHistorySearch(historySearchInput.trim());
            setHistoryPage(1);
          }}
          onStatusChange={(status) => {
            setHistoryStatusFilter(status);
            setHistoryPage(1);
          }}
          onStartDateChange={(startDate) => {
            setHistoryStartDate(startDate);
            setHistoryPage(1);
          }}
          onEndDateChange={(endDate) => {
            setHistoryEndDate(endDate);
            setHistoryPage(1);
          }}
          onResetFilters={resetHistoryFilters}
          onPageChange={setHistoryPage}
        />
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
