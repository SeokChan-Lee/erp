import { useState } from "react";

import { useAttendanceMutation, useMonthlyAttendanceQuery, useTodayAttendanceQuery } from "./api/attendanceApi";
import { AttendanceCalendar } from "./components/AttendanceCalendar";
import { attendanceStatusMeta } from "./config/attendanceMeta";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { Panel } from "../../shared/ui/Panel";

export function AttendanceView() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const { data: today, error } = useTodayAttendanceQuery();
  const {
    data: monthlyRecords = [],
    error: monthlyError,
    isLoading: monthlyLoading
  } = useMonthlyAttendanceQuery(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1);
  const checkInMutation = useAttendanceMutation("check-in");
  const checkOutMutation = useAttendanceMutation("check-out");
  const loading = checkInMutation.isPending || checkOutMutation.isPending;

  const status = today ? attendanceStatusMeta[today.status].label : "확인 중";

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
            <Button disabled={loading} onClick={() => checkInMutation.mutate()}>
              출근하기
            </Button>
            <Button disabled={loading} variant="secondary" onClick={() => checkOutMutation.mutate()}>
              퇴근하기
            </Button>
          </div>
        </div>
      </Panel>

      {error || monthlyError || checkInMutation.error || checkOutMutation.error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error || monthlyError || checkInMutation.error || checkOutMutation.error)}
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
