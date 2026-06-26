import { FormEvent, useEffect, useMemo, useState } from "react";
import { PackagePlus, PencilLine, Plus, Search, Warehouse } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  useAdjustInventoryMutation,
  useCreateItemMutation,
  useInventoryMovementsQuery,
  useInventoryOverviewQuery,
  useInventoryStocksQuery,
  useItemsQuery,
  useUpdateItemMutation,
  useWarehousesQuery
} from "./api/inventoryApi";
import type {
  InventoryMovement,
  InventoryStock,
  InventoryMovementQueryParams,
  Item,
  ItemCreatePayload,
  ItemQueryParams,
  ItemStatusFilter,
  ItemUpdatePayload
} from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { MetricCard } from "../../shared/ui/MetricCard";
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { Toast } from "../../shared/ui/Toast";

const PAGE_SIZE = 20;

const initialItemForm: ItemCreatePayload = {
  sku: "",
  name: "",
  category: "",
  unit: "개",
  safetyStock: 0
};

type InventoryAdjustmentForm = {
  itemId: number;
  warehouseId: number;
  targetQuantity: number;
  reason: string;
};

const initialAdjustmentForm: InventoryAdjustmentForm = {
  itemId: 0,
  warehouseId: 0,
  targetQuantity: 0,
  reason: ""
};

type ItemEditForm = ItemUpdatePayload & {
  id: number;
};

