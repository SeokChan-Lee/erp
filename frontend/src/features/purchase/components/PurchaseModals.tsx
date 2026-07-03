import type { Dispatch, FormEvent, SetStateAction } from "react";

import { getErrorMessage } from "../../../shared/api/http";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import type { CustomerCreatePayload, PurchaseOrder, PurchaseRequest, SupplierCreatePayload } from "../api/dto";
import type { CustomerEditForm, SupplierEditForm } from "../types";
import { DetailItem, formatCurrency, formatDateTime, purchaseStatusLabel, PurchaseStatusBadge, ReceiveStatusBadge } from "./purchaseDisplay";

type SelectOption = {
  value: number;
  label: string;
};

type PurchaseRequestModalGroup = {
  selectedRequest: PurchaseRequest | null;
  setSelectedRequest: Dispatch<SetStateAction<PurchaseRequest | null>>;
  cancelingRequest: PurchaseRequest | null;
  setCancelingRequest: Dispatch<SetStateAction<PurchaseRequest | null>>;
  cancelReason: string;
  setCancelReason: Dispatch<SetStateAction<string>>;
  cancelReasonReady: boolean;
  cancelRequestPending: boolean;
  onCancelPurchase: (event: FormEvent<HTMLFormElement>) => void;
};

type PurchaseOrderModalGroup = {
  selectedOrderId: number | null;
  setSelectedOrderId: Dispatch<SetStateAction<number | null>>;
  selectedOrder: PurchaseOrder | undefined;
  selectedOrderError: unknown;
  selectedOrderLoading: boolean;
  receivingOrder: PurchaseOrder | null;
  setReceivingOrder: Dispatch<SetStateAction<PurchaseOrder | null>>;
  setReceiveWarehouseId: Dispatch<SetStateAction<number>>;
  selectedReceiveWarehouseId: number;
  warehouseOptions: SelectOption[];
  receiveOrderPending: boolean;
  onReceiveOrder: (event: FormEvent<HTMLFormElement>) => void;
};

type CustomerModalGroup = {
  customerCreateOpen: boolean;
  onCloseCustomerCreate: () => void;
  customerForm: CustomerCreatePayload;
  setCustomerForm: Dispatch<SetStateAction<CustomerCreatePayload>>;
  customerFormReady: boolean;
  createCustomerPending: boolean;
  onCreateCustomer: (event: FormEvent<HTMLFormElement>) => void;
  editingCustomer: CustomerEditForm | null;
  setEditingCustomer: Dispatch<SetStateAction<CustomerEditForm | null>>;
  updateCustomerPending: boolean;
  onUpdateCustomer: (event: FormEvent<HTMLFormElement>) => void;
};

type SupplierModalGroup = {
  supplierCreateOpen: boolean;
  onCloseSupplierCreate: () => void;
  supplierForm: SupplierCreatePayload;
  setSupplierForm: Dispatch<SetStateAction<SupplierCreatePayload>>;
  supplierFormReady: boolean;
  createSupplierPending: boolean;
  onCreateSupplier: (event: FormEvent<HTMLFormElement>) => void;
  editingSupplier: SupplierEditForm | null;
  setEditingSupplier: Dispatch<SetStateAction<SupplierEditForm | null>>;
  updateSupplierPending: boolean;
  onUpdateSupplier: (event: FormEvent<HTMLFormElement>) => void;
};

type PurchaseModalsProps = {
  request: PurchaseRequestModalGroup;
  order: PurchaseOrderModalGroup;
  customer: CustomerModalGroup;
  supplier: SupplierModalGroup;
};

