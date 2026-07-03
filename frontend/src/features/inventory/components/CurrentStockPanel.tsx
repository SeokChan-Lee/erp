import { PackagePlus, Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { InventoryStock } from "../api/dto";
import { StockBadge } from "./inventoryDisplay";

type SelectOption = {
  value: number;
  label: string;
};

type CurrentStockPanelProps = {
  stocks: InventoryStock[];
  loading: boolean;
  searchInput: string;
  warehouseId: number;
  warehouseOptions: SelectOption[];
  canAdjust: boolean;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onWarehouseChange: (warehouseId: number) => void;
  onResetFilters: () => void;
  onOpenAdjustment: (stock?: InventoryStock) => void;
};

export function CurrentStockPanel({
  stocks,
  loading,
  searchInput,
  warehouseId,
  warehouseOptions,
  canAdjust,
  onSearchInputChange,
  onApplySearch,
  onWarehouseChange,
  onResetFilters,
  onOpenAdjustment
}: CurrentStockPanelProps) {
  return (
    <Panel title="현재 재고" description="창고별 품목 수량과 안전재고 미달 여부를 확인합니다.">
      <div className={["mb-4 grid items-end gap-3", canAdjust ? "md:grid-cols-[1fr_220px_auto_auto]" : "md:grid-cols-[1fr_220px_auto]"].join(" ")}>
        <TextField
          label="검색"
          placeholder="품목, 분류, 창고"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <SelectField label="창고" value={warehouseId} options={warehouseOptions} onChange={onWarehouseChange} />
        <ResetButton onClick={onResetFilters} />
        {canAdjust ? (
          <Button className="h-11 gap-2" type="button" onClick={() => onOpenAdjustment()}>
            <PackagePlus size={17} strokeWidth={2.2} />
            재고 조정
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">현재 재고를 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3">품목</th>
                <th className="px-4 py-3">창고</th>
                <th className="px-4 py-3">현재고</th>
                <th className="px-4 py-3">안전재고</th>
                <th className="px-4 py-3">상태</th>
                {canAdjust ? <th className="px-4 py-3">관리</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {stocks.map((stock) => (
                <tr key={stock.id}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{stock.item.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{stock.item.sku}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{stock.warehouse.name}</td>
                  <td className="px-4 py-4 text-sm font-bold text-axis-ink">{stock.quantity.toLocaleString("ko-KR")} {stock.item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{stock.safetyStock.toLocaleString("ko-KR")} {stock.item.unit}</td>
                  <td className="px-4 py-4"><StockBadge belowSafetyStock={stock.belowSafetyStock} /></td>
                  {canAdjust ? (
                    <td className="px-4 py-4">
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onOpenAdjustment(stock)}>
                        <PackagePlus size={14} strokeWidth={2.2} />
                        조정
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {stocks.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={canAdjust ? 6 : 5}>조건에 맞는 재고가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableFrame>
      )}
    </Panel>
  );
}
