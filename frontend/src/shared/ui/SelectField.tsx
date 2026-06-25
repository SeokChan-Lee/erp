import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type SelectValue = string | number;

export type SelectOption<T extends SelectValue> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps<T extends SelectValue> = {
  label: string;
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SelectField<T extends SelectValue>({
  label,
  value,
  options,
  onChange,
  placeholder = "선택",
  disabled = false,
  className = ""
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <button
        aria-expanded={open}
        className="axis-field mt-2 flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown
          className={open ? "shrink-0 rotate-180 text-axis-ink transition" : "shrink-0 text-axis-ink transition"}
          size={17}
          strokeWidth={2.2}
        />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-lg border border-axis-border bg-white p-1.5">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={String(option.value)}
                className={[
                  "flex h-10 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-axis-ink hover:bg-axis-bg",
                  selected ? "bg-axis-bg" : ""
                ].join(" ")}
                disabled={option.disabled}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