export function InventoryView({ permissions = [] }: { permissions?: string[] }) {
  const [searchParams] = useSearchParams();
  const initialMovementSearch = searchParams.get("movementSearch") ?? "";
  const [itemPage, setItemPage] = useState(1);
  const [itemSearchInput, setItemSearchInput] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemStatus, setItemStatus] = useState<ItemStatusFilter>("ALL");
  const [stockSearchInput, setStockSearchInput] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockWarehouseId, setStockWarehouseId] = useState(0);
  const [movementPage, setMovementPage] = useState(1);
  const [movementSearchInput, setMovementSearchInput] = useState(initialMovementSearch);
  const [movementSearch, setMovementSearch] = useState(initialMovementSearch);
  const [movementWarehouseId, setMovementWarehouseId] = useState(0);
  const [movementStartDate, setMovementStartDate] = useState("");
  const [movementEndDate, setMovementEndDate] = useState("");
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [itemForm, setItemForm] = useState<ItemCreatePayload>(initialItemForm);
  const [editForm, setEditForm] = useState<ItemEditForm | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustmentForm>(initialAdjustmentForm);
  const [toastMessage, setToastMessage] = useState("");
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
  const movementParams = useMemo<InventoryMovementQueryParams>(
    () => ({
      page: movementPage,
      pageSize: PAGE_SIZE,
      search: movementSearch,
      warehouseId: movementWarehouseId,
      startDate: movementStartDate,
      endDate: movementEndDate
    }),
    [movementEndDate, movementPage, movementSearch, movementStartDate, movementWarehouseId]
  );

  const { data: overview, error: overviewError } = useInventoryOverviewQuery();
  const { data: warehouses = [], error: warehouseError } = useWarehousesQuery();
  const { data: itemsPage, error: itemsError, isLoading: itemsLoading } = useItemsQuery(itemParams);
  const { data: stocks = [], error: stocksError, isLoading: stocksLoading } = useInventoryStocksQuery(stockParams);
  const { data: adjustmentStocks = [], error: adjustmentStocksError } = useInventoryStocksQuery({ search: "", warehouseId: 0 });
  const { data: movementsPage, error: movementsError, isLoading: movementsLoading } = useInventoryMovementsQuery(movementParams);
  const createItem = useCreateItemMutation();
  const updateItem = useUpdateItemMutation();
  const adjustInventory = useAdjustInventoryMutation();

  const items = itemsPage?.content ?? [];
  const totalItems = itemsPage?.totalItems ?? 0;
  const movements = movementsPage?.content ?? [];
  const totalMovements = movementsPage?.totalItems ?? 0;
  const activeItems = items.filter((item) => item.active).length;
  const selectedWarehouseId = adjustmentForm.warehouseId || warehouses[0]?.id || 0;
  const selectedItemId = adjustmentForm.itemId || items[0]?.id || 0;
  const selectedAdjustmentStock = findInventoryStock(adjustmentStocks, selectedItemId, selectedWarehouseId);
  const selectedAdjustmentUnit = selectedAdjustmentStock?.item.unit ?? items.find((item) => item.id === selectedItemId)?.unit ?? "개";
  const currentAdjustmentQuantity = selectedAdjustmentStock?.quantity ?? 0;
  const adjustmentQuantityDelta = adjustmentForm.targetQuantity - currentAdjustmentQuantity;
  const pageError =
    overviewError ||
    warehouseError ||
    itemsError ||
    stocksError ||
    adjustmentStocksError ||
    movementsError ||
    createItem.error ||
    updateItem.error ||
    adjustInventory.error;
  const statusOptions = [
    { value: "ALL" as ItemStatusFilter, label: "전체" },
    { value: "ACTIVE" as ItemStatusFilter, label: "사용" },
    { value: "INACTIVE" as ItemStatusFilter, label: "비활성" }
  ];
  const itemOptions = items
    .filter((item) => item.active)
    .map((item) => ({ value: item.id, label: `${item.sku} · ${item.name}` }));
  const adjustmentItemOptions = Array.from(
    new Map(
      adjustmentStocks
        .filter((stock) => stock.item.active)
        .map((stock) => [stock.item.id, { value: stock.item.id, label: `${stock.item.sku} · ${stock.item.name}` }])
    ).values()
  );
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
    adjustmentForm.targetQuantity >= 0 &&
    adjustmentQuantityDelta !== 0 &&
    adjustmentForm.reason.trim().length > 0;
  const movementFilterLabels = [
    movementSearch ? `검색어: ${movementSearch}` : "",
    movementStartDate ? `시작일: ${movementStartDate}` : "",
    movementEndDate ? `종료일: ${movementEndDate}` : "",
    movementWarehouseId > 0 ? `창고: ${warehouses.find((warehouse) => warehouse.id === movementWarehouseId)?.name ?? "선택 창고"}` : ""
  ].filter(Boolean);

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

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
        onSuccess: () => {
          setItemForm(initialItemForm);
          setToastMessage("품목이 등록되었습니다.");
        }
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
        onSuccess: () => {
          setEditForm(null);
          setToastMessage("품목 정보가 수정되었습니다.");
        }
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
        quantityDelta: adjustmentQuantityDelta,
        reason: adjustmentForm.reason.trim()
      },
      {
        onSuccess: () => {
          setAdjustmentForm({ ...initialAdjustmentForm, itemId: selectedItemId, warehouseId: selectedWarehouseId });
          setAdjustmentModalOpen(false);
          setToastMessage("재고가 조정되었습니다.");
        }
      }
    );
  };

  const openAdjustmentModal = (stock?: InventoryStock) => {
    const itemId = stock?.item.id ?? selectedItemId;
    const warehouseId = stock?.warehouse.id ?? selectedWarehouseId;
    const currentQuantity = stock?.quantity ?? findInventoryStock(adjustmentStocks, itemId, warehouseId)?.quantity ?? 0;

    setAdjustmentForm((current) => ({
      ...current,
      itemId,
      warehouseId,
      targetQuantity: currentQuantity,
      reason: ""
    }));
    setAdjustmentModalOpen(true);
  };

  const changeAdjustmentItem = (itemId: number) => {
    const nextQuantity = findInventoryStock(adjustmentStocks, itemId, selectedWarehouseId)?.quantity ?? 0;
    setAdjustmentForm((current) => ({ ...current, itemId, targetQuantity: nextQuantity }));
  };

  const changeAdjustmentWarehouse = (warehouseId: number) => {
    const nextQuantity = findInventoryStock(adjustmentStocks, selectedItemId, warehouseId)?.quantity ?? 0;
    setAdjustmentForm((current) => ({ ...current, warehouseId, targetQuantity: nextQuantity }));
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <Toast open={toastMessage.length > 0} message={toastMessage} variant="success" onClose={() => setToastMessage("")} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="전체 품목" value={`${overview?.totalItems ?? 0}개`} />
        <MetricCard label="사용 품목" value={`${overview?.activeItems ?? activeItems}개`} change="거래 가능" />
        <MetricCard label="안전재고 미달" value={`${overview?.belowSafetyStocks ?? 0}건`} change="확인 필요" />
        <MetricCard label="창고" value={`${overview?.warehouses ?? warehouses.length}개`} change="재고 위치" />
      </div>

      {canCreateItem ? (
        <Panel title="품목 등록" description="구매, 판매, 재고 처리에서 사용할 품목 기준 정보를 등록합니다.">
          <form className="grid items-end gap-4 xl:grid-cols-[1fr_1.3fr_1fr_0.7fr_0.8fr_auto]" onSubmit={handleCreateItem}>
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
            <Button className="h-11 gap-2" disabled={!itemFormReady || createItem.isPending}>
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

      <Panel title="현재 재고" description="창고별 품목 수량과 안전재고 미달 여부를 확인합니다.">
        <div className={["mb-4 grid items-end gap-3", canAdjustInventory ? "md:grid-cols-[1fr_220px_auto]" : "md:grid-cols-[1fr_220px]"].join(" ")}>
          <TextField
            label="검색"
            placeholder="품목, 분류, 창고"
            value={stockSearchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setStockSearchInput(event.target.value)}
            onEnter={() => setStockSearch(stockSearchInput.trim())}
          />
          <SelectField label="창고" value={stockWarehouseId} options={stockWarehouseOptions} onChange={setStockWarehouseId} />
          {canAdjustInventory ? (
            <Button className="h-11 gap-2" type="button" onClick={() => openAdjustmentModal()}>
              <PackagePlus size={17} strokeWidth={2.2} />
              재고 조정
            </Button>
          ) : null}
        </div>

        {stocksLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            현재 재고를 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[940px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">품목</th>
                  <th className="px-4 py-3">창고</th>
                  <th className="px-4 py-3">현재고</th>
                  <th className="px-4 py-3">안전재고</th>
                  <th className="px-4 py-3">상태</th>
                  {canAdjustInventory ? <th className="px-4 py-3">관리</th> : null}
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
                    {canAdjustInventory ? (
                      <td className="px-4 py-4">
                        <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => openAdjustmentModal(stock)}>
                          <PackagePlus size={14} strokeWidth={2.2} />
                          조정
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {stocks.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={canAdjustInventory ? 6 : 5}>
                      조건에 맞는 재고가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="재고 이동 이력" description="구매 입고, 판매 출고, 수동 조정으로 발생한 재고 수량 변경 내역을 확인합니다.">
        <div className="mb-4 grid items-end gap-3 xl:grid-cols-[1fr_190px_190px_190px_auto_auto]">
          <TextField
            label="검색"
            placeholder="품목, 창고, 사유, 처리자"
            value={movementSearchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setMovementSearchInput(event.target.value)}
            onEnter={() => {
              setMovementSearch(movementSearchInput.trim());
              setMovementPage(1);
            }}
          />
          <Button
            className="h-11"
            type="button"
            variant="secondary"
            onClick={() => {
              setMovementSearch(movementSearchInput.trim());
              setMovementPage(1);
            }}
          >
            검색 적용
          </Button>
          <DateField
            label="시작일"
            value={movementStartDate}
            onChange={(value) => {
              setMovementStartDate(value);
              setMovementPage(1);
            }}
          />
          <DateField
            label="종료일"
            value={movementEndDate}
            onChange={(value) => {
              setMovementEndDate(value);
              setMovementPage(1);
            }}
          />
          <SelectField
            label="창고"
            value={movementWarehouseId}
            options={stockWarehouseOptions}
            onChange={(warehouseId) => {
              setMovementWarehouseId(warehouseId);
              setMovementPage(1);
            }}
          />
          <Button
            className="h-11"
            type="button"
            variant="secondary"
            onClick={() => {
              setMovementSearchInput("");
              setMovementSearch("");
              setMovementWarehouseId(0);
              setMovementStartDate("");
              setMovementEndDate("");
              setMovementPage(1);
            }}
          >
            초기화
          </Button>
        </div>

        <div className="mb-4 min-h-8">
          {movementFilterLabels.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {movementFilterLabels.map((label) => (
                <span key={label} className="inline-flex h-8 items-center rounded-full border border-axis-border bg-axis-bg px-3 text-xs font-bold text-axis-ink">
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs font-semibold text-axis-muted">필터가 적용되지 않았습니다.</p>
          )}
        </div>

        {movementsLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
            재고 이동 이력을 불러오는 중입니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
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
                    <td className="px-4 py-4">
                      <MovementQuantityBadge quantityDelta={movement.quantityDelta} unit={movement.item.unit} />
                    </td>
                    <td className="px-4 py-4">
                      <MovementSourceInfo
                        sourceType={movement.sourceType}
                        sourceLabel={movement.sourceLabel}
                        sourceReferenceNo={movement.sourceReferenceNo}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-ink">{formatProcessorName(movement.processedBy)}</td>
                    <td className="max-w-[320px] px-4 py-4 text-sm font-medium text-axis-muted">
                      <span className="block truncate" title={movement.reason}>
                        {movement.reason}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button className="h-8 px-3 text-xs" type="button" variant="secondary" onClick={() => setSelectedMovement(movement)}>
                        상세
                      </Button>
                    </td>
                  </tr>
                ))}
                {movements.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={8}>
                      조건에 맞는 이동 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={movementPage} pageSize={PAGE_SIZE} totalItems={totalMovements} onPageChange={setMovementPage} />
          </div>
        )}
      </Panel>

      <Modal
        open={adjustmentModalOpen}
        title="재고 조정"
        description="현재고를 기준으로 조정 후 수량을 입력합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setAdjustmentModalOpen(false)}>
              취소
            </Button>
            <Button disabled={!adjustmentReady || adjustInventory.isPending} type="submit" form="inventory-adjustment-form">
              {adjustInventory.isPending ? "조정 중" : "재고 조정"}
            </Button>
          </>
        }
        onClose={() => setAdjustmentModalOpen(false)}
      >
        <form id="inventory-adjustment-form" className="space-y-4" onSubmit={handleAdjustmentSubmit}>
          <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-axis-ink">
                <Warehouse size={18} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-bold text-axis-ink">조정 기준</p>
                <p className="mt-1 text-xs font-semibold text-axis-muted">
                  현재고 {currentAdjustmentQuantity.toLocaleString("ko-KR")} {selectedAdjustmentUnit} 기준으로 저장 시 변경량{" "}
                  {formatSignedQuantity(adjustmentQuantityDelta, selectedAdjustmentUnit)}이 기록됩니다.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="품목"
              value={selectedItemId}
              options={adjustmentItemOptions.length > 0 ? adjustmentItemOptions : itemOptions}
              placeholder="품목 선택"
              disabled={adjustmentItemOptions.length === 0 && itemOptions.length === 0}
              onChange={changeAdjustmentItem}
            />
            <SelectField
              label="창고"
              value={selectedWarehouseId}
              options={warehouseOptions}
              placeholder="창고 선택"
              disabled={warehouseOptions.length === 0}
              onChange={changeAdjustmentWarehouse}
            />
            <TextField
              label="조정 후 현재고"
              type="number"
              min={0}
              value={adjustmentForm.targetQuantity}
              onChange={(event) => setAdjustmentForm((current) => ({ ...current, targetQuantity: Number(event.target.value) }))}
              required
            />
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-axis-ink">조정 사유</span>
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
              value={adjustmentForm.reason}
              onChange={(event) => setAdjustmentForm((current) => ({ ...current, reason: event.target.value }))}
              placeholder="예: 월말 실사 차이 보정"
              required
            />
          </label>
        </form>
      </Modal>

      <Modal
        open={selectedMovement !== null}
        title="재고 이동 이력 상세"
        description="재고 수량 변경의 출처, 처리 기준, 사유를 확인합니다."
        footer={
          <Button type="button" variant="secondary" onClick={() => setSelectedMovement(null)}>
            닫기
          </Button>
        }
        onClose={() => setSelectedMovement(null)}
      >
        {selectedMovement ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="처리 일시" value={formatDateTime(selectedMovement.processedAt)} />
              <InfoItem label="처리자" value={formatProcessorName(selectedMovement.processedBy)} />
              <InfoItem label="품목" value={`${selectedMovement.item.sku} · ${selectedMovement.item.name}`} />
              <InfoItem label="창고" value={selectedMovement.warehouse.name} />
              <InfoItem label="이동 수량" value={formatSignedQuantity(selectedMovement.quantityDelta, selectedMovement.item.unit)} />
              <InfoItem label="분류" value={selectedMovement.item.category} />
              <InfoItem label="출처" value={formatMovementSource(selectedMovement.sourceLabel, selectedMovement.sourceReferenceNo)} />
            </div>
            <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <p className="text-xs font-bold text-axis-muted">처리 사유</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-axis-ink">{selectedMovement.reason}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={editForm !== null}
        title="품목 정보 수정"
        description="품목명, 분류, 단위, 안전재고, 사용 상태를 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditForm(null)}>
              취소
            </Button>
            <Button disabled={updateItem.isPending} type="submit" form="item-edit-form">
              {updateItem.isPending ? "저장 중" : "저장"}
            </Button>
          </>
        }
        onClose={() => setEditForm(null)}
      >
        {editForm ? (
          <form id="item-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleEditSubmit}>
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
          </form>
        ) : null}
      </Modal>
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

function MovementQuantityBadge({ quantityDelta, unit }: { quantityDelta: number; unit: string }) {
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

function MovementSourceInfo({
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

function findInventoryStock(stocks: InventoryStock[], itemId: number, warehouseId: number) {
  return stocks.find((stock) => stock.item.id === itemId && stock.warehouse.id === warehouseId);
}

function formatMovementSource(sourceLabel: string, sourceReferenceNo: string) {
  return sourceReferenceNo ? `${sourceLabel} · ${sourceReferenceNo}` : sourceLabel;
}

function formatSignedQuantity(quantity: number, unit: string) {
  return `${quantity > 0 ? "+" : ""}${quantity.toLocaleString("ko-KR")} ${unit}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatProcessorName(value: string) {
  if (value === "admin") {
    return "시스템 관리자";
  }
  return value.trim() || "-";
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-white px-4 py-3">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}
