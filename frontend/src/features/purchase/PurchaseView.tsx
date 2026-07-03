import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Eye, PencilLine, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useItemsQuery, useWarehousesQuery } from "../inventory/api/inventoryApi";
import type { ItemQueryParams } from "../inventory/api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { ResetButton } from "../../shared/ui/ResetButton";
import { SelectField } from "../../shared/ui/SelectField";
import { TableFrame } from "../../shared/ui/TableFrame";
import { TextField } from "../../shared/ui/TextField";
import { Toast } from "../../shared/ui/Toast";
import { PurchaseModals } from "./components/PurchaseModals";
import { PurchaseOrderListPanel } from "./components/PurchaseOrderListPanel";
import { PurchaseRequestCreatePanel } from "./components/PurchaseRequestCreatePanel";
import { formatCurrency, formatDateTime, PurchaseStatusBadge, StatusBadge } from "./components/purchaseDisplay";
import {
  useApprovePurchaseRequestMutation,
  useCancelReceivePurchaseOrderMutation,
  useCancelPurchaseRequestMutation,
  useCreateCustomerMutation,
  useCreatePurchaseOrderMutation,
  useCreatePurchaseRequestMutation,
  useCreateSupplierMutation,
  useCustomersQuery,
  usePurchaseOrderQuery,
  usePurchaseOrdersQuery,
  usePurchaseRequestsQuery,
  useReceivePurchaseOrderMutation,
  useSuppliersQuery,
  useUpdateCustomerMutation,
  useUpdateSupplierMutation
} from "./api/purchaseApi";
import type {
  Customer,
  CustomerCreatePayload,
  CustomerQueryParams,
  CustomerStatusFilter,
  CustomerUpdatePayload,
  PurchaseOrder,
  PurchaseOrderQueryParams,
  PurchaseRequest,
  PurchaseRequestCreatePayload,
  PurchaseRequestQueryParams,
  PurchaseRequestStatusFilter,
  Supplier,
  SupplierCreatePayload,
  SupplierQueryParams,
  SupplierStatusFilter,
  SupplierUpdatePayload
} from "./api/dto";
import type { CustomerEditForm, PurchaseRequestForm, SupplierEditForm } from "./types";

const PAGE_SIZE = 20;

const initialSupplierForm: SupplierCreatePayload = {
  code: "",
  name: "",
  businessNumber: "",
  contactName: "",
  phone: "",
  email: ""
};

const initialCustomerForm: CustomerCreatePayload = {
  code: "",
  name: "",
  businessNumber: "",
  contactName: "",
  phone: "",
  email: ""
};

const initialPurchaseForm: PurchaseRequestForm = {
  supplierId: 0,
  itemId: 0,
  quantity: "",
  unitPrice: "",
  memo: ""
};

