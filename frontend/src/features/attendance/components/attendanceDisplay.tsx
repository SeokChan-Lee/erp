import type { AttendanceChangeRequestStatus } from "../api/dto";

export function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeTimeInputValue(value?: string) {
  return value ? value.slice(0, 5) : "";
}

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: AttendanceChangeRequestStatus }) {
  const meta = {
    PENDING: { label: "대기", className: "bg-axis-bg text-axis-muted" },
    APPROVED: { label: "승인", className: "bg-emerald-50 text-emerald-700" },
    REJECTED: { label: "반려", className: "bg-rose-50 text-rose-700" }
  }[status];

  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", meta.className].join(" ")}>
      {meta.label}
    </span>
  );
}
