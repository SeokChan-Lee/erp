import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, PencilLine, Plus, Search, Send, X } from "lucide-react";

import { useItemsQuery } from "../inventory/api/inventoryApi";
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
  useApprovePurchaseRequestMutation,
  useCancelPurchaseRequestMutation,
  useCreatePurchaseRequestMutation,
  useCreateSupplierMutation,
  usePurchaseRequestsQuery,
  useSuppliersQuery,
  useUpdateSupplierMutation
} from "./api/purchaseApi";
import type {
  PurchaseRequestCreatePayload,
  PurchaseRequestQueryParams,
  PurchaseRequestStatusFilter,
  Supplier,
  SupplierCreatePayload,
  SupplierQueryParams,
  SupplierStatusFilter,
  SupplierUpdatePayload
} from "./api/dto";

const PAGE_SIZE = 20;

const initialSupplierForm: SupplierCreatePayload = {
  code: "",
  name: "",
  businessNumber: "",
  contactName: "",
  phone: "",
  email: ""
};

const initialPurchaseForm: PurchaseRequestCreatePayload = {
  supplierId: 0,
  itemId: 0,
  quantity: 1,
  unitPrice: 1,
  memo: ""
};

type SupplierEditForm = SupplierUpdatePayload & {
  id: number;
};

