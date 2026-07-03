import type { InventoryMovement, InventoryStock } from "../api/dto";

export function ItemStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold",
        active ? "bg-emerald-50 text-emerald-700" : "bg-axis-bg text-axis-muted"
      ].join(" ")}
    >
      {active ? "사용" : "비활성"}
    </span>
  );
}

export function StockBadge({ belowSafetyStock }: { belowSafetyStock: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold",
        belowSafetyStock ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      ].join(" ")}
    >
      {belowSafetyStock ? "안전재고 미달" : "정상"}
    </span>
  );
}

export function WarehouseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-axis-bg px-3 py-2">
      <p className="text-[11px] font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-axis-ink">{value}</p>
    </div>
  );
}

export function MovementQuantityBadge({ quantityDelta, unit }: { quantityDelta: number; unit: string }) {
  const positive = quantityDelta > 0;
  const text = formatSignedQuantity(quantityDelta, unit);
  return (
    <span
      className={[
        "inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold",
        positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      ].join(" ")}
    >
      {text}
    </span>
  );
}

export function MovementSourceInfo({
  sourceType,
  sourceLabel,
  sourceReferenceNo
}: {
  sourceType: InventoryMovement["sourceType"];
  sourceLabel: string;
  sourceReferenceNo: string;
}) {
  const tone =
    sourceType.startsWith("PURCHASE")
      ? "bg-blue-50 text-blue-700"
      : sourceType.startsWith("SALES")
        ? "bg-violet-50 text-violet-700"
        : "bg-axis-bg text-axis-muted";

  return (
    <div className="space-y-1">
      <span className={["inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-bold", tone].join(" ")}>
        {sourceLabel}
      </span>
      {sourceReferenceNo ? <p className="text-xs font-semibold text-axis-muted">{sourceReferenceNo}</p> : null}
    </div>
  );
}

export function findInventoryStock(stocks: InventoryStock[], itemId: number, warehouseId: number) {
  return stocks.find((stock) => stock.item.id === itemId && stock.warehouse.id === warehouseId);
}

export function formatMovementSource(sourceLabel: string, sourceReferenceNo: string) {
  return sourceReferenceNo ? `${sourceLabel} · ${sourceReferenceNo}` : sourceLabel;
}

export function formatSignedQuantity(quantity: number, unit: string) {
  return `${quantity > 0 ? "+" : ""}${quantity.toLocaleString("ko-KR")} ${unit}`;
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

export function formatProcessorName(value: string) {
  if (value === "admin") {
    return "시스템 관리자";
  }
  return value.trim() || "-";
}

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-white px-4 py-3">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}
