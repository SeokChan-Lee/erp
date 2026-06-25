import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, PackageCheck, Search, Send, X } from "lucide-react";

import { useItemsQuery, useWarehousesQuery } from "../inventory/api/inventoryApi";
import type { ItemQueryParams } from "../inventory/api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SearchableSelectField } from "../../shared/ui/SearchableSelectField";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";
import { Toast } from "../../shared/ui/Toast";
import {
  useActiveSalesCustomersQuery,
  useCancelSalesOrderMutation,
  useCreateSalesOrderMutation,
  useSalesOrdersQuery,
  useShipSalesOrderMutation
} from "./api/salesApi";
import type {
  SalesOrder,
  SalesOrderCreatePayload,
  SalesOrderQueryParams,
  SalesOrderStatusFilter
} from "./api/dto";

const PAGE_SIZE = 20;

const initialSalesForm: SalesOrderCreatePayload = {
  customerId: 0,
  itemId: 0,
  quantity: 1,
  unitPrice: 1,
  memo: ""
};

export function SalesView({ permissions = [] }: { permissions?: string[] }) {
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState<SalesOrderStatusFilter>("ALL");
  const [salesForm, setSalesForm] = useState<SalesOrderCreatePayload>(initialSalesForm);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [shippingOrder, setShippingOrder] = useState<SalesOrder | null>(null);
  const [shipWarehouseId, setShipWarehouseId] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  const canCreateSales = permissions.includes("SALES_CREATE");
  const canUpdateSales = permissions.includes("SALES_UPDATE");

  const orderParams = useMemo<SalesOrderQueryParams>(
    () => ({
      page: orderPage,
      pageSize: PAGE_SIZE,
      search: orderSearch,
      status: orderStatus
    }),
    [orderPage, orderSearch, orderStatus]
  );
  const itemParams = useMemo<ItemQueryParams>(
    () => ({
      page: 1,
      pageSize: 100,
      search: "",
      status: "ACTIVE"
    }),
    []
  );

  const { data: customersPage, error: customersError } = useActiveSalesCustomersQuery();
  const { data: itemsPage, error: itemsError } = useItemsQuery(itemParams);
  const { data: warehouses = [], error: warehousesError } = useWarehousesQuery();
  const { data: ordersPage, error: ordersError, isLoading: ordersLoading } = useSalesOrdersQuery(orderParams);
  const createOrder = useCreateSalesOrderMutation();
  const cancelOrder = useCancelSalesOrderMutation();
  const shipOrder = useShipSalesOrderMutation();

  const customers = customersPage?.content ?? [];
  const items = itemsPage?.content ?? [];
  const orders = ordersPage?.content ?? [];
  const totalOrders = ordersPage?.totalItems ?? 0;
  const selectedCustomerId = salesForm.customerId || customers[0]?.id || 0;
  const selectedItemId = salesForm.itemId || items[0]?.id || 0;
  const customerOptions = customers.map((customer) => ({ value: customer.id, label: `${customer.code} · ${customer.name}` }));
  const itemOptions = items.map((item) => ({ value: item.id, label: `${item.sku} · ${item.name}` }));
  const warehouseOptions = warehouses.map((warehouse) => ({ value: warehouse.id, label: `${warehouse.code} · ${warehouse.name}` }));
  const statusOptions = [
    { value: "ALL" as SalesOrderStatusFilter, label: "전체" },
    { value: "REGISTERED" as SalesOrderStatusFilter, label: "등록" },
    { value: "CANCELED" as SalesOrderStatusFilter, label: "취소" }
  ];
  const salesFormReady = selectedCustomerId > 0 && selectedItemId > 0 && salesForm.quantity > 0 && salesForm.unitPrice > 0;
  const selectedShipWarehouseId = shipWarehouseId || warehouses[0]?.id || 0;
  const pageError = customersError || itemsError || warehousesError || ordersError || createOrder.error || cancelOrder.error || shipOrder.error;

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  const handleCreateOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!salesFormReady) return;

    createOrder.mutate(
      {
        customerId: selectedCustomerId,
        itemId: selectedItemId,
        quantity: salesForm.quantity,
        unitPrice: salesForm.unitPrice,
        memo: salesForm.memo.trim()
      },
      {
        onSuccess: () => {
          setSalesForm({ ...initialSalesForm, customerId: selectedCustomerId, itemId: selectedItemId });
          setToastMessage("판매 수주가 등록되었습니다.");
        }
      }
    );
  };

  const handleApplySearch = () => {
    setOrderSearch(orderSearchInput.trim());
    setOrderPage(1);
  };

  const handleCancelOrder = (orderId: number) => {
    cancelOrder.mutate(orderId, {
      onSuccess: () => setToastMessage("판매 수주가 취소되었습니다.")
    });
  };

  const openShipModal = (order: SalesOrder) => {
    setShippingOrder(order);
    setShipWarehouseId(warehouses[0]?.id ?? 0);
  };

  const handleShipOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shippingOrder || selectedShipWarehouseId <= 0) return;

    shipOrder.mutate(
      {
        orderId: shippingOrder.id,
        payload: { warehouseId: selectedShipWarehouseId }
      },
      {
        onSuccess: () => {
          setShippingOrder(null);
          setShipWarehouseId(0);
          setToastMessage("판매 수주 출고가 처리되었습니다.");
        }
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

      <Toast open={toastMessage.length > 0} message={toastMessage} variant="success" onClose={() => setToastMessage("")} />

      {canCreateSales ? (
        <Panel title="판매 수주 등록" description="고객사와 품목을 선택해 판매 수주를 등록합니다.">
          <form className="space-y-4" onSubmit={handleCreateOrder}>
            <SearchableSelectField
              label="고객사"
              value={selectedCustomerId}
              options={customerOptions}
              placeholder="고객사 선택"
              searchPlaceholder="고객사 코드 또는 이름 검색"
              disabled={customerOptions.length === 0}
              onChange={(customerId) => setSalesForm((current) => ({ ...current, customerId }))}
            />
            <SearchableSelectField
              label="품목"
              value={selectedItemId}
              options={itemOptions}
              placeholder="품목 선택"
              searchPlaceholder="품목 코드 또는 이름 검색"
              disabled={itemOptions.length === 0}
              onChange={(itemId) => setSalesForm((current) => ({ ...current, itemId }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="수량" min={1} type="number" value={salesForm.quantity} onChange={(event) => setSalesForm((current) => ({ ...current, quantity: Number(event.target.value) }))} required />
              <TextField label="단가" min={1} type="number" value={salesForm.unitPrice} onChange={(event) => setSalesForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} required />
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-axis-ink">수주 메모</span>
              <textarea
                className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
                value={salesForm.memo}
                onChange={(event) => setSalesForm((current) => ({ ...current, memo: event.target.value }))}
                placeholder="예: 7월 납품 예정"
              />
            </label>
            <Button className="h-11 w-full gap-2" disabled={!salesFormReady || createOrder.isPending}>
              <Send size={17} strokeWidth={2.2} />
              {createOrder.isPending ? "등록 중" : "판매 수주 등록"}
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel title="판매 수주 목록" description="등록된 판매 수주와 고객사, 품목, 금액을 확인합니다.">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <TextField
            label="검색"
            placeholder="수주번호, 고객사, 품목, 메모"
            value={orderSearchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setOrderSearchInput(event.target.value)}
            onEnter={handleApplySearch}
          />
          <SelectField
            label="상태"
            value={orderStatus}
            options={statusOptions}
            onChange={(status) => {
              setOrderStatus(status);
              setOrderPage(1);
            }}
          />
          <Button className="mt-7 h-11" type="button" variant="secondary" onClick={handleApplySearch}>
            검색 적용
          </Button>
        </div>

        {ordersLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">판매 수주를 불러오는 중입니다.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">수주</th>
                  <th className="px-4 py-3">고객사</th>
                  <th className="px-4 py-3">품목</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">출고</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{order.orderNo}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(order.orderedAt)} · {order.orderedBy}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{order.customer.name}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{order.customer.code}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{order.item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{order.item.sku}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{order.quantity.toLocaleString("ko-KR")} {order.item.unit}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-4"><SalesStatusBadge status={order.status} /></td>
                    <td className="px-4 py-4"><ShipStatusBadge shipped={order.shippedAt !== null} /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => setSelectedOrder(order)}>
                          <Eye size={14} strokeWidth={2.2} />
                          상세
                        </Button>
                        {order.status === "REGISTERED" && !order.shippedAt && canUpdateSales ? (
                          <Button
                            className="h-8 gap-1.5 px-3 text-xs"
                            disabled={shipOrder.isPending || warehouses.length === 0}
                            type="button"
                            variant="secondary"
                            onClick={() => openShipModal(order)}
                          >
                            <PackageCheck size={14} strokeWidth={2.2} />
                            출고 처리
                          </Button>
                        ) : null}
                        {order.status === "REGISTERED" && !order.shippedAt && canUpdateSales ? (
                          <Button
                            className="h-8 gap-1.5 px-3 text-xs text-rose-700"
                            disabled={cancelOrder.isPending || shipOrder.isPending}
                            type="button"
                            variant="secondary"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <X size={14} strokeWidth={2.2} />
                            취소
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={8}>등록된 판매 수주가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={orderPage} pageSize={PAGE_SIZE} totalItems={totalOrders} onPageChange={setOrderPage} />
          </div>
        )}
      </Panel>

      <Modal
        open={shippingOrder !== null}
        title="판매 수주 출고 처리"
        description="수주 품목을 출고할 창고를 선택하면 현재고와 재고 이동 이력이 함께 반영됩니다."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShippingOrder(null);
                setShipWarehouseId(0);
              }}
            >
              취소
            </Button>
            <Button disabled={selectedShipWarehouseId <= 0 || shipOrder.isPending} type="submit" form="sales-order-ship-form">
              {shipOrder.isPending ? "처리 중" : "출고 처리"}
            </Button>
          </>
        }
        onClose={() => {
          setShippingOrder(null);
          setShipWarehouseId(0);
        }}
      >
        {shippingOrder ? (
          <form id="sales-order-ship-form" className="space-y-4" onSubmit={handleShipOrder}>
            <div className="rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">{shippingOrder.orderNo}</p>
              <p className="mt-1 text-xs font-semibold text-axis-muted">{shippingOrder.customer.name} · {formatCurrency(shippingOrder.totalAmount)}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="품목" value={`${shippingOrder.item.sku} · ${shippingOrder.item.name}`} />
              <DetailItem label="출고 수량" value={`${shippingOrder.quantity.toLocaleString("ko-KR")} ${shippingOrder.item.unit}`} />
            </div>
            <SelectField
              label="출고 창고"
              value={selectedShipWarehouseId}
              options={warehouseOptions}
              onChange={setShipWarehouseId}
            />
          </form>
        ) : null}
      </Modal>

      <Modal
        open={selectedOrder !== null}
        title="판매 수주 상세"
        description="판매 수주의 고객사, 품목, 금액, 메모를 확인합니다."
        footer={<Button type="button" variant="secondary" onClick={() => setSelectedOrder(null)}>닫기</Button>}
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <div>
                <p className="text-sm font-bold text-axis-ink">{selectedOrder.orderNo}</p>
                <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(selectedOrder.orderedAt)} · {selectedOrder.orderedBy}</p>
              </div>
              <SalesStatusBadge status={selectedOrder.status} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="고객사" value={`${selectedOrder.customer.code} · ${selectedOrder.customer.name}`} />
              <DetailItem label="품목" value={`${selectedOrder.item.sku} · ${selectedOrder.item.name}`} />
              <DetailItem label="수량" value={`${selectedOrder.quantity.toLocaleString("ko-KR")} ${selectedOrder.item.unit}`} />
              <DetailItem label="단가" value={formatCurrency(selectedOrder.unitPrice)} />
              <DetailItem label="합계 금액" value={formatCurrency(selectedOrder.totalAmount)} />
              <DetailItem label="처리자" value={selectedOrder.processedBy ?? "아직 처리되지 않음"} />
              <DetailItem label="출고 창고" value={selectedOrder.shippedWarehouse?.name ?? "아직 출고되지 않음"} />
              <DetailItem label="출고 처리" value={selectedOrder.shippedAt ? `${formatDateTime(selectedOrder.shippedAt)} · ${selectedOrder.shippedBy}` : "아직 출고되지 않음"} />
            </div>
            <div className="rounded-lg border border-axis-border px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">수주 메모</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-axis-muted">{selectedOrder.memo?.trim() || "등록된 메모가 없습니다."}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function SalesStatusBadge({ status }: { status: string }) {
  const canceled = status === "CANCELED";
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", canceled ? "bg-axis-bg text-axis-muted" : "bg-emerald-50 text-emerald-700"].join(" ")}>
      {canceled ? "취소" : "등록"}
    </span>
  );
}

function ShipStatusBadge({ shipped }: { shipped: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", shipped ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"].join(" ")}>
      {shipped ? "출고 완료" : "출고 대기"}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border px-4 py-3">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-axis-ink">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(value);
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
