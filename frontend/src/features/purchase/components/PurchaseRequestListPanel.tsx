import { Check, Eye, Search, ShoppingCart, X } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { PurchaseRequest, PurchaseRequestStatusFilter } from "../api/dto";
import { formatCurrency, formatDateTime, PurchaseStatusBadge } from "./purchaseDisplay";

type PurchaseRequestListPanelProps = {
  requests: PurchaseRequest[];
  totalRequests: number;
  page: number;
  pageSize: number;
  searchInput: string;
  status: PurchaseRequestStatusFilter;
  statusOptions: Array<{ value: PurchaseRequestStatusFilter; label: string }>;
  loading: boolean;
  canApprove: boolean;
  canUpdate: boolean;
  approvePending: boolean;
  cancelPending: boolean;
  createOrderPending: boolean;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: PurchaseRequestStatusFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSelectRequest: (request: PurchaseRequest) => void;
  onApprove: (requestId: number) => void;
  onCancel: (request: PurchaseRequest) => void;
  onCreateOrder: (requestId: number) => void;
};

export function PurchaseRequestListPanel({
  requests,
  totalRequests,
  page,
  pageSize,
  searchInput,
  status,
  statusOptions,
  loading,
  canApprove,
  canUpdate,
  approvePending,
  cancelPending,
  createOrderPending,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onResetFilters,
  onPageChange,
  onSelectRequest,
  onApprove,
  onCancel,
  onCreateOrder
}: PurchaseRequestListPanelProps) {
  const actionPending = approvePending || cancelPending || createOrderPending;

  return (
    <Panel title="구매 요청 목록" description="등록된 구매 요청과 공급사, 품목, 금액을 확인합니다.">
      <div className="mb-4 grid min-w-0 items-end gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
        <TextField
          label="검색"
          placeholder="요청번호, 공급사, 품목, 메모"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <SelectField label="상태" value={status} options={statusOptions} onChange={onStatusChange} />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>
          검색 적용
        </Button>
        <ResetButton onClick={onResetFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">구매 요청을 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3">요청</th>
                <th className="px-4 py-3">공급사</th>
                <th className="px-4 py-3">품목</th>
                <th className="px-4 py-3">수량</th>
                <th className="px-4 py-3">금액</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{request.requestNo}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(request.requestedAt)} · {request.requestedBy}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{request.supplier.name}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{request.item.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{request.item.sku}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{request.quantity.toLocaleString("ko-KR")} {request.item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{formatCurrency(request.totalAmount)}</td>
                  <td className="px-4 py-4"><PurchaseStatusBadge status={request.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onSelectRequest(request)}>
                        <Eye size={14} strokeWidth={2.2} />
                        상세
                      </Button>
                      {request.status === "REQUESTED" && (canApprove || canUpdate) ? (
                        <>
                          {canApprove ? (
                            <Button className="h-8 gap-1.5 px-3 text-xs" disabled={actionPending} type="button" variant="secondary" onClick={() => onApprove(request.id)}>
                              <Check size={14} strokeWidth={2.2} />
                              승인
                            </Button>
                          ) : null}
                          {canUpdate ? (
                            <Button className="h-8 gap-1.5 px-3 text-xs text-rose-700" disabled={actionPending} type="button" variant="secondary" onClick={() => onCancel(request)}>
                              <X size={14} strokeWidth={2.2} />
                              반려
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                      {request.status === "APPROVED" && canUpdate ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs" disabled={actionPending} type="button" variant="secondary" onClick={() => onCreateOrder(request.id)}>
                          <ShoppingCart size={14} strokeWidth={2.2} />
                          발주 전환
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={7}>등록된 구매 요청이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalRequests} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
