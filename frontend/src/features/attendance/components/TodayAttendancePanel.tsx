import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import type { AttendanceRecord, AttendanceSettings } from "../api/dto";
import { formatTime, normalizeTimeInputValue } from "./attendanceDisplay";

type TodayAttendancePanelProps = {
  today?: AttendanceRecord;
  status: string;
  settings?: AttendanceSettings;
  checkInDisabled: boolean;
  checkOutDisabled: boolean;
  canUpdateAttendance: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onOpenRequest: () => void;
};

export function TodayAttendancePanel({
  today,
  status,
  settings,
  checkInDisabled,
  checkOutDisabled,
  canUpdateAttendance,
  onCheckIn,
  onCheckOut,
  onOpenRequest
}: TodayAttendancePanelProps) {
  return (
    <Panel title="오늘 근태" description="현재 로그인한 사용자의 출퇴근 기록을 처리합니다.">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-axis-muted">현재 상태</p>
          <p className="mt-2 text-3xl font-semibold text-axis-ink">{status}</p>
          <p className="mt-2 text-sm text-axis-muted">출근 {formatTime(today?.checkInAt)} / 퇴근 {formatTime(today?.checkOutAt)}</p>
          {settings ? (
            <p className="mt-2 text-xs font-semibold text-axis-muted">
              기준 {normalizeTimeInputValue(settings.standardCheckInAt)} - {normalizeTimeInputValue(settings.standardCheckOutAt)} · 지각 기준 {normalizeTimeInputValue(settings.lateAfterAt)}
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Button disabled={checkInDisabled} onClick={onCheckIn}>출근하기</Button>
          <Button disabled={checkOutDisabled} variant="secondary" onClick={onCheckOut}>퇴근하기</Button>
          <Button type="button" variant="secondary" onClick={onOpenRequest}>{canUpdateAttendance ? "근태 수정" : "근태 수정 요청"}</Button>
        </div>
      </div>
    </Panel>
  );
}
