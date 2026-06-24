import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

export function DateField({ label, value, onChange, className = "", disabled = false, required = false }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value) ?? new Date());
  const [popoverStyle, setPopoverStyle] = useState({ left: 0, top: 0, width: 320 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = parseDateValue(value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const syncPosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(320, window.innerWidth - 16);
      const height = 360;
      const left = Math.min(Math.max(rect.right - width, 8), window.innerWidth - width - 8);
      const bottomTop = rect.bottom + 4;
      const top = bottomTop + height > window.innerHeight - 8
        ? Math.max(8, rect.top - height - 4)
        : bottomTop;

      setPopoverStyle({ left, top, width });
    };

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [value]);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const monthLabel = `${visibleMonth.getFullYear()}년 ${visibleMonth.getMonth() + 1}월`;

  const moveMonth = (offset: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const selectDate = (date: Date) => {
    onChange(formatDateValue(date));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <button
        aria-expanded={open}
        aria-required={required}
        className="axis-field mt-2 flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedDate ? formatDateLabel(selectedDate) : "날짜 선택"}</span>
        <CalendarDays className="shrink-0 text-axis-ink" size={18} strokeWidth={2.2} />
      </button>

      {open ? createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[220] rounded-lg border border-axis-border bg-white p-3 shadow-[0_16px_36px_rgba(0,0,0,0.14)]"
          style={{ left: popoverStyle.left, top: popoverStyle.top, width: popoverStyle.width }}
        >
          <div className="flex items-center justify-between">
            <button
              aria-label="이전 달"
              className="flex h-8 w-8 items-center justify-center rounded-md text-axis-muted hover:bg-axis-bg hover:text-axis-ink"
              type="button"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={17} strokeWidth={2.2} />
            </button>
            <p className="text-sm font-bold text-axis-ink">{monthLabel}</p>
            <button
              aria-label="다음 달"
              className="flex h-8 w-8 items-center justify-center rounded-md text-axis-muted hover:bg-axis-bg hover:text-axis-ink"
              type="button"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={17} strokeWidth={2.2} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {weekdays.map((weekday, index) => (
              <span
                key={weekday}
                className={[
                  "py-1 text-xs font-bold",
                  index === 0 ? "text-rose-600" : index === 6 ? "text-blue-600" : "text-axis-muted"
                ].join(" ")}
              >
                {weekday}
              </span>
            ))}
            {calendarDays.map((day) => {
              const selected = selectedDate ? isSameDate(day.date, selectedDate) : false;
              const muted = day.date.getMonth() !== visibleMonth.getMonth();
              const sunday = day.date.getDay() === 0;
              const saturday = day.date.getDay() === 6;

              return (
                <button
                  key={day.key}
                  className={[
                    "flex h-9 items-center justify-center rounded-md text-sm font-bold transition",
                    selected
                      ? "bg-axis-ink text-white"
                      : muted
                        ? "text-axis-muted/50 hover:bg-axis-bg"
                        : sunday
                          ? "text-rose-600 hover:bg-rose-50"
                          : saturday
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-axis-ink hover:bg-axis-bg"
                  ].join(" ")}
                  type="button"
                  onClick={() => selectDate(day.date)}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function buildCalendarDays(monthDate: Date) {
  const firstDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      key: formatDateValue(date),
      date
    };
  });
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
