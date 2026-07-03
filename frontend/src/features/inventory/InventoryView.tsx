import { FormEvent, useEffect, useMemo, useState } from "react";
import { Warehouse } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import {
  useAdjustInventoryMutation,
  useCreateWarehouseMutation,
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
  ItemQueryParams,
  ItemStatusFilter,
} from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { Toast } from "../../shared/ui/Toast";
import { CurrentStockPanel } from "./components/CurrentStockPanel";
import {
  findInventoryStock,
  formatDateTime,
  formatMovementSource,
  formatProcessorName,
  formatSignedQuantity,
  InfoItem
} from "./components/inventoryDisplay";
import { InventoryMovementListPanel } from "./components/InventoryMovementListPanel";
import { InventorySummaryCards } from "./components/InventorySummaryCards";
import { ItemCreatePanel } from "./components/ItemCreatePanel";
import { ItemListPanel } from "./components/ItemListPanel";
import { WarehouseOverviewPanel } from "./components/WarehouseOverviewPanel";
import type { InventoryAdjustmentForm, ItemCreateForm, ItemEditForm } from "./types";

const PAGE_SIZE = 20;

const initialItemForm: ItemCreateForm = {
  sku: "",
  name: "",
  category: "",
  unit: "",
  safetyStock: ""
};

const initialWarehouseForm = {
  code: "",
  name: ""
};

