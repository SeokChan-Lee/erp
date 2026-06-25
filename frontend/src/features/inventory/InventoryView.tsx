import { FormEvent, useMemo, useState } from "react";
import { PackagePlus, PencilLine, Plus, Search, Warehouse } from "lucide-react";

import {
  useAdjustInventoryMutation,
  useCreateItemMutation,
  useInventoryOverviewQuery,
  useInventoryStocksQuery,
  useItemsQuery,
  useUpdateItemMutation,
  useWarehousesQuery
} from "./api/inventoryApi";
import type {
  InventoryAdjustmentPayload,
  Item,
  ItemCreatePayload,
  ItemQueryParams,
  ItemStatusFilter,
  ItemUpdatePayload
} from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { MetricCard } from "../../shared/ui/MetricCard";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";

const PAGE_SIZE = 20;

const initialItemForm: ItemCreatePayload = {
  sku: "",
  name: "",
  category: "",
  unit: "개",
  safetyStock: 0
};

const initialAdjustmentForm: InventoryAdjustmentPayload = {
  itemId: 0,
  warehouseId: 0,
  quantityDelta: 1,
  reason: ""
};

type ItemEditForm = ItemUpdatePayload & {
  id: number;
};

export function InventoryView({ permissions = [] }: { permissions?: string[] }) {
  const [itemPage, setItemPage] = useState(1);
  const [itemSearchInput, setItemSearchInput] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemStatus, setItemStatus] = useState<ItemStatusFilter>("ALL");
  const [stockSearchInput, setStockSearchInput] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockWarehouseId, setStockWarehouseId] = useState(0);
  const [itemForm, setItemForm] = useState<ItemCreatePayload>(initialItemForm);
  const [editForm, setEditForm] = useState<ItemEditForm | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustmentPayload>(initialAdjustmentForm);
  const canCreateItem = permissions.includes("ITEM_CREATE");
  const canUpdateItem = permissions.includes("ITEM_UPDATE");
  const canAdjustInventory = permissions.includes("INVENTORY_ADJUST");

  const itemParams = useMemo<ItemQueryParams>(
    () => ({
      page: itemPage,
      pageSize: PAGE_SIZE,
      search: itemSearch,
      status: itemStatus
    }),
    [itemPage, itemSearch, itemStatus]
  );
  const stockParams = useMemo(
    () => ({
      search: stockSearch,
      warehouseId: stockWarehouseId
    }),
    [stockSearch, stockWarehouseId]
  );

  const { data: overview, error: overviewError } = useInventoryOverviewQuery();
  const { data: warehouses = [], error: warehouseError } = useWarehousesQuery();
  const { data: itemsPage, error: itemsError, isLoading: itemsLoading } = useItemsQuery(itemParams);
  const { data: stocks = [], error: stocksError, isLoading: stocksLoading } = useInventoryStocksQuery(stockParams);
  const createItem = useCreateItemMutation();
  const updateItem = useUpdateItemMutation();
  const adjustInventory = useAdjustInventoryMutation();

  const items = itemsPage?.content ?? [];
  const totalItems = itemsPage?.totalItems ?? 0;
  const activeItems = items.filter((item) => item.active).length;
  const selectedWarehouseId = adjustmentForm.warehouseId || warehouses[0]?.id || 0;
  const selectedItemId = adjustmentForm.itemId || items[0]?.id || 0;
  const pageError = overviewError || warehouseError || itemsError || stocksError || createItem.error || updateItem.error || adjustInventory.error;
  const statusOptions = [
    { value: "ALL" as ItemStatusFilter, label: "전체" },
    { value: "ACTIVE" as ItemStatusFilter, label: "사용" },
    { value: "INACTIVE" as ItemStatusFilter, label: "비활성" }
  ];
  const itemOptions = items
    .filter((item) => item.active)
    .map((item) => ({ value: item.id, label: `${item.sku} · ${item.name}` }));
  const warehouseOptions = warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }));
  const stockWarehouseOptions = [{ value: 0, label: "전체 창고" }, ...warehouseOptions];
  const itemFormReady =
    itemForm.sku.trim().length > 0 &&
    itemForm.name.trim().length > 0 &&
    itemForm.category.trim().length > 0 &&
    itemForm.unit.trim().length > 0 &&
    itemForm.safetyStock >= 0;
  const adjustmentReady =
    selectedItemId > 0 &&
    selectedWarehouseId > 0 &&
    adjustmentForm.quantityDelta !== 0 &&
    adjustmentForm.reason.trim().length > 0;

  const handleCreateItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!itemFormReady) return;

    createItem.mutate(
      {
        sku: itemForm.sku.trim(),
        name: itemForm.name.trim(),
        category: itemForm.category.trim(),
        unit: itemForm.unit.trim(),
        safetyStock: itemForm.safetyStock
      },
      {
        onSuccess: () => setItemForm(initialItemForm)
      }
    );
  };

  const handleEditStart = (item: Item) => {
    setEditForm({
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      safetyStock: item.safetyStock,
      active: item.active
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;

    updateItem.mutate(
      {
        itemId: editForm.id,
        payload: {
          name: editForm.name.trim(),
          category: editForm.category.trim(),
          unit: editForm.unit.trim(),
          safetyStock: editForm.safetyStock,
          active: editForm.active
        }
      },
      {
        onSuccess: () => setEditForm(null)
      }
    );
  };

  const handleAdjustmentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjustmentReady) return;

    adjustInventory.mutate(
      {
        itemId: selectedItemId,
        warehouseId: selectedWarehouseId,
        quantityDelta: adjustmentForm.quantityDelta,
        reason: adjustmentForm.reason.trim()
      },
      {
        onSuccess: () => setAdjustmentForm({ ...initialAdjustmentForm, itemId: selectedItemId, warehouseId: selectedWarehouseId })
      }
    );
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="전체 품목" value={`${overview?.totalItems ?? 0}개`} />
        <MetricCard label="사용 품목" value={`${overview?.activeItems ?? activeItems}개`} change="거래 가능" />
        <MetricCard label="안전재고 미달" value={`${overview?.belowSafetyStocks ?? 0}건`} change="확인 필요" />
        <MetricCard label="창고" value={`${overview?.warehouses ?? warehouses.length}개`} change="재고 위치" />
      </div>

      {canCreateItem ? (
        <Panel title="품목 등록" description="구매, 판매, 재고 처리에서 사용할 품목 기준 정보를 등록합니다.">
          <form className="grid gap-4 xl:grid-cols-[1fr_1.3fr_1fr_0.7fr_0.8fr_auto]" onSubmit={handleCreateItem}>
            <TextField
              label="품목 코드"
              value={itemForm.sku}
              onChange={(event) => setItemForm((current) => ({ ...current, sku: event.target.value }))}
              placeholder="AX-ITM-004"
              required
            />
            <TextField
              label="품목명"
              value={itemForm.name}
              onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="무선 키보드"
              required
            />
            <TextField
              label="분류"
              value={itemForm.category}
              onChange={(event) => setItemForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="IT 장비"
              required
            />
            <TextField
              label="단위"
              value={itemForm.unit}
              onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))}
              placeholder="개"
              required
            />
            <TextField
              label="안전재고"
              min={0}
              type="number"
              value={itemForm.safetyStock}
              onChange={(event) => setItemForm((current) => ({ ...current, safetyStock: Number(event.target.value) }))}
              required
            />
            <Button className="mt-7 h-11 gap-2" disabled={!itemFormReady || createItem.isPending}>
              <Plus size={17} strokeWidth={2.2} />
              {createItem.isPending ? "등록 중" : "등록"}
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title="품목 목록" description="ERP에서 사용하는 품목 기준과 사용 상태를 관리합니다.">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <TextField
            label="검색"
            placeholder="품목 코드, 품목명, 분류"
            value={itemSearchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setItemSearchInput(event.target.value)}
            onEnter={() => {
              setItemSearch(itemSearchInput.trim());
              setItemPage(1);
            }}
          />
          <SelectField
            label="상태"
            value={itemStatus}
            options={statusOptions}
            onChange={(status) => {
              setItemStatus(status);
              setItemPage(1);
            }}
          />
        </div>

        {itemsLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            품목 목록을 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">품목</th>
                  <th className="px-4 py-3">분류</th>
                  <th className="px-4 py-3">단위</th>
                  <th className="px-4 py-3">안전재고</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {items.map((item) => (
                  <tr key={item.id} className={item.active ? "" : "bg-axis-bg/60"}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{item.sku}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{item.category}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{item.unit}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{item.safetyStock.toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-4">
                      <ItemStatusBadge active={item.active} />
                    </td>
                    <td className="px-4 py-4">
                      {canUpdateItem ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => handleEditStart(item)}>
                          <PencilLine size={14} strokeWidth={2.2} />
                          수정
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-axis-muted">조회 전용</span>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>
                      조건에 맞는 품목이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={itemPage} pageSize={PAGE_SIZE} totalItems={totalItems} onPageChange={setItemPage} />
          </div>
        )}
      </Panel>

      {editForm ? (
        <Panel title="품목 정보 수정" description="품목명, 분류, 단위, 안전재고, 사용 상태를 수정합니다.">
          <form className="grid gap-4 xl:grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.8fr_auto]" onSubmit={handleEditSubmit}>
            <TextField
              label="품목명"
              value={editForm.name}
              onChange={(event) => setEditForm((current) => (current ? { ...current, name: event.target.value } : current))}
              required
            />
            <TextField
              label="분류"
              value={editForm.category}
              onChange={(event) => setEditForm((current) => (current ? { ...current, category: event.target.value } : current))}
              required
            />
            <TextField
              label="단위"
              value={editForm.unit}
              onChange={(event) => setEditForm((current) => (current ? { ...current, unit: event.target.value } : current))}
              required
            />
            <TextField
              label="안전재고"
              min={0}
              type="number"
              value={editForm.safetyStock}
              onChange={(event) => setEditForm((current) => (current ? { ...current, safetyStock: Number(event.target.value) } : current))}
              required
            />
            <SelectField
              label="상태"
              value={editForm.active ? "ACTIVE" : "INACTIVE"}
              options={[
                { value: "ACTIVE", label: "사용" },
                { value: "INACTIVE", label: "비활성" }
              ]}
              onChange={(status) => setEditForm((current) => (current ? { ...current, active: status === "ACTIVE" } : current))}
            />
            <div className="flex items-end gap-2">
              <Button className="h-11" disabled={updateItem.isPending}>
                {updateItem.isPending ? "저장 중" : "저장"}
              </Button>
              <Button className="h-11" type="button" variant="secondary" onClick={() => setEditForm(null)}>
                취소
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Panel title="현재 재고" description="창고별 품목 수량과 안전재고 미달 여부를 확인합니다.">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <TextField
              label="검색"
              placeholder="품목, 분류, 창고"
              value={stockSearchInput}
              leftIcon={<Search size={17} strokeWidth={2.2} />}
              onChange={(event) => setStockSearchInput(event.target.value)}
              onEnter={() => setStockSearch(stockSearchInput.trim())}
            />
            <SelectField label="창고" value={stockWarehouseId} options={stockWarehouseOptions} onChange={setStockWarehouseId} />
          </div>

          {stocksLoading ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
              현재 재고를 불러오는 중입니다.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-axis-border">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                  <tr>
                    <th className="px-4 py-3">품목</th>
                    <th className="px-4 py-3">창고</th>
                    <th className="px-4 py-3">현재고</th>
                    <th className="px-4 py-3">안전재고</th>
                    <th className="px-4 py-3">상태</th>
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
                      <td className="px-4 py-4 text-sm font-bold text-axis-ink">
                        {stock.quantity.toLocaleString("ko-KR")} {stock.item.unit}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-muted">
                        {stock.safetyStock.toLocaleString("ko-KR")} {stock.item.unit}
                      </td>
                      <td className="px-4 py-4">
                        <StockBadge belowSafetyStock={stock.belowSafetyStock} />
                      </td>
                    </tr>
                  ))}
                  {stocks.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={5}>
                        조건에 맞는 재고가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {canAdjustInventory ? (
          <Panel title="재고 조정" description="실사 차이, 초기 수량 보정 등 현재고를 직접 조정합니다.">
            <form className="space-y-4" onSubmit={handleAdjustmentSubmit}>
              <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-axis-ink">
                    <Warehouse size={18} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-axis-ink">조정 기준</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">조정 수량은 양수 또는 음수로 입력합니다.</p>
                  </div>
                </div>
              </div>
              <SelectField
                label="품목"
                value={selectedItemId}
                options={itemOptions}
                placeholder="품목 선택"
                disabled={itemOptions.length === 0}
                onChange={(itemId) => setAdjustmentForm((current) => ({ ...current, itemId }))}
              />
              <SelectField
                label="창고"
                value={selectedWarehouseId}
                options={warehouseOptions}
                placeholder="창고 선택"
                disabled={warehouseOptions.length === 0}
                onChange={(warehouseId) => setAdjustmentForm((current) => ({ ...current, warehouseId }))}
              />
              <TextField
                label="조정 수량"
                type="number"
                value={adjustmentForm.quantityDelta}
                onChange={(event) => setAdjustmentForm((current) => ({ ...current, quantityDelta: Number(event.target.value) }))}
                required
              />
              <label className="block">
                <span className="text-sm font-semibold text-axis-ink">조정 사유</span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted focus:shadow-[0_0_0_3px_rgba(0,0,0,0.04)]"
                  value={adjustmentForm.reason}
                  onChange={(event) => setAdjustmentForm((current) => ({ ...current, reason: event.target.value }))}
                  placeholder="예: 월말 실사 차이 보정"
                  required
                />
              </label>
              <Button className="h-11 w-full gap-2" disabled={!adjustmentReady || adjustInventory.isPending}>
                <PackagePlus size={17} strokeWidth={2.2} />
                {adjustInventory.isPending ? "조정 중" : "재고 조정"}
              </Button>
            </form>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function ItemStatusBadge({ active }: { active: boolean }) {
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

function StockBadge({ belowSafetyStock }: { belowSafetyStock: boolean }) {
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
