import { Eye, PackageCheck, RotateCcw, Search, X } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { SalesOrder, SalesOrderStatusFilter } from "../api/dto";
import { formatCurrency, formatDateTime, SalesStatusBadge, ShipStatusBadge } from "./salesDisplay";

type SalesOrderListPanelProps = {
  orders: SalesOrder[];
  totalOrders: number;
  page: number;
  pageSize: number;
  searchInput: string;
  status: SalesOrderStatusFilter;
  statusOptions: Array<{ value: SalesOrderStatusFilter; label: string }>;
  loading: boolean;
  canUpdate: boolean;
  canShip: boolean;
  shipPending: boolean;
  cancelShipPending: boolean;
  cancelPending: boolean;
  warehouseCount: number;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: SalesOrderStatusFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (orderId: number) => void;
  onOpenShip: (order: SalesOrder) => void;
  onCancelShip: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
};

export function SalesOrderListPanel({
  orders,
  totalOrders,
  page,
  pageSize,
  searchInput,
  status,
  statusOptions,
  loading,
  canUpdate,
  canShip,
  shipPending,
  cancelShipPending,
  cancelPending,
  warehouseCount,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onResetFilters,
  onPageChange,
  onSelectOrder,
  onOpenShip,
  onCancelShip,
  onCancelOrder
}: SalesOrderListPanelProps) {
  return (
    <Panel title="판매 수주 목록" description="등록된 판매 수주와 고객사, 품목, 금액을 확인합니다.">
      <div className="mb-4 grid items-end gap-3 md:grid-cols-[1fr_180px_auto_auto]">
        <TextField label="검색" placeholder="수주번호, 고객사, 품목, 메모" value={searchInput} leftIcon={<Search size={17} strokeWidth={2.2} />} onChange={(event) => onSearchInputChange(event.target.value)} onEnter={onApplySearch} />
        <SelectField label="상태" value={status} options={statusOptions} onChange={onStatusChange} />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>검색 적용</Button>
        <ResetButton onClick={onResetFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">판매 수주를 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
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
                  <td className="px-4 py-4"><p className="text-sm font-bold text-axis-ink">{order.orderNo}</p><p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(order.orderedAt)} · {order.orderedBy}</p></td>
                  <td className="px-4 py-4"><p className="text-sm font-bold text-axis-ink">{order.customer.name}</p><p className="mt-1 text-xs font-semibold text-axis-muted">{order.customer.code}</p></td>
                  <td className="px-4 py-4"><p className="text-sm font-bold text-axis-ink">{order.item.name}</p><p className="mt-1 text-xs font-semibold text-axis-muted">{order.item.sku}</p></td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{order.quantity.toLocaleString("ko-KR")} {order.item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-4"><SalesStatusBadge status={order.status} /></td>
                  <td className="px-4 py-4"><ShipStatusBadge shipped={order.shippedAt !== null} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectOrder(order.id)}><Eye size={14} strokeWidth={2.2} />상세</Button>
                      {order.status === "REGISTERED" && !order.shippedAt && canShip ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs" disabled={shipPending || cancelShipPending || warehouseCount === 0} type="button" variant="secondary" onClick={() => onOpenShip(order)}><PackageCheck size={14} strokeWidth={2.2} />출고 처리</Button>
                      ) : null}
                      {order.status === "REGISTERED" && order.shippedAt && canShip ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs text-rose-700" disabled={cancelShipPending} type="button" variant="secondary" onClick={() => onCancelShip(order.id)}><RotateCcw size={14} strokeWidth={2.2} />출고 취소</Button>
                      ) : null}
                      {order.status === "REGISTERED" && !order.shippedAt && canUpdate ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs text-rose-700" disabled={cancelPending || shipPending || cancelShipPending} type="button" variant="secondary" onClick={() => onCancelOrder(order.id)}><X size={14} strokeWidth={2.2} />취소</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={8}>등록된 판매 수주가 없습니다.</td></tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalOrders} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
