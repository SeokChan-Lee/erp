import { MetricCard } from "../../../shared/ui/MetricCard";
import type { InventoryOverview, Warehouse } from "../api/dto";

type InventorySummaryCardsProps = {
  overview?: InventoryOverview;
  activeItems: number;
  warehouses: Warehouse[];
};

export function InventorySummaryCards({ overview, activeItems, warehouses }: InventorySummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="전체 품목" value={`${overview?.totalItems ?? 0}개`} />
      <MetricCard label="사용 품목" value={`${overview?.activeItems ?? activeItems}개`} change="거래 가능" />
      <MetricCard label="안전재고 미달" value={`${overview?.belowSafetyStocks ?? 0}건`} change="확인 필요" />
      <MetricCard label="창고" value={`${overview?.warehouses ?? warehouses.length}개`} change="재고 위치" />
    </div>
  );
}