export function PurchaseView({ permissions = [] }: { permissions?: string[] }) {
  const [searchParams] = useSearchParams();
  const initialRequestSearch = searchParams.get("requestSearch") ?? "";
  const initialOrderSearch = searchParams.get("orderSearch") ?? "";
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState<CustomerStatusFilter>("ALL");
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierSearchInput, setSupplierSearchInput] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatus, setSupplierStatus] = useState<SupplierStatusFilter>("ALL");
  const [requestPage, setRequestPage] = useState(1);
  const [requestSearchInput, setRequestSearchInput] = useState(initialRequestSearch);
  const [requestSearch, setRequestSearch] = useState(initialRequestSearch);
  const [requestStatus, setRequestStatus] = useState<PurchaseRequestStatusFilter>("ALL");
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearchInput, setOrderSearchInput] = useState(initialOrderSearch);
  const [orderSearch, setOrderSearch] = useState(initialOrderSearch);
  const [orderFromDateInput, setOrderFromDateInput] = useState("");
  const [orderToDateInput, setOrderToDateInput] = useState("");
  const [orderFromDate, setOrderFromDate] = useState("");
  const [orderToDate, setOrderToDate] = useState("");
  const [customerCreateOpen, setCustomerCreateOpen] = useState(false);
  const [supplierCreateOpen, setSupplierCreateOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerCreatePayload>(initialCustomerForm);
  const [supplierForm, setSupplierForm] = useState<SupplierCreatePayload>(initialSupplierForm);
  const [editingCustomer, setEditingCustomer] = useState<CustomerEditForm | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<SupplierEditForm | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelingRequest, setCancelingRequest] = useState<PurchaseRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState(0);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseRequestForm>(initialPurchaseForm);
  const [toastMessage, setToastMessage] = useState("");

  const canReadCustomer = permissions.includes("CUSTOMER_READ");
  const canCreateCustomer = permissions.includes("CUSTOMER_CREATE");
  const canUpdateCustomer = permissions.includes("CUSTOMER_UPDATE");
  const canCreateSupplier = permissions.includes("SUPPLIER_CREATE");
  const canUpdateSupplier = permissions.includes("SUPPLIER_UPDATE");
  const canCreatePurchase = permissions.includes("PURCHASE_CREATE");
  const canApprovePurchase = permissions.includes("PURCHASE_APPROVE");
  const canCancelPurchase = permissions.includes("PURCHASE_UPDATE");

  const customerParams = useMemo<CustomerQueryParams>(
    () => ({
      page: customerPage,
      pageSize: PAGE_SIZE,
      search: customerSearch,
      status: customerStatus
    }),
    [customerPage, customerSearch, customerStatus]
  );
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
  const orderParams = useMemo<PurchaseOrderQueryParams>(
    () => ({
      page: orderPage,
      pageSize: PAGE_SIZE,
      search: orderSearch,
      fromDate: orderFromDate,
      toDate: orderToDate
    }),
    [orderPage, orderSearch, orderFromDate, orderToDate]
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

  const { data: customersPage, error: customersError, isLoading: customersLoading } = useCustomersQuery(customerParams, canReadCustomer);
  const { data: suppliersPage, error: suppliersError, isLoading: suppliersLoading } = useSuppliersQuery(supplierParams);
  const { data: activeSuppliersPage, error: activeSuppliersError } = useSuppliersQuery(allSupplierParams);
  const { data: requestsPage, error: requestsError, isLoading: requestsLoading } = usePurchaseRequestsQuery(requestParams);
  const { data: ordersPage, error: ordersError, isLoading: ordersLoading } = usePurchaseOrdersQuery(orderParams);
  const { data: selectedOrder, error: selectedOrderError, isLoading: selectedOrderLoading } = usePurchaseOrderQuery(selectedOrderId);
  const { data: itemsPage, error: itemsError } = useItemsQuery(itemParams);
  const { data: warehouses = [], error: warehousesError } = useWarehousesQuery();
  const createCustomer = useCreateCustomerMutation();
  const updateCustomer = useUpdateCustomerMutation();
  const createSupplier = useCreateSupplierMutation();
  const updateSupplier = useUpdateSupplierMutation();
  const createRequest = useCreatePurchaseRequestMutation();
  const approveRequest = useApprovePurchaseRequestMutation();
  const cancelRequest = useCancelPurchaseRequestMutation();
  const createOrder = useCreatePurchaseOrderMutation();
  const receiveOrder = useReceivePurchaseOrderMutation();
  const cancelReceiveOrder = useCancelReceivePurchaseOrderMutation();

  const customers = customersPage?.content ?? [];
  const totalCustomers = customersPage?.totalItems ?? 0;
  const suppliers = suppliersPage?.content ?? [];
  const totalSuppliers = suppliersPage?.totalItems ?? 0;
  const activeSuppliers = activeSuppliersPage?.content ?? [];
  const items = itemsPage?.content ?? [];
  const requests = requestsPage?.content ?? [];
  const totalRequests = requestsPage?.totalItems ?? 0;
  const orders = ordersPage?.content ?? [];
  const totalOrders = ordersPage?.totalItems ?? 0;
  const selectedSupplierId = purchaseForm.supplierId || activeSuppliers[0]?.id || 0;
  const selectedItemId = purchaseForm.itemId || items[0]?.id || 0;
  const pageError =
    customersError ||
    suppliersError ||
    activeSuppliersError ||
    requestsError ||
    ordersError ||
    itemsError ||
    warehousesError ||
    createCustomer.error ||
    updateCustomer.error ||
    createSupplier.error ||
    updateSupplier.error ||
    createRequest.error ||
    approveRequest.error ||
    cancelRequest.error ||
    createOrder.error ||
    receiveOrder.error ||
    cancelReceiveOrder.error;
  const customerStatusOptions = [
    { value: "ALL" as CustomerStatusFilter, label: "전체" },
    { value: "ACTIVE" as CustomerStatusFilter, label: "사용" },
    { value: "INACTIVE" as CustomerStatusFilter, label: "비활성" }
  ];
  const supplierStatusOptions = [
    { value: "ALL" as SupplierStatusFilter, label: "전체" },
    { value: "ACTIVE" as SupplierStatusFilter, label: "사용" },
    { value: "INACTIVE" as SupplierStatusFilter, label: "비활성" }
  ];
  const requestStatusOptions = [
    { value: "ALL" as PurchaseRequestStatusFilter, label: "전체" },
    { value: "REQUESTED" as PurchaseRequestStatusFilter, label: "요청" },
    { value: "APPROVED" as PurchaseRequestStatusFilter, label: "승인" },
    { value: "CANCELED" as PurchaseRequestStatusFilter, label: "반려" },
    { value: "ORDERED" as PurchaseRequestStatusFilter, label: "발주" }
  ];
  const supplierOptions = activeSuppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.code} · ${supplier.name}` }));
  const itemOptions = items.map((item) => ({ value: item.id, label: `${item.sku} · ${item.name}` }));
  const warehouseOptions = warehouses.map((warehouse) => ({ value: warehouse.id, label: `${warehouse.code} · ${warehouse.name}` }));
  const customerFormReady = Object.values(customerForm).every((value) => value.trim().length > 0);
  const supplierFormReady = Object.values(supplierForm).every((value) => value.trim().length > 0);
  const purchaseQuantity = Number(purchaseForm.quantity);
  const purchaseUnitPrice = Number(purchaseForm.unitPrice);
  const purchaseFormReady =
    selectedSupplierId > 0 &&
    selectedItemId > 0 &&
    purchaseForm.quantity.trim().length > 0 &&
    purchaseForm.unitPrice.trim().length > 0 &&
    purchaseQuantity > 0 &&
    purchaseUnitPrice > 0;
  const cancelReasonReady = cancelReason.trim().length > 0;
  const selectedReceiveWarehouseId = receiveWarehouseId || warehouses[0]?.id || 0;

  useEffect(() => {
    if (!toastMessage) return;

    const timerId = window.setTimeout(() => setToastMessage(""), 2600);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  const handleCreateCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customerFormReady) return;

    createCustomer.mutate(
      {
        code: customerForm.code.trim(),
        name: customerForm.name.trim(),
        businessNumber: customerForm.businessNumber.trim(),
        contactName: customerForm.contactName.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim()
      },
      {
        onSuccess: () => {
          setCustomerForm(initialCustomerForm);
          setCustomerCreateOpen(false);
          setToastMessage("고객사가 등록되었습니다.");
        }
      }
    );
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      businessNumber: customer.businessNumber,
      contactName: customer.contactName,
      phone: customer.phone,
      email: customer.email,
      active: customer.active
    });
  };

  const handleUpdateCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingCustomer) return;

    updateCustomer.mutate(
      {
        customerId: editingCustomer.id,
        payload: {
          name: editingCustomer.name.trim(),
          businessNumber: editingCustomer.businessNumber.trim(),
          contactName: editingCustomer.contactName.trim(),
          phone: editingCustomer.phone.trim(),
          email: editingCustomer.email.trim(),
          active: editingCustomer.active
        }
      },
      {
        onSuccess: () => {
          setEditingCustomer(null);
          setToastMessage("고객사 정보가 수정되었습니다.");
        }
      }
    );
  };

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
        quantity: purchaseQuantity,
        unitPrice: purchaseUnitPrice,
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

  const openCancelRequestModal = (request: PurchaseRequest) => {
    setCancelingRequest(request);
    setCancelReason("");
  };

  const handleCancelPurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelingRequest || !cancelReasonReady) return;

    cancelRequest.mutate(
      {
        requestId: cancelingRequest.id,
        payload: { reason: cancelReason.trim() }
      },
      {
        onSuccess: () => {
          setCancelingRequest(null);
          setCancelReason("");
          setToastMessage("구매 요청이 반려되었습니다.");
        }
      }
    );
  };

  const handleCreateOrder = (requestId: number) => {
    createOrder.mutate(requestId, {
      onSuccess: () => setToastMessage("구매 요청이 발주로 전환되었습니다.")
    });
  };

  const handleApplyOrderSearch = () => {
    setOrderSearch(orderSearchInput.trim());
    setOrderFromDate(orderFromDateInput);
    setOrderToDate(orderToDateInput);
    setOrderPage(1);
  };

  const openReceiveModal = (order: PurchaseOrder) => {
    setReceivingOrder(order);
    setReceiveWarehouseId(warehouses[0]?.id ?? 0);
  };

  const handleReceiveOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!receivingOrder || selectedReceiveWarehouseId <= 0) return;

    receiveOrder.mutate(
      {
        orderId: receivingOrder.id,
        payload: { warehouseId: selectedReceiveWarehouseId }
      },
      {
        onSuccess: () => {
          setReceivingOrder(null);
          setReceiveWarehouseId(0);
          setToastMessage("구매 발주 입고가 처리되었습니다.");
        }
      }
    );
  };

  const handleCancelReceiveOrder = (orderId: number) => {
    cancelReceiveOrder.mutate(orderId, {
      onSuccess: () => setToastMessage("구매 발주 입고가 취소되었습니다.")
    });
  };

  const handleCloseCustomerCreate = () => {
    setCustomerCreateOpen(false);
    setCustomerForm(initialCustomerForm);
  };

  const handleCloseSupplierCreate = () => {
    setSupplierCreateOpen(false);
    setSupplierForm(initialSupplierForm);
  };

  const resetCustomerFilters = () => {
    setCustomerSearchInput("");
    setCustomerSearch("");
    setCustomerStatus("ALL");
    setCustomerPage(1);
  };

  const resetSupplierFilters = () => {
    setSupplierSearchInput("");
    setSupplierSearch("");
    setSupplierStatus("ALL");
    setSupplierPage(1);
  };

  const resetRequestFilters = () => {
    setRequestSearchInput("");
    setRequestSearch("");
    setRequestStatus("ALL");
    setRequestPage(1);
  };

  const resetOrderFilters = () => {
    setOrderSearchInput("");
    setOrderSearch("");
    setOrderFromDateInput("");
    setOrderToDateInput("");
    setOrderFromDate("");
    setOrderToDate("");
    setOrderPage(1);
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <Toast open={toastMessage.length > 0} message={toastMessage} variant="success" onClose={() => setToastMessage("")} />

      {canReadCustomer ? (
        <Panel
          title="고객사 목록"
          description="판매 업무에서 사용할 고객 거래처 기준 정보를 관리합니다."
          action={
            canCreateCustomer ? (
              <Button className="gap-2" type="button" onClick={() => setCustomerCreateOpen(true)}>
                <Plus size={17} strokeWidth={2.2} />
                고객사 등록
              </Button>
            ) : null
          }
        >
          <div className="mb-4 grid min-w-0 items-end gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
            <TextField
              label="검색"
              placeholder="코드, 고객사명, 사업자번호, 담당자"
              value={customerSearchInput}
              leftIcon={<Search size={17} strokeWidth={2.2} />}
              onChange={(event) => setCustomerSearchInput(event.target.value)}
              onEnter={() => {
                setCustomerSearch(customerSearchInput.trim());
                setCustomerPage(1);
              }}
            />
            <SelectField
              label="상태"
              value={customerStatus}
              options={customerStatusOptions}
              onChange={(status) => {
                setCustomerStatus(status);
                setCustomerPage(1);
              }}
            />
            <Button
              className="h-11"
              type="button"
              variant="secondary"
              onClick={() => {
                setCustomerSearch(customerSearchInput.trim());
                setCustomerPage(1);
              }}
            >
              검색 적용
            </Button>
            <ResetButton onClick={resetCustomerFilters} />
          </div>

          {customersLoading ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">고객사 목록을 불러오는 중입니다.</p>
          ) : (
            <TableFrame>
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                  <tr>
                    <th className="px-4 py-3">고객사</th>
                    <th className="px-4 py-3">사업자등록번호</th>
                    <th className="px-4 py-3">담당자</th>
                    <th className="px-4 py-3">연락처</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-axis-border bg-white">
                  {customers.map((customer) => (
                    <tr key={customer.id} className={customer.active ? "" : "bg-axis-bg/60"}>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-axis-ink">{customer.name}</p>
                        <p className="mt-1 text-xs font-semibold text-axis-muted">{customer.code} · {customer.email}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{customer.businessNumber}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{customer.contactName}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{customer.phone}</td>
                      <td className="px-4 py-4"><StatusBadge active={customer.active} /></td>
                      <td className="px-4 py-4">
                        {canUpdateCustomer ? (
                          <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => handleEditCustomer(customer)}>
                            <PencilLine size={14} strokeWidth={2.2} />
                            수정
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-axis-muted">조회 전용</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>조건에 맞는 고객사가 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              <Pagination page={customerPage} pageSize={PAGE_SIZE} totalItems={totalCustomers} onPageChange={setCustomerPage} />
            </TableFrame>
          )}
        </Panel>
      ) : null}

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
        <div className="mb-4 grid min-w-0 items-end gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
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
            className="h-11"
            type="button"
            variant="secondary"
            onClick={() => {
              setSupplierSearch(supplierSearchInput.trim());
              setSupplierPage(1);
            }}
          >
            검색 적용
          </Button>
          <ResetButton onClick={resetSupplierFilters} />
        </div>

        {suppliersLoading ? (
          <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">공급사 목록을 불러오는 중입니다.</p>
        ) : (
          <TableFrame>
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
          </TableFrame>
        )}
      </Panel>

      <div className="grid min-w-0 gap-6">
        {canCreatePurchase ? (
          <PurchaseRequestCreatePanel
            form={purchaseForm}
            setForm={setPurchaseForm}
            selectedSupplierId={selectedSupplierId}
            selectedItemId={selectedItemId}
            supplierOptions={supplierOptions}
            itemOptions={itemOptions}
            formReady={purchaseFormReady}
            createPending={createRequest.isPending}
            onSubmit={handleCreatePurchase}
          />
        ) : null}

        <Panel title="구매 요청 목록" description="등록된 구매 요청과 공급사, 품목, 금액을 확인합니다.">
          <div className="mb-4 grid min-w-0 items-end gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
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
              className="h-11"
              type="button"
              variant="secondary"
              onClick={() => {
                setRequestSearch(requestSearchInput.trim());
                setRequestPage(1);
              }}
            >
              검색 적용
            </Button>
            <ResetButton onClick={resetRequestFilters} />
          </div>

          {requestsLoading ? (
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
                          <Button
                            className="h-8 gap-1.5 px-3 text-xs"
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye size={14} strokeWidth={2.2} />
                            상세
                          </Button>
                          {request.status === "REQUESTED" && (canApprovePurchase || canCancelPurchase) ? (
                            <>
                              {canApprovePurchase ? (
                                <Button
                                  className="h-8 gap-1.5 px-3 text-xs"
                                  disabled={approveRequest.isPending || cancelRequest.isPending || createOrder.isPending}
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
                                  disabled={approveRequest.isPending || cancelRequest.isPending || createOrder.isPending}
                                  type="button"
                                  variant="secondary"
                                  onClick={() => openCancelRequestModal(request)}
                                >
                                  <X size={14} strokeWidth={2.2} />
                                  반려
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                          {request.status === "APPROVED" && canCancelPurchase ? (
                            <Button
                              className="h-8 gap-1.5 px-3 text-xs"
                              disabled={approveRequest.isPending || cancelRequest.isPending || createOrder.isPending}
                              type="button"
                              variant="secondary"
                              onClick={() => handleCreateOrder(request.id)}
                            >
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
              <Pagination page={requestPage} pageSize={PAGE_SIZE} totalItems={totalRequests} onPageChange={setRequestPage} />
            </TableFrame>
          )}
        </Panel>

        <PurchaseOrderListPanel
          orders={orders}
          totalOrders={totalOrders}
          page={orderPage}
          pageSize={PAGE_SIZE}
          searchInput={orderSearchInput}
          fromDateInput={orderFromDateInput}
          toDateInput={orderToDateInput}
          loading={ordersLoading}
          canManageOrder={canCancelPurchase}
          receivePending={receiveOrder.isPending}
          cancelReceivePending={cancelReceiveOrder.isPending}
          warehouseCount={warehouses.length}
          onSearchInputChange={setOrderSearchInput}
          onFromDateInputChange={setOrderFromDateInput}
          onToDateInputChange={setOrderToDateInput}
          onApplySearch={handleApplyOrderSearch}
          onResetFilters={resetOrderFilters}
          onPageChange={setOrderPage}
          onSelectOrder={setSelectedOrderId}
          onOpenReceive={openReceiveModal}
          onCancelReceive={handleCancelReceiveOrder}
        />
      </div>

      <PurchaseModals
        selectedRequest={selectedRequest}
        setSelectedRequest={setSelectedRequest}
        cancelingRequest={cancelingRequest}
        setCancelingRequest={setCancelingRequest}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        cancelReasonReady={cancelReasonReady}
        cancelRequestPending={cancelRequest.isPending}
        onCancelPurchase={handleCancelPurchase}
        selectedOrderId={selectedOrderId}
        setSelectedOrderId={setSelectedOrderId}
        selectedOrder={selectedOrder}
        selectedOrderError={selectedOrderError}
        selectedOrderLoading={selectedOrderLoading}
        receivingOrder={receivingOrder}
        setReceivingOrder={setReceivingOrder}
        receiveWarehouseId={receiveWarehouseId}
        setReceiveWarehouseId={setReceiveWarehouseId}
        selectedReceiveWarehouseId={selectedReceiveWarehouseId}
        warehouseOptions={warehouseOptions}
        receiveOrderPending={receiveOrder.isPending}
        onReceiveOrder={handleReceiveOrder}
        customerCreateOpen={customerCreateOpen}
        onCloseCustomerCreate={handleCloseCustomerCreate}
        customerForm={customerForm}
        setCustomerForm={setCustomerForm}
        customerFormReady={customerFormReady}
        createCustomerPending={createCustomer.isPending}
        onCreateCustomer={handleCreateCustomer}
        supplierCreateOpen={supplierCreateOpen}
        onCloseSupplierCreate={handleCloseSupplierCreate}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        supplierFormReady={supplierFormReady}
        createSupplierPending={createSupplier.isPending}
        onCreateSupplier={handleCreateSupplier}
        editingCustomer={editingCustomer}
        setEditingCustomer={setEditingCustomer}
        updateCustomerPending={updateCustomer.isPending}
        onUpdateCustomer={handleUpdateCustomer}
        editingSupplier={editingSupplier}
        setEditingSupplier={setEditingSupplier}
        updateSupplierPending={updateSupplier.isPending}
        onUpdateSupplier={handleUpdateSupplier}
      />
    </div>
  );
}
