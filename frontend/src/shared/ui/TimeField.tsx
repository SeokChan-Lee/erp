import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3 } from "lucide-react";

type TimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
};

const hours = Array.from({ length: 24 }, (_, index) => `${index}`.padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, index) => `${index * 5}`.padStart(2, "0"));

export function TimeField({ label, value, onChange, className = "", disabled = false, required = false }: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({ left: 0, top: 0, width: 280 });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [selectedHour, selectedMinute] = parseTimeValue(value);

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

      const width = Math.min(280, window.innerWidth - 16);
      const height = 250;
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

  const selectHour = (hour: string) => {
    onChange(`${hour}:${selectedMinute}`);
  };

  const selectMinute = (minute: string) => {
    onChange(`${selectedHour}:${minute}`);
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
        <span>{value || "시간 선택"}</span>
        <Clock3 className="shrink-0 text-axis-ink" size={18} strokeWidth={2.2} />
      </button>

      {open ? createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[220] rounded-lg border border-axis-border bg-white p-3 shadow-[0_16px_36px_rgba(0,0,0,0.14)]"
          style={{ left: popoverStyle.left, top: popoverStyle.top, width: popoverStyle.width }}
        >
          <div className="grid grid-cols-2 gap-3">
            <TimeColumn label="시" options={hours} value={selectedHour} onSelect={selectHour} />
            <TimeColumn label="분" options={minutes} value={selectedMinute} onSelect={selectMinute} />
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}

function TimeColumn({
  label,
  options,
  value,
  onSelect
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="px-1 pb-2 text-xs font-bold text-axis-muted">{label}</p>
      <div className="grid max-h-48 grid-cols-2 gap-1 overflow-y-auto pr-1">
        {options.map((option) => {
          const selected = option === value;

          return (
            <button
              key={option}
              aria-label={`${option}${label}`}
              className={[
                "h-9 rounded-md text-sm font-bold transition",
                selected ? "bg-axis-ink text-white" : "text-axis-ink hover:bg-axis-bg"
              ].join(" ")}
              type="button"
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return ["09", "00"];
  return [match[1], match[2]];
}
