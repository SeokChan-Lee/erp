import { Eye, PackageCheck, RotateCcw, Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { DateField } from "../../../shared/ui/DateField";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { PurchaseOrder } from "../api/dto";
import { formatCurrency, formatDateTime, ReceiveStatusBadge } from "./purchaseDisplay";

type PurchaseOrderListPanelProps = {
  orders: PurchaseOrder[];
  totalOrders: number;
  page: number;
  pageSize: number;
  searchInput: string;
  fromDateInput: string;
  toDateInput: string;
  loading: boolean;
  canManageOrder: boolean;
  receivePending: boolean;
  cancelReceivePending: boolean;
  warehouseCount: number;
  onSearchInputChange: (value: string) => void;
  onFromDateInputChange: (value: string) => void;
  onToDateInputChange: (value: string) => void;
  onApplySearch: () => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (orderId: number) => void;
  onOpenReceive: (order: PurchaseOrder) => void;
  onCancelReceive: (orderId: number) => void;
};

export function PurchaseOrderListPanel({
  orders,
  totalOrders,
  page,
  pageSize,
  searchInput,
  fromDateInput,
  toDateInput,
  loading,
  canManageOrder,
  receivePending,
  cancelReceivePending,
  warehouseCount,
  onSearchInputChange,
  onFromDateInputChange,
  onToDateInputChange,
  onApplySearch,
  onResetFilters,
  onPageChange,
  onSelectOrder,
  onOpenReceive,
  onCancelReceive
}: PurchaseOrderListPanelProps) {
  return (
    <Panel title="구매 발주 목록" description="승인된 구매 요청에서 전환된 발주 기록을 확인합니다.">
      <div className="mb-4 grid min-w-0 items-end gap-3 xl:grid-cols-[1fr_180px_180px_auto_auto]">
        <TextField
          label="검색"
          placeholder="발주번호, 요청번호, 공급사, 품목, 담당자"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <DateField label="시작일" value={fromDateInput} onChange={onFromDateInputChange} />
        <DateField label="종료일" value={toDateInput} onChange={onToDateInputChange} />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>
          검색 적용
        </Button>
        <ResetButton onClick={onResetFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">구매 발주를 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[1400px] border-collapse text-left">
            <colgroup>
              <col className="w-[230px]" />
              <col className="w-[180px]" />
              <col className="w-[190px]" />
              <col className="w-[190px]" />
              <col className="w-[110px]" />
              <col className="w-[150px]" />
              <col className="w-[110px]" />
              <col className="w-[240px]" />
            </colgroup>
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">발주</th>
                <th className="whitespace-nowrap px-4 py-3">연결 요청</th>
                <th className="whitespace-nowrap px-4 py-3">공급사</th>
                <th className="whitespace-nowrap px-4 py-3">품목</th>
                <th className="whitespace-nowrap px-4 py-3">수량</th>
                <th className="whitespace-nowrap px-4 py-3">금액</th>
                <th className="whitespace-nowrap px-4 py-3">상태</th>
                <th className="whitespace-nowrap px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{order.orderNo}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(order.orderedAt)} · {order.orderedBy}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-muted">{order.request.requestNo}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{order.request.supplier.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{order.request.supplier.code}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{order.request.item.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{order.request.item.sku}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-ink">{order.request.quantity.toLocaleString("ko-KR")} {order.request.item.unit}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-axis-ink">{formatCurrency(order.totalAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-4"><ReceiveStatusBadge received={order.receivedAt !== null} /></td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-col text-xs font-semibold text-axis-muted">
                        {order.receivedAt ? (
                          <>
                            <span className="truncate text-axis-ink">{order.receivedWarehouse?.name ?? "입고 창고"}</span>
                            <span className="mt-1 truncate">{formatDateTime(order.receivedAt)} · {order.receivedBy}</span>
                          </>
                        ) : (
                          <span>입고 대기</span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button className="h-8 gap-1.5 whitespace-nowrap px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectOrder(order.id)}>
                          <Eye size={14} strokeWidth={2.2} />
                          상세
                        </Button>
                        {!order.receivedAt && canManageOrder ? (
                          <Button
                            className="h-8 gap-1.5 whitespace-nowrap px-3 text-xs"
                            disabled={receivePending || cancelReceivePending || warehouseCount === 0}
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenReceive(order)}
                          >
                            <PackageCheck size={14} strokeWidth={2.2} />
                            입고 처리
                          </Button>
                        ) : null}
                        {order.receivedAt && canManageOrder ? (
                          <Button
                            className="h-8 gap-1.5 whitespace-nowrap px-3 text-xs text-rose-700"
                            disabled={cancelReceivePending}
                            type="button"
                            variant="secondary"
                            onClick={() => onCancelReceive(order.id)}
                          >
                            <RotateCcw size={14} strokeWidth={2.2} />
                            입고 취소
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={8}>조건에 맞는 구매 발주가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalOrders} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
