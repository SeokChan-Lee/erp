import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type SelectValue = string | number;

export type SearchableSelectOption<T extends SelectValue> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SearchableSelectFieldProps<T extends SelectValue> = {
  label: string;
  value: T;
  options: Array<SearchableSelectOption<T>>;
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
};

export function SearchableSelectField<T extends SelectValue>({
  label,
  value,
  options,
  onChange,
  placeholder = "선택",
  searchPlaceholder = "검색어를 입력하세요",
  disabled = false,
  className = ""
}: SearchableSelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [options, search]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleSelect = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={rootRef} className={["relative block", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <span className="relative mt-2 block">
        <input
          aria-expanded={open}
          className="axis-field pr-10 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          placeholder={open ? searchPlaceholder : placeholder}
          type="text"
          value={open ? search : selectedOption?.label ?? ""}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const firstEnabledOption = filteredOptions.find((option) => !option.disabled);
              if (firstEnabledOption) {
                handleSelect(firstEnabledOption.value);
              }
            }
          }}
        />
        <button
          aria-label={open ? "목록 닫기" : "목록 열기"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-axis-ink transition hover:bg-axis-bg disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            setSearch("");
          }}
        >
          <ChevronDown className={open ? "rotate-180 transition" : "transition"} size={17} strokeWidth={2.2} />
        </button>
      </span>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto rounded-lg border border-axis-border bg-white p-1.5">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={String(option.value)}
                  className={[
                    "flex min-h-10 w-full items-center rounded-md px-3 py-2 text-left text-sm font-semibold text-axis-ink hover:bg-axis-bg",
                    selected ? "bg-axis-bg" : ""
                  ].join(" ")}
                  disabled={option.disabled}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-3 text-sm font-semibold text-axis-muted">{options.length === 0 ? "선택 가능한 항목이 없습니다." : "검색 결과가 없습니다."}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
