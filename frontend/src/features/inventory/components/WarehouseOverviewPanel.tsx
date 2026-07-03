import { Building2, Plus } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import type { InventoryStock, Warehouse } from "../api/dto";
import { WarehouseStat } from "./inventoryDisplay";

type WarehouseOverviewPanelProps = {
  warehouses: Warehouse[];
  stocks: InventoryStock[];
  canCreate: boolean;
  onCreateClick: () => void;
  onViewWarehouseStock: (warehouseId: number) => void;
};

export function WarehouseOverviewPanel({ warehouses, stocks, canCreate, onCreateClick, onViewWarehouseStock }: WarehouseOverviewPanelProps) {
  return (
    <Panel
      title="창고 현황"
      description="등록된 창고와 창고별 재고 구성을 확인합니다."
      action={
        canCreate ? (
          <Button className="gap-2" type="button" onClick={onCreateClick}>
            <Plus size={17} strokeWidth={2.2} />
            창고 등록
          </Button>
        ) : null
      }
    >
      {warehouses.length === 0 ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">등록된 창고가 없습니다.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {warehouses.map((warehouse) => {
            const warehouseStocks = stocks.filter((stock) => stock.warehouse.id === warehouse.id);
            const totalQuantity = warehouseStocks.reduce((sum, stock) => sum + stock.quantity, 0);
            const belowSafetyCount = warehouseStocks.filter((stock) => stock.belowSafetyStock).length;

            return (
              <div key={warehouse.id} className="rounded-lg border border-axis-border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                      <Building2 size={18} strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-axis-ink">{warehouse.name}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{warehouse.code}</p>
                    </div>
                  </div>
                  <Button className="h-8 px-3 text-xs" type="button" variant="secondary" onClick={() => onViewWarehouseStock(warehouse.id)}>
                    재고 보기
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <WarehouseStat label="품목" value={`${warehouseStocks.length.toLocaleString("ko-KR")}개`} />
                  <WarehouseStat label="총 재고" value={totalQuantity.toLocaleString("ko-KR")} />
                  <WarehouseStat label="확인 필요" value={`${belowSafetyCount.toLocaleString("ko-KR")}건`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
