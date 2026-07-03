export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", active ? "bg-emerald-50 text-emerald-700" : "bg-axis-bg text-axis-muted"].join(" ")}>
      {active ? "사용" : "비활성"}
    </span>
  );
}

export function PurchaseStatusBadge({ status }: { status: string }) {
  const label = purchaseStatusLabel(status);
  const className =
    status === "ORDERED"
      ? "bg-violet-50 text-violet-700"
      : status === "APPROVED"
        ? "bg-emerald-50 text-emerald-700"
        : status === "CANCELED"
          ? "bg-axis-bg text-axis-muted"
          : "bg-blue-50 text-blue-700";

  return <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", className].join(" ")}>{label}</span>;
}

export function purchaseStatusLabel(status: string) {
  return status === "ORDERED" ? "발주" : status === "APPROVED" ? "승인" : status === "CANCELED" ? "반려" : "요청";
}

export function ReceiveStatusBadge({ received }: { received: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", received ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"].join(" ")}>
      {received ? "입고 완료" : "입고 대기"}
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
