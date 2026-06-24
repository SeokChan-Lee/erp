import type { InputHTMLAttributes } from "react";

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function DateField({ label, className = "", ...props }: DateFieldProps) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <input className="axis-field mt-2" type="date" {...props} />
    </label>
  );
}
