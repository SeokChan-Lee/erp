import { useAttendanceMutation, useTodayAttendanceQuery } from "./api/attendanceApi";
import type { AttendanceStatus } from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { Panel } from "../../shared/ui/Panel";

const statusLabels: Record<AttendanceStatus, string> = {
  NOT_CHECKED_IN: "출근 전",
  WORKING: "근무 중",
  NORMAL: "정상",
  LATE: "지각",
  EARLY_LEAVE: "조퇴",
  ABSENT: "결근"
};

export function AttendanceView() {
  const { data: today, error } = useTodayAttendanceQuery();
  const checkInMutation = useAttendanceMutation("check-in");
  const checkOutMutation = useAttendanceMutation("check-out");
  const loading = checkInMutation.isPending || checkOutMutation.isPending;

  const status = today ? statusLabels[today.status] : "확인 중";

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

      {error || checkInMutation.error || checkOutMutation.error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error || checkInMutation.error || checkOutMutation.error)}
        </p>
      ) : null}

      <Panel title="최근 근태 기록" description="월별 근태 API가 추가되면 최근 기록과 관리자 수정 이력을 함께 표시합니다.">
        <div className="overflow-hidden rounded-lg border border-axis-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-axis-bg text-xs text-axis-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">일자</th>
                <th className="px-4 py-3 font-semibold">출근</th>
                <th className="px-4 py-3 font-semibold">퇴근</th>
                <th className="px-4 py-3 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {today ? (
                <tr>
                  <td className="px-4 py-4 font-medium text-axis-ink">{today.workDate}</td>
                  <td className="px-4 py-4 text-axis-muted">{formatTime(today.checkInAt)}</td>
                  <td className="px-4 py-4 text-axis-muted">{formatTime(today.checkOutAt)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-axis-bg px-3 py-1 text-xs font-semibold text-axis-ink">
                      {statusLabels[today.status]}
                    </span>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td className="px-4 py-5 text-axis-muted" colSpan={4}>
                    근태 기록을 불러오는 중입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