const initialAdjustmentForm: InventoryAdjustmentForm = {
  itemId: 0,
  warehouseId: 0,
  targetQuantity: 0,
  reason: ""
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
  const [itemForm, setItemForm] = useState<ItemCreateForm>(initialItemForm);
  const [warehouseCreateOpen, setWarehouseCreateOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState(initialWarehouseForm);
  const [editForm, setEditForm] = useState<ItemEditForm | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustmentForm>(initialAdjustmentForm);
  const [toastMessage, setToastMessage] = useState("");
  const canCreateItem = permissions.includes("ITEM_CREATE");
  const canUpdateItem = permissions.includes("ITEM_UPDATE");
  const canCreateWarehouse = permissions.includes("WAREHOUSE_CREATE");
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
  const createWarehouse = useCreateWarehouseMutation();
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
    createWarehouse.error ||
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
    itemForm.safetyStock.trim().length > 0 &&
    Number(itemForm.safetyStock) >= 0;
  const warehouseFormReady = warehouseForm.code.trim().length > 0 && warehouseForm.name.trim().length > 0;
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
        safetyStock: Number(itemForm.safetyStock)
      },
      {
        onSuccess: () => {
          setItemForm(initialItemForm);
          setToastMessage("품목이 등록되었습니다.");
        }
      }
    );
  };

  const handleCreateWarehouse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!warehouseFormReady) return;

    createWarehouse.mutate(
      {
        code: warehouseForm.code.trim().toUpperCase(),
        name: warehouseForm.name.trim()
      },
      {
        onSuccess: () => {
          setWarehouseForm(initialWarehouseForm);
          setWarehouseCreateOpen(false);
          setToastMessage("창고가 등록되었습니다.");
        }
      }
    );
  };

  const handleViewWarehouseStock = (warehouseId: number) => {
    setStockWarehouseId(warehouseId);
    setStockSearchInput("");
    setStockSearch("");
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

  const resetItemFilters = () => {
    setItemSearchInput("");
    setItemSearch("");
    setItemStatus("ALL");
    setItemPage(1);
  };

  const resetStockFilters = () => {
    setStockSearchInput("");
    setStockSearch("");
    setStockWarehouseId(0);
  };

  const resetMovementFilters = () => {
    setMovementSearchInput("");
    setMovementSearch("");
    setMovementWarehouseId(0);
    setMovementStartDate("");
    setMovementEndDate("");
    setMovementPage(1);
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <Toast open={toastMessage.length > 0} message={toastMessage} variant="success" onClose={() => setToastMessage("")} />

      <InventorySummaryCards overview={overview} activeItems={activeItems} warehouses={warehouses} />

      {canCreateItem ? (
        <ItemCreatePanel form={itemForm} setForm={setItemForm} formReady={itemFormReady} createPending={createItem.isPending} onSubmit={handleCreateItem} />
      ) : null}

      <ItemListPanel
        items={items}
        totalItems={totalItems}
        page={itemPage}
        pageSize={PAGE_SIZE}
        searchInput={itemSearchInput}
        status={itemStatus}
        statusOptions={statusOptions}
        loading={itemsLoading}
        canUpdate={canUpdateItem}
        onSearchInputChange={setItemSearchInput}
        onApplySearch={() => {
          setItemSearch(itemSearchInput.trim());
          setItemPage(1);
        }}
        onStatusChange={(status) => {
          setItemStatus(status);
          setItemPage(1);
        }}
        onResetFilters={resetItemFilters}
        onPageChange={setItemPage}
        onEdit={handleEditStart}
      />

      <WarehouseOverviewPanel
        warehouses={warehouses}
        stocks={adjustmentStocks}
        canCreate={canCreateWarehouse}
        onCreateClick={() => setWarehouseCreateOpen(true)}
        onViewWarehouseStock={handleViewWarehouseStock}
      />

      <CurrentStockPanel
        stocks={stocks}
        loading={stocksLoading}
        searchInput={stockSearchInput}
        warehouseId={stockWarehouseId}
        warehouseOptions={stockWarehouseOptions}
        canAdjust={canAdjustInventory}
        onSearchInputChange={setStockSearchInput}
        onApplySearch={() => setStockSearch(stockSearchInput.trim())}
        onWarehouseChange={setStockWarehouseId}
        onResetFilters={resetStockFilters}
        onOpenAdjustment={openAdjustmentModal}
      />

      <InventoryMovementListPanel
        movements={movements}
        totalMovements={totalMovements}
        page={movementPage}
        pageSize={PAGE_SIZE}
        loading={movementsLoading}
        searchInput={movementSearchInput}
        startDate={movementStartDate}
        endDate={movementEndDate}
        warehouseId={movementWarehouseId}
        warehouseOptions={stockWarehouseOptions}
        filterLabels={movementFilterLabels}
        onSearchInputChange={setMovementSearchInput}
        onApplySearch={() => {
          setMovementSearch(movementSearchInput.trim());
          setMovementPage(1);
        }}
        onStartDateChange={(value) => {
          setMovementStartDate(value);
          setMovementPage(1);
        }}
        onEndDateChange={(value) => {
          setMovementEndDate(value);
          setMovementPage(1);
        }}
        onWarehouseChange={(warehouseId) => {
          setMovementWarehouseId(warehouseId);
          setMovementPage(1);
        }}
        onResetFilters={resetMovementFilters}
        onPageChange={setMovementPage}
        onSelectMovement={setSelectedMovement}
      />

      <Modal
        open={warehouseCreateOpen}
        title="창고 등록"
        description="재고를 관리할 창고 기준 정보를 등록합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setWarehouseCreateOpen(false)}>
              취소
            </Button>
            <Button disabled={!warehouseFormReady || createWarehouse.isPending} type="submit" form="warehouse-create-form">
              {createWarehouse.isPending ? "등록 중" : "등록"}
            </Button>
          </>
        }
        onClose={() => setWarehouseCreateOpen(false)}
      >
        <form id="warehouse-create-form" className="space-y-4" onSubmit={handleCreateWarehouse}>
          <TextField
            label="창고 코드"
            value={warehouseForm.code}
            onChange={(event) => setWarehouseForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            placeholder="WH-SEOUL"
            required
          />
          <TextField
            label="창고명"
            value={warehouseForm.name}
            onChange={(event) => setWarehouseForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="서울 물류 창고"
            required
          />
        </form>
      </Modal>

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
