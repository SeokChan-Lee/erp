import { Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { DateField } from "../../../shared/ui/DateField";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { InventoryMovement } from "../api/dto";
import { formatDateTime, formatProcessorName, MovementQuantityBadge, MovementSourceInfo } from "./inventoryDisplay";

type SelectOption = {
  value: number;
  label: string;
};

type InventoryMovementListPanelProps = {
  movements: InventoryMovement[];
  totalMovements: number;
  page: number;
  pageSize: number;
  loading: boolean;
  searchInput: string;
  startDate: string;
  endDate: string;
  warehouseId: number;
  warehouseOptions: SelectOption[];
  filterLabels: string[];
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onWarehouseChange: (warehouseId: number) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectMovement: (movement: InventoryMovement) => void;
};

export function InventoryMovementListPanel({
  movements,
  totalMovements,
  page,
  pageSize,
  loading,
  searchInput,
  startDate,
  endDate,
  warehouseId,
  warehouseOptions,
  filterLabels,
  onSearchInputChange,
  onApplySearch,
  onStartDateChange,
  onEndDateChange,
  onWarehouseChange,
  onResetFilters,
  onPageChange,
  onSelectMovement
}: InventoryMovementListPanelProps) {
  return (
    <Panel title="재고 이동 이력" description="구매 입고, 판매 출고, 수동 조정으로 발생한 재고 수량 변경 내역을 확인합니다.">
      <div className="mb-4 grid items-end gap-3 xl:grid-cols-[1fr_190px_190px_190px_auto_auto]">
        <TextField
          label="검색"
          placeholder="품목, 창고, 사유, 처리자"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>
          검색 적용
        </Button>
        <DateField label="시작일" value={startDate} onChange={onStartDateChange} />
        <DateField label="종료일" value={endDate} onChange={onEndDateChange} />
        <SelectField label="창고" value={warehouseId} options={warehouseOptions} onChange={onWarehouseChange} />
        <ResetButton onClick={onResetFilters} />
      </div>

      <div className="mb-4 min-h-8">
        {filterLabels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filterLabels.map((label) => (
              <span key={label} className="inline-flex h-8 items-center rounded-full border border-axis-border bg-axis-bg px-3 text-xs font-bold text-axis-ink">
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs font-semibold text-axis-muted">필터가 적용되지 않았습니다.</p>
        )}
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">재고 이동 이력을 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[1280px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="w-[150px] whitespace-nowrap px-4 py-3">처리 일시</th>
                <th className="px-4 py-3">품목</th>
                <th className="w-[120px] whitespace-nowrap px-4 py-3">창고</th>
                <th className="w-[110px] whitespace-nowrap px-4 py-3">이동 수량</th>
                <th className="w-[220px] whitespace-nowrap px-4 py-3">출처</th>
                <th className="w-[120px] whitespace-nowrap px-4 py-3">처리자</th>
                <th className="px-4 py-3">사유</th>
                <th className="w-[90px] whitespace-nowrap px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-muted">{formatDateTime(movement.processedAt)}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{movement.item.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{movement.item.sku}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-muted">{movement.warehouse.name}</td>
                  <td className="px-4 py-4"><MovementQuantityBadge quantityDelta={movement.quantityDelta} unit={movement.item.unit} /></td>
                  <td className="px-4 py-4">
                    <MovementSourceInfo sourceType={movement.sourceType} sourceLabel={movement.sourceLabel} sourceReferenceNo={movement.sourceReferenceNo} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-ink">{formatProcessorName(movement.processedBy)}</td>
                  <td className="max-w-[320px] px-4 py-4 text-sm font-medium text-axis-muted">
                    <span className="block truncate" title={movement.reason}>{movement.reason}</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button className="h-8 px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectMovement(movement)}>
                      상세
                    </Button>
                  </td>
                </tr>
              ))}
              {movements.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={8}>조건에 맞는 이동 이력이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalMovements} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
