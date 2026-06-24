import { ChevronLeft, ChevronRight } from "lucide-react";

import type { AttendanceRecord } from "../api/dto";
import { attendanceStatusMeta } from "../config/attendanceMeta";

type AttendanceCalendarProps = {
  monthDate: Date;
  records: AttendanceRecord[];
  onMonthChange: (nextMonth: Date) => void;
};

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

export function AttendanceCalendar({ monthDate, records, onMonthChange }: AttendanceCalendarProps) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const recordByDate = new Map(records.map((record) => [record.workDate, record]));
  const cells = createCalendarCells(year, monthIndex);

  const moveMonth = (offset: number) => {
    onMonthChange(new Date(year, monthIndex + offset, 1));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-axis-border bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-axis-border bg-axis-bg px-4 py-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-base font-bold text-axis-ink">
            {year}년 {monthIndex + 1}월
          </h3>
          <p className="mt-1 text-sm font-medium text-axis-muted">월간 출퇴근 기록을 일자별로 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="이전 달"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-axis-border bg-white text-axis-ink transition hover:border-axis-ink"
            type="button"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={17} strokeWidth={2.3} />
          </button>
          <button
            aria-label="다음 달"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-axis-border bg-white text-axis-ink transition hover:border-axis-ink"
            type="button"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={17} strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-axis-border bg-white">
        {weekDays.map((day) => (
          <div key={day} className="px-2 py-3 text-center text-xs font-bold text-axis-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-axis-border">
        {cells.map((cell) => {
          const dateKey = formatDateKey(cell.date);
          const record = recordByDate.get(dateKey);
          const meta = record ? attendanceStatusMeta[record.status] : null;
          const today = dateKey === formatDateKey(new Date());

          return (
            <div
              key={dateKey}
              className={[
                "min-h-[118px] bg-white p-2",
                cell.currentMonth ? "" : "bg-axis-bg text-axis-muted",
                today ? "ring-2 ring-inset ring-axis-ink" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cell.currentMonth ? "text-sm font-bold text-axis-ink" : "text-sm font-bold text-axis-muted"}>
                  {cell.date.getDate()}
                </span>
                {meta ? <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} /> : null}
              </div>

              {record && meta ? (
                <div className="mt-3 space-y-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${meta.className}`}>
                    {meta.label}
                  </span>
                  <p className="text-xs font-semibold leading-5 text-axis-muted">
                    출근 {formatTime(record.checkInAt)}
                    <br />
                    퇴근 {formatTime(record.checkOutAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium leading-5 text-axis-muted">
                  {cell.currentMonth ? "기록 없음" : ""}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function createCalendarCells(year: number, monthIndex: number) {
  const firstDate = new Date(year, monthIndex, 1);
  const startDate = new Date(year, monthIndex, 1 - firstDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      currentMonth: date.getMonth() === monthIndex
    };
  });
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