export function PurchaseModals({ request, order, customer, supplier }: PurchaseModalsProps) {
  const {
  selectedRequest,
  setSelectedRequest,
  cancelingRequest,
  setCancelingRequest,
  cancelReason,
  setCancelReason,
  cancelReasonReady,
  cancelRequestPending,
  onCancelPurchase
  } = request;
  const {
  selectedOrderId,
  setSelectedOrderId,
  selectedOrder,
  selectedOrderError,
  selectedOrderLoading,
  receivingOrder,
  setReceivingOrder,
  setReceiveWarehouseId,
  selectedReceiveWarehouseId,
  warehouseOptions,
  receiveOrderPending,
  onReceiveOrder
  } = order;
  const {
  customerCreateOpen,
  onCloseCustomerCreate,
  customerForm,
  setCustomerForm,
  customerFormReady,
  createCustomerPending,
  onCreateCustomer,
  editingCustomer,
  setEditingCustomer,
  updateCustomerPending,
  onUpdateCustomer
  } = customer;
  const {
  supplierCreateOpen,
  onCloseSupplierCreate,
  supplierForm,
  setSupplierForm,
  supplierFormReady,
  createSupplierPending,
  onCreateSupplier,
  editingSupplier,
  setEditingSupplier,
  updateSupplierPending,
  onUpdateSupplier
  } = supplier;

  return (
    <>
      <Modal
        open={selectedRequest !== null}
        title="구매 요청 상세"
        description="구매 요청의 공급사, 품목, 금액, 요청 메모를 확인합니다."
        footer={<Button type="button" variant="secondary" onClick={() => setSelectedRequest(null)}>닫기</Button>}
        onClose={() => setSelectedRequest(null)}
      >
        {selectedRequest ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <div>
                <p className="text-sm font-bold text-axis-ink">{selectedRequest.requestNo}</p>
                <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(selectedRequest.requestedAt)} · {selectedRequest.requestedBy}</p>
              </div>
              <PurchaseStatusBadge status={selectedRequest.status} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="공급사" value={`${selectedRequest.supplier.code} · ${selectedRequest.supplier.name}`} />
              <DetailItem label="품목" value={`${selectedRequest.item.sku} · ${selectedRequest.item.name}`} />
              <DetailItem label="수량" value={`${selectedRequest.quantity.toLocaleString("ko-KR")} ${selectedRequest.item.unit}`} />
              <DetailItem label="단가" value={formatCurrency(selectedRequest.unitPrice)} />
              <DetailItem label="합계 금액" value={formatCurrency(selectedRequest.totalAmount)} />
              <DetailItem label="품목 분류" value={selectedRequest.item.category} />
              <DetailItem label="처리자" value={selectedRequest.processedBy ?? "아직 처리되지 않음"} />
              <DetailItem label="처리일" value={selectedRequest.processedAt ? formatDateTime(selectedRequest.processedAt) : "아직 처리되지 않음"} />
              {selectedRequest.status === "CANCELED" ? (
                <DetailItem label="반려 사유" value={selectedRequest.processedReason?.trim() || "등록된 반려 사유가 없습니다."} />
              ) : null}
            </div>

            <div className="rounded-lg border border-axis-border px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">요청 메모</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-axis-muted">{selectedRequest.memo?.trim() || "등록된 메모가 없습니다."}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={cancelingRequest !== null}
        title="구매 요청 반려"
        description="반려 사유는 구매 요청 상세와 운영 이력에 함께 남습니다."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCancelingRequest(null);
                setCancelReason("");
              }}
            >
              취소
            </Button>
            <Button disabled={!cancelReasonReady || cancelRequestPending} type="submit" form="purchase-request-cancel-form">
              {cancelRequestPending ? "반려 중" : "반려"}
            </Button>
          </>
        }
        onClose={() => {
          setCancelingRequest(null);
          setCancelReason("");
        }}
      >
        {cancelingRequest ? (
          <form id="purchase-request-cancel-form" className="space-y-4" onSubmit={onCancelPurchase}>
            <div className="rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">{cancelingRequest.requestNo}</p>
              <p className="mt-1 text-xs font-semibold text-axis-muted">
                {cancelingRequest.supplier.name} · {cancelingRequest.item.name} · {formatCurrency(cancelingRequest.totalAmount)}
              </p>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-axis-ink">반려 사유</span>
              <textarea
                className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="예: 예산 범위 초과로 이번 요청은 반려합니다."
                required
              />
            </label>
          </form>
        ) : null}
      </Modal>

      <Modal
        open={selectedOrderId !== null}
        title="구매 발주 상세"
        description="발주, 연결된 구매 요청, 입고 처리 정보를 함께 확인합니다."
        footer={<Button type="button" variant="secondary" onClick={() => setSelectedOrderId(null)}>닫기</Button>}
        onClose={() => setSelectedOrderId(null)}
      >
        {selectedOrderLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">구매 발주 상세 정보를 불러오는 중입니다.</p>
        ) : selectedOrderError ? (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{getErrorMessage(selectedOrderError)}</p>
        ) : selectedOrder ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <div>
                <p className="text-sm font-bold text-axis-ink">{selectedOrder.orderNo}</p>
                <p className="mt-1 text-xs font-semibold text-axis-muted">{formatDateTime(selectedOrder.orderedAt)} · {selectedOrder.orderedBy}</p>
              </div>
              <ReceiveStatusBadge received={selectedOrder.receivedAt !== null} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="연결 요청" value={selectedOrder.request.requestNo} />
              <DetailItem label="요청 상태" value={purchaseStatusLabel(selectedOrder.request.status)} />
              <DetailItem label="공급사" value={`${selectedOrder.request.supplier.code} · ${selectedOrder.request.supplier.name}`} />
              <DetailItem label="공급사 담당" value={`${selectedOrder.request.supplier.contactName} · ${selectedOrder.request.supplier.phone}`} />
              <DetailItem label="품목" value={`${selectedOrder.request.item.sku} · ${selectedOrder.request.item.name}`} />
              <DetailItem label="품목 분류" value={selectedOrder.request.item.category} />
              <DetailItem label="수량" value={`${selectedOrder.request.quantity.toLocaleString("ko-KR")} ${selectedOrder.request.item.unit}`} />
              <DetailItem label="단가" value={formatCurrency(selectedOrder.request.unitPrice)} />
              <DetailItem label="합계 금액" value={formatCurrency(selectedOrder.totalAmount)} />
              <DetailItem label="입고 창고" value={selectedOrder.receivedWarehouse?.name ?? "아직 입고되지 않음"} />
              <DetailItem label="입고 처리" value={selectedOrder.receivedAt ? `${formatDateTime(selectedOrder.receivedAt)} · ${selectedOrder.receivedBy}` : "아직 입고되지 않음"} />
              <DetailItem label="요청 처리" value={selectedOrder.request.processedAt ? `${formatDateTime(selectedOrder.request.processedAt)} · ${selectedOrder.request.processedBy}` : "아직 처리되지 않음"} />
            </div>

            <div className="rounded-lg border border-axis-border px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">요청 메모</p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-axis-muted">{selectedOrder.request.memo?.trim() || "등록된 메모가 없습니다."}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={receivingOrder !== null}
        title="구매 발주 입고 처리"
        description="발주 품목을 입고할 창고를 선택하면 현재고와 재고 이동 이력이 함께 반영됩니다."
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setReceivingOrder(null);
                setReceiveWarehouseId(0);
              }}
            >
              취소
            </Button>
            <Button disabled={selectedReceiveWarehouseId <= 0 || receiveOrderPending} type="submit" form="purchase-order-receive-form">
              {receiveOrderPending ? "처리 중" : "입고 처리"}
            </Button>
          </>
        }
        onClose={() => {
          setReceivingOrder(null);
          setReceiveWarehouseId(0);
        }}
      >
        {receivingOrder ? (
          <form id="purchase-order-receive-form" className="space-y-4" onSubmit={onReceiveOrder}>
            <div className="rounded-lg border border-axis-border bg-axis-bg px-4 py-3">
              <p className="text-sm font-bold text-axis-ink">{receivingOrder.orderNo}</p>
              <p className="mt-1 text-xs font-semibold text-axis-muted">{receivingOrder.request.requestNo} · {receivingOrder.request.supplier.name}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="품목" value={`${receivingOrder.request.item.sku} · ${receivingOrder.request.item.name}`} />
              <DetailItem label="입고 수량" value={`${receivingOrder.request.quantity.toLocaleString("ko-KR")} ${receivingOrder.request.item.unit}`} />
            </div>
            <SelectField
              label="입고 창고"
              value={selectedReceiveWarehouseId}
              options={warehouseOptions}
              onChange={setReceiveWarehouseId}
            />
          </form>
        ) : null}
      </Modal>

      <Modal
        open={customerCreateOpen}
        title="고객사 등록"
        description="판매 업무에서 사용할 고객 거래처 기준 정보를 등록합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onCloseCustomerCreate}>취소</Button>
            <Button disabled={!customerFormReady || createCustomerPending} type="submit" form="customer-create-form">
              {createCustomerPending ? "등록 중" : "등록"}
            </Button>
          </>
        }
        onClose={onCloseCustomerCreate}
      >
        <form id="customer-create-form" className="grid gap-4 md:grid-cols-2" onSubmit={onCreateCustomer}>
          <TextField
            label="고객사 코드"
            value={customerForm.code}
            onChange={(event) => setCustomerForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="AX-CUS-003"
            required
          />
          <TextField
            label="고객사명"
            value={customerForm.name}
            onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="신규 고객사"
            required
          />
          <TextField
            label="사업자등록번호"
            value={customerForm.businessNumber}
            onChange={(event) => setCustomerForm((current) => ({ ...current, businessNumber: event.target.value }))}
            placeholder="201-88-00003"
            required
          />
          <TextField
            label="담당자"
            value={customerForm.contactName}
            onChange={(event) => setCustomerForm((current) => ({ ...current, contactName: event.target.value }))}
            placeholder="홍고객"
            required
          />
          <TextField
            label="연락처"
            value={customerForm.phone}
            onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="02-4000-3000"
            required
          />
          <TextField
            label="이메일"
            type="email"
            value={customerForm.email}
            onChange={(event) => setCustomerForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="customer@axis.local"
            required
          />
        </form>
      </Modal>

      <Modal
        open={supplierCreateOpen}
        title="공급사 등록"
        description="구매 요청에서 사용할 공급 거래처 기준 정보를 등록합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={onCloseSupplierCreate}>취소</Button>
            <Button disabled={!supplierFormReady || createSupplierPending} type="submit" form="supplier-create-form">
              {createSupplierPending ? "등록 중" : "등록"}
            </Button>
          </>
        }
        onClose={onCloseSupplierCreate}
      >
        <form id="supplier-create-form" className="grid gap-4 md:grid-cols-2" onSubmit={onCreateSupplier}>
          <TextField
            label="공급사 코드"
            value={supplierForm.code}
            onChange={(event) => setSupplierForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="AX-SUP-003"
            required
          />
          <TextField
            label="공급사명"
            value={supplierForm.name}
            onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="구매 파트너"
            required
          />
          <TextField
            label="사업자등록번호"
            value={supplierForm.businessNumber}
            onChange={(event) => setSupplierForm((current) => ({ ...current, businessNumber: event.target.value }))}
            placeholder="101-88-00003"
            required
          />
          <TextField
            label="담당자"
            value={supplierForm.contactName}
            onChange={(event) => setSupplierForm((current) => ({ ...current, contactName: event.target.value }))}
            placeholder="홍담당"
            required
          />
          <TextField
            label="연락처"
            value={supplierForm.phone}
            onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="02-3000-3000"
            required
          />
          <TextField
            label="이메일"
            type="email"
            value={supplierForm.email}
            onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="partner@axis.local"
            required
          />
        </form>
      </Modal>

      <Modal
        open={editingCustomer !== null}
        title="고객사 정보 수정"
        description="고객 거래처의 기본 정보와 사용 상태를 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingCustomer(null)}>취소</Button>
            <Button disabled={updateCustomerPending} type="submit" form="customer-edit-form">{updateCustomerPending ? "저장 중" : "저장"}</Button>
          </>
        }
        onClose={() => setEditingCustomer(null)}
      >
        {editingCustomer ? (
          <form id="customer-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={onUpdateCustomer}>
            <TextField label="고객사명" value={editingCustomer.name} onChange={(event) => setEditingCustomer((current) => (current ? { ...current, name: event.target.value } : current))} required />
            <TextField label="사업자등록번호" value={editingCustomer.businessNumber} onChange={(event) => setEditingCustomer((current) => (current ? { ...current, businessNumber: event.target.value } : current))} required />
            <TextField label="담당자" value={editingCustomer.contactName} onChange={(event) => setEditingCustomer((current) => (current ? { ...current, contactName: event.target.value } : current))} required />
            <TextField label="연락처" value={editingCustomer.phone} onChange={(event) => setEditingCustomer((current) => (current ? { ...current, phone: event.target.value } : current))} required />
            <TextField label="이메일" type="email" value={editingCustomer.email} onChange={(event) => setEditingCustomer((current) => (current ? { ...current, email: event.target.value } : current))} required />
            <SelectField
              label="상태"
              value={editingCustomer.active ? "ACTIVE" : "INACTIVE"}
              options={[
                { value: "ACTIVE", label: "사용" },
                { value: "INACTIVE", label: "비활성" }
              ]}
              onChange={(status) => setEditingCustomer((current) => (current ? { ...current, active: status === "ACTIVE" } : current))}
            />
          </form>
        ) : null}
      </Modal>

      <Modal
        open={editingSupplier !== null}
        title="공급사 정보 수정"
        description="공급 거래처의 기본 정보와 사용 상태를 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingSupplier(null)}>취소</Button>
            <Button disabled={updateSupplierPending} type="submit" form="supplier-edit-form">{updateSupplierPending ? "저장 중" : "저장"}</Button>
          </>
        }
        onClose={() => setEditingSupplier(null)}
      >
        {editingSupplier ? (
          <form id="supplier-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={onUpdateSupplier}>
            <TextField label="공급사명" value={editingSupplier.name} onChange={(event) => setEditingSupplier((current) => (current ? { ...current, name: event.target.value } : current))} required />
            <TextField label="사업자등록번호" value={editingSupplier.businessNumber} onChange={(event) => setEditingSupplier((current) => (current ? { ...current, businessNumber: event.target.value } : current))} required />
            <TextField label="담당자" value={editingSupplier.contactName} onChange={(event) => setEditingSupplier((current) => (current ? { ...current, contactName: event.target.value } : current))} required />
            <TextField label="연락처" value={editingSupplier.phone} onChange={(event) => setEditingSupplier((current) => (current ? { ...current, phone: event.target.value } : current))} required />
            <TextField label="이메일" type="email" value={editingSupplier.email} onChange={(event) => setEditingSupplier((current) => (current ? { ...current, email: event.target.value } : current))} required />
            <SelectField
              label="상태"
              value={editingSupplier.active ? "ACTIVE" : "INACTIVE"}
              options={[
                { value: "ACTIVE", label: "사용" },
                { value: "INACTIVE", label: "비활성" }
              ]}
              onChange={(status) => setEditingSupplier((current) => (current ? { ...current, active: status === "ACTIVE" } : current))}
            />
          </form>
        ) : null}
      </Modal>
    </>
  );
}
