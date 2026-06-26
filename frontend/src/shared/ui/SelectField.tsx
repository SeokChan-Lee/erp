import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownStyle, setDropdownStyle] = useState({
    left: 0,
    top: 0,
    width: 0,
    maxHeight: 240
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node) || dropdownRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const updateDropdownPosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const belowTop = rect.bottom + 4;
      const belowSpace = window.innerHeight - belowTop - 16;
      const aboveSpace = rect.top - 16;
      const maxHeight = Math.max(120, Math.min(240, belowSpace < 140 && aboveSpace > belowSpace ? aboveSpace : belowSpace));

      setDropdownStyle({
        left: rect.left,
        top: belowSpace < 140 && aboveSpace > belowSpace ? rect.top - maxHeight - 4 : belowTop,
        width: rect.width,
        maxHeight
      });
    };

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={["relative", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <button
        ref={buttonRef}
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
      {open
        ? createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[140] overflow-y-auto rounded-lg border border-axis-border bg-white p-1.5"
              style={{
                left: dropdownStyle.left,
                top: dropdownStyle.top,
                width: dropdownStyle.width,
                maxHeight: dropdownStyle.maxHeight
              }}
            >
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
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
