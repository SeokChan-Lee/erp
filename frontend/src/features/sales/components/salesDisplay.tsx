export function SalesStatusBadge({ status }: { status: string }) {
  const canceled = status === "CANCELED";
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", canceled ? "bg-axis-bg text-axis-muted" : "bg-emerald-50 text-emerald-700"].join(" ")}>
      {canceled ? "취소" : "등록"}
    </span>
  );
}

export function ShipStatusBadge({ shipped }: { shipped: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", shipped ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"].join(" ")}>
      {shipped ? "출고 완료" : "출고 대기"}
    </span>
  );
}

export function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border px-4 py-3">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-axis-ink">{value}</p>
    </div>
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
