import type { AttendanceRecord } from "../api/dto";
import { AttendanceCalendar } from "./AttendanceCalendar";
import { Panel } from "../../../shared/ui/Panel";

type MonthlyAttendancePanelProps = {
  visibleMonth: Date;
  records: AttendanceRecord[];
  loading: boolean;
  onMonthChange: (month: Date) => void;
};

export function MonthlyAttendancePanel({ visibleMonth, records, loading, onMonthChange }: MonthlyAttendancePanelProps) {
  return (
    <Panel title="월간 근태 캘린더" description="일자별 출근, 퇴근, 근태 상태를 캘린더로 확인합니다.">
      {loading ? (
        <p className="rounded-lg border border-axis-border bg-white px-4 py-5 text-sm font-semibold text-axis-muted">월간 근태 기록을 불러오는 중입니다.</p>
      ) : (
        <AttendanceCalendar monthDate={visibleMonth} records={records} onMonthChange={onMonthChange} />
      )}
    </Panel>
  );
}
