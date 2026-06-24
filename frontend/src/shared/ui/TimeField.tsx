import type { InputHTMLAttributes } from "react";

type TimeFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function TimeField({ label, className = "", ...props }: TimeFieldProps) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <input className="axis-field mt-2" type="time" {...props} />
    </label>
  );
}
