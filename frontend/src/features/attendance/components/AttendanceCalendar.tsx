import { ChevronLeft, ChevronRight } from "lucide-react";

import type { AttendanceRecord } from "../api/dto";
import { attendanceStatusMeta } from "../config/attendanceMeta";
import { SelectField } from "../../../shared/ui/SelectField";

type AttendanceCalendarProps = {
  monthDate: Date;
  records: AttendanceRecord[];
  onMonthChange: (nextMonth: Date) => void;
};

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
const monthOptions = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: `${index + 1}월` }));

export function AttendanceCalendar({ monthDate, records, onMonthChange }: AttendanceCalendarProps) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const recordByDate = new Map(records.map((record) => [record.workDate, record]));
  const cells = createCalendarCells(year, monthIndex);
  const yearOptions = Array.from({ length: 9 }, (_, index) => {
    const optionYear = new Date().getFullYear() - 4 + index;
    return { value: optionYear, label: `${optionYear}년` };
  });

  const moveMonth = (offset: number) => {
    onMonthChange(new Date(year, monthIndex + offset, 1));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-axis-border-strong bg-white">
      <div className="flex flex-col justify-between gap-4 border-b border-axis-border bg-white px-4 py-4 xl:flex-row xl:items-end">
        <div>
          <h3 className="text-lg font-bold text-axis-ink">
            {year}년 {monthIndex + 1}월
          </h3>
          <p className="mt-1 text-sm font-medium text-axis-muted">월간 출퇴근 기록을 일자별로 확인합니다.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[130px_110px_auto_auto]">
          <SelectField
            label="연도"
            value={year}
            options={yearOptions}
            onChange={(nextYear) => onMonthChange(new Date(nextYear, monthIndex, 1))}
          />
          <SelectField
            label="월"
            value={monthIndex + 1}
            options={monthOptions}
            onChange={(nextMonth) => onMonthChange(new Date(year, nextMonth - 1, 1))}
          />
          <button
            aria-label="이전 달"
            className="mt-7 flex h-11 w-11 items-center justify-center rounded-lg border border-axis-border bg-white text-axis-ink transition hover:border-axis-ink"
            type="button"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft size={17} strokeWidth={2.3} />
          </button>
          <button
            aria-label="다음 달"
            className="mt-7 flex h-11 w-11 items-center justify-center rounded-lg border border-axis-border bg-white text-axis-ink transition hover:border-axis-ink"
            type="button"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight size={17} strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-axis-border bg-axis-bg">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={[
              "px-2 py-3 text-center text-xs font-bold",
              index === 0 ? "text-rose-600" : index === 6 ? "text-blue-600" : "text-axis-muted"
            ].join(" ")}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-axis-border">
        {cells.map((cell) => {
          const dateKey = formatDateKey(cell.date);
          const record = recordByDate.get(dateKey);
          const meta = record ? attendanceStatusMeta[record.status] : null;
          const today = dateKey === formatDateKey(new Date());
          const day = cell.date.getDay();
          const weekendClass = day === 0 ? "bg-rose-50/60" : day === 6 ? "bg-blue-50/60" : "bg-white";
          const dateTextClass = day === 0 ? "text-rose-600" : day === 6 ? "text-blue-600" : "text-axis-ink";

          return (
            <div
              key={dateKey}
              className={[
                "min-h-[132px] p-3 transition",
                cell.currentMonth ? weekendClass : "bg-axis-bg text-axis-muted",
                today ? "ring-2 ring-inset ring-axis-ink" : ""
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cell.currentMonth ? `text-sm font-bold ${dateTextClass}` : "text-sm font-bold text-axis-muted"}>
                  {cell.date.getDate()}
                </span>
                {meta ? <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} /> : null}
              </div>

              {record && meta ? (
                <div className="mt-3 space-y-2 rounded-lg bg-white/80 p-2 shadow-sm">
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