export function PurchaseView({ permissions = [] }: { permissions?: string[] }) {
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierSearchInput, setSupplierSearchInput] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatus, setSupplierStatus] = useState<SupplierStatusFilter>("ALL");
  const [requestPage, setRequestPage] = useState(1);
  const [requestSearchInput, setRequestSearchInput] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState<PurchaseRequestStatusFilter>("ALL");
  const [supplierCreateOpen, setSupplierCreateOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState<SupplierCreatePayload>(initialSupplierForm);
  const [editingSupplier, setEditingSupplier] = useState<SupplierEditForm | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseRequestCreatePayload>(initialPurchaseForm);
  const [toastMessage, setToastMessage] = useState("");

  const canCreateSupplier = permissions.includes("SUPPLIER_CREATE");
  const canUpdateSupplier = permissions.includes("SUPPLIER_UPDATE");
  const canCreatePurchase = permissions.includes("PURCHASE_CREATE");
  const canApprovePurchase = permissions.includes("PURCHASE_APPROVE");
  const canCancelPurchase = permissions.includes("PURCHASE_UPDATE");

  const supplierParams = useMemo<SupplierQueryParams>(
    () => ({
      page: supplierPage,
      pageSize: PAGE_SIZE,
      search: supplierSearch,
      status: supplierStatus
    }),
    [supplierPage, supplierSearch, supplierStatus]
  );
  const allSupplierParams = useMemo<SupplierQueryParams>(
    () => ({
      page: 1,
      pageSize: 100,
      search: "",
      status: "ACTIVE"
    }),
    []
  );
  const requestParams = useMemo<PurchaseRequestQueryParams>(
    () => ({
      page: requestPage,
      pageSize: PAGE_SIZE,
      search: requestSearch,
      status: requestStatus
    }),
    [requestPage, requestSearch, requestStatus]
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

  const { data: suppliersPage, error: suppliersError, isLoading: suppliersLoading } = useSuppliersQuery(supplierParams);
  const { data: activeSuppliersPage, error: activeSuppliersError } = useSuppliersQuery(allSupplierParams);
  const { data: requestsPage, error: requestsError, isLoading: requestsLoading } = usePurchaseRequestsQuery(requestParams);
  const { data: itemsPage, error: itemsError } = useItemsQuery(itemParams);
  const createSupplier = useCreateSupplierMutation();
  const updateSupplier = useUpdateSupplierMutation();
  const createRequest = useCreatePurchaseRequestMutation();
  const approveRequest = useApprovePurchaseRequestMutation();
  const cancelRequest = useCancelPurchaseRequestMutation();

  const suppliers = suppliersPage?.content ?? [];
  const totalSuppliers = suppliersPage?.totalItems ?? 0;
  const activeSuppliers = activeSuppliersPage?.content ?? [];
  const items = itemsPage?.content ?? [];
  const requests = requestsPage?.content ?? [];
  const totalRequests = requestsPage?.totalItems ?? 0;
  const selectedSupplierId = purchaseForm.supplierId || activeSuppliers[0]?.id || 0;
  const selectedItemId = purchaseForm.itemId || items[0]?.id || 0;
  const pageError = suppliersError || activeSuppliersError || requestsError || itemsError || createSupplier.error || updateSupplier.error || createRequest.error || approveRequest.error || cancelRequest.error;
  const supplierStatusOptions = [
    { value: "ALL" as SupplierStatusFilter, label: "전체" },
    { value: "ACTIVE" as SupplierStatusFilter, label: "사용" },
    { value: "INACTIVE" as SupplierStatusFilter, label: "비활성" }
  ];
  const requestStatusOptions = [
    { value: "ALL" as PurchaseRequestStatusFilter, label: "전체" },
    { value: "REQUESTED" as PurchaseRequestStatusFilter, label: "요청" },
    { value: "APPROVED" as PurchaseRequestStatusFilter, label: "승인" },
    { value: "CANCELED" as PurchaseRequestStatusFilter, label: "취소" }
  ];
  const supplierOptions = activeSuppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.code} · ${supplier.name}` }));
  const itemOptions = items.map((item) => ({ value: item.id, label: `${item.sku} · ${item.name}` }));
  const supplierFormReady = Object.values(supplierForm).every((value) => value.trim().length > 0);
  const purchaseFormReady = selectedSupplierId > 0 && selectedItemId > 0 && purchaseForm.quantity > 0 && purchaseForm.unitPrice > 0;

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  const handleCreateSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supplierFormReady) return;

    createSupplier.mutate(
      {
        code: supplierForm.code.trim(),
        name: supplierForm.name.trim(),
        businessNumber: supplierForm.businessNumber.trim(),
        contactName: supplierForm.contactName.trim(),
        phone: supplierForm.phone.trim(),
        email: supplierForm.email.trim()
      },
      {
        onSuccess: () => {
          setSupplierForm(initialSupplierForm);
          setSupplierCreateOpen(false);
          setToastMessage("공급사가 등록되었습니다.");
        }
      }
    );
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier({
      id: supplier.id,
      name: supplier.name,
      businessNumber: supplier.businessNumber,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      active: supplier.active
    });
  };

  const handleUpdateSupplier = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingSupplier) return;

    updateSupplier.mutate(
      {
        supplierId: editingSupplier.id,
        payload: {
          name: editingSupplier.name.trim(),
          businessNumber: editingSupplier.businessNumber.trim(),
          contactName: editingSupplier.contactName.trim(),
          phone: editingSupplier.phone.trim(),
          email: editingSupplier.email.trim(),
          active: editingSupplier.active
        }
      },
      {
        onSuccess: () => {
          setEditingSupplier(null);
          setToastMessage("공급사 정보가 수정되었습니다.");
        }
      }
    );
  };

  const handleCreatePurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!purchaseFormReady) return;

    createRequest.mutate(
      {
        supplierId: selectedSupplierId,
        itemId: selectedItemId,
        quantity: purchaseForm.quantity,
        unitPrice: purchaseForm.unitPrice,
        memo: purchaseForm.memo.trim()
      },
      {
        onSuccess: () => {
          setPurchaseForm({ ...initialPurchaseForm, supplierId: selectedSupplierId, itemId: selectedItemId });
          setToastMessage("구매 요청이 등록되었습니다.");
        }
      }
    );
  };

  const handleApprovePurchase = (requestId: number) => {
    approveRequest.mutate(requestId, {
      onSuccess: () => setToastMessage("구매 요청이 승인되었습니다.")
    });
  };

  const handleCancelPurchase = (requestId: number) => {
    cancelRequest.mutate(requestId, {
      onSuccess: () => setToastMessage("구매 요청이 취소되었습니다.")
    });
  };

  const handleCloseSupplierCreate = () => {
    setSupplierCreateOpen(false);
    setSupplierForm(initialSupplierForm);
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <Toast open={toastMessage.length > 0} message={toastMessage} variant="success" onClose={() => setToastMessage("")} />

      <Panel
        title="공급사 목록"
        description="구매 업무에서 사용할 공급 거래처를 관리합니다."
        action={
          canCreateSupplier ? (
            <Button className="gap-2" type="button" onClick={() => setSupplierCreateOpen(true)}>
              <Plus size={17} strokeWidth={2.2} />
              공급사 등록
            </Button>
          ) : null
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <TextField
            label="검색"
            placeholder="코드, 공급사명, 사업자번호, 담당자"
            value={supplierSearchInput}
            leftIcon={<Search size={17} strokeWidth={2.2} />}
            onChange={(event) => setSupplierSearchInput(event.target.value)}
            onEnter={() => {
              setSupplierSearch(supplierSearchInput.trim());
              setSupplierPage(1);
            }}
          />
          <SelectField
            label="상태"
            value={supplierStatus}
            options={supplierStatusOptions}
            onChange={(status) => {
              setSupplierStatus(status);
              setSupplierPage(1);
            }}
          />
          <Button
            className="mt-7 h-11"
            type="button"
            variant="secondary"
            onClick={() => {
              setSupplierSearch(supplierSearchInput.trim());
              setSupplierPage(1);
            }}
          >
            검색 적용
          </Button>
        </div>

        {suppliersLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">공급사 목록을 불러오는 중입니다.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">공급사</th>
                  <th className="px-4 py-3">사업자등록번호</th>
                  <th className="px-4 py-3">담당자</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className={supplier.active ? "" : "bg-axis-bg/60"}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-axis-ink">{supplier.name}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{supplier.code} · {supplier.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{supplier.businessNumber}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{supplier.contactName}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{supplier.phone}</td>
                    <td className="px-4 py-4"><StatusBadge active={supplier.active} /></td>
                    <td className="px-4 py-4">
                      {canUpdateSupplier ? (
                        <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => handleEditSupplier(supplier)}>
                          <PencilLine size={14} strokeWidth={2.2} />
                          수정
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-axis-muted">조회 전용</span>
                      )}
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>조건에 맞는 공급사가 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={supplierPage} pageSize={PAGE_SIZE} totalItems={totalSuppliers} onPageChange={setSupplierPage} />
          </div>
        )}
      </Panel>

      <div className="grid gap-6">
        {canCreatePurchase ? (
          <Panel title="구매 요청 등록" description="공급사와 품목을 선택해 구매 요청 기준 데이터를 만듭니다.">
            <form className="space-y-4" onSubmit={handleCreatePurchase}>
              <SearchableSelectField
                label="공급사"
                value={selectedSupplierId}
                options={supplierOptions}
                placeholder="공급사 선택"
                searchPlaceholder="공급사 코드 또는 이름 검색"
                disabled={supplierOptions.length === 0}
                onChange={(supplierId) => setPurchaseForm((current) => ({ ...current, supplierId }))}
              />
              <SearchableSelectField
                label="품목"
                value={selectedItemId}
                options={itemOptions}
                placeholder="품목 선택"
                searchPlaceholder="품목 코드 또는 이름 검색"
                disabled={itemOptions.length === 0}
                onChange={(itemId) => setPurchaseForm((current) => ({ ...current, itemId }))}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="수량" min={1} type="number" value={purchaseForm.quantity} onChange={(event) => setPurchaseForm((current) => ({ ...current, quantity: Number(event.target.value) }))} required />
                <TextField label="단가" min={1} type="number" value={purchaseForm.unitPrice} onChange={(event) => setPurchaseForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} required />
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-axis-ink">요청 메모</span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted"
                  value={purchaseForm.memo}
                  onChange={(event) => setPurchaseForm((current) => ({ ...current, memo: event.target.value }))}
                  placeholder="예: 신규 입사자 장비 확보"
                />
              </label>
              <Button className="h-11 w-full gap-2" disabled={!purchaseFormReady || createRequest.isPending}>
                <Send size={17} strokeWidth={2.2} />
                {createRequest.isPending ? "등록 중" : "구매 요청"}
              </Button>
            </form>
          </Panel>
        ) : null}

        <Panel title="구매 요청 목록" description="등록된 구매 요청과 공급사, 품목, 금액을 확인합니다.">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <TextField
              label="검색"
              placeholder="요청번호, 공급사, 품목, 메모"
              value={requestSearchInput}
              leftIcon={<Search size={17} strokeWidth={2.2} />}
              onChange={(event) => setRequestSearchInput(event.target.value)}
              onEnter={() => {
                setRequestSearch(requestSearchInput.trim());
                setRequestPage(1);
              }}
            />
            <SelectField
              label="상태"
              value={requestStatus}
              options={requestStatusOptions}
              onChange={(status) => {
                setRequestStatus(status);
                setRequestPage(1);
              }}
            />
            <Button
              className="mt-7 h-11"
              type="button"
              variant="secondary"
              onClick={() => {
                setRequestSearch(requestSearchInput.trim());
                setRequestPage(1);
              }}
            >
              검색 적용
            </Button>
          </div>

          {requestsLoading ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">구매 요청을 불러오는 중입니다.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-axis-border">
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
                        {request.status === "REQUESTED" && (canApprovePurchase || canCancelPurchase) ? (
                          <div className="flex flex-wrap gap-2">
                            {canApprovePurchase ? (
                              <Button
                                className="h-8 gap-1.5 px-3 text-xs"
                                disabled={approveRequest.isPending || cancelRequest.isPending}
                                type="button"
                                variant="secondary"
                                onClick={() => handleApprovePurchase(request.id)}
                              >
                                <Check size={14} strokeWidth={2.2} />
                                승인
                              </Button>
                            ) : null}
                            {canCancelPurchase ? (
                              <Button
                                className="h-8 gap-1.5 px-3 text-xs text-rose-700"
                                disabled={approveRequest.isPending || cancelRequest.isPending}
                                type="button"
                                variant="secondary"
                                onClick={() => handleCancelPurchase(request.id)}
                              >
                                <X size={14} strokeWidth={2.2} />
                                취소
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-axis-muted">처리 완료</span>
                        )}
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
              <Pagination page={requestPage} pageSize={PAGE_SIZE} totalItems={totalRequests} onPageChange={setRequestPage} />
            </div>
          )}
        </Panel>
      </div>

      <Modal
        open={supplierCreateOpen}
        title="공급사 등록"
        description="구매 요청에서 사용할 공급 거래처 기준 정보를 등록합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={handleCloseSupplierCreate}>취소</Button>
            <Button disabled={!supplierFormReady || createSupplier.isPending} type="submit" form="supplier-create-form">
              {createSupplier.isPending ? "등록 중" : "등록"}
            </Button>
          </>
        }
        onClose={handleCloseSupplierCreate}
      >
        <form id="supplier-create-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSupplier}>
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
        open={editingSupplier !== null}
        title="공급사 정보 수정"
        description="공급 거래처의 기본 정보와 사용 상태를 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingSupplier(null)}>취소</Button>
            <Button disabled={updateSupplier.isPending} type="submit" form="supplier-edit-form">{updateSupplier.isPending ? "저장 중" : "저장"}</Button>
          </>
        }
        onClose={() => setEditingSupplier(null)}
      >
        {editingSupplier ? (
          <form id="supplier-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateSupplier}>
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
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", active ? "bg-emerald-50 text-emerald-700" : "bg-axis-bg text-axis-muted"].join(" ")}>
      {active ? "사용" : "비활성"}
    </span>
  );
}

function PurchaseStatusBadge({ status }: { status: string }) {
  const label = status === "APPROVED" ? "승인" : status === "CANCELED" ? "취소" : "요청";
  const className = status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : status === "CANCELED" ? "bg-axis-bg text-axis-muted" : "bg-blue-50 text-blue-700";

  return <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", className].join(" ")}>{label}</span>;
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
