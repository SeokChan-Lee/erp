import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Eye, PackageCheck, PencilLine, Plus, RotateCcw, Search, Send, ShoppingCart, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useItemsQuery, useWarehousesQuery } from "../inventory/api/inventoryApi";
import type { ItemQueryParams } from "../inventory/api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Button } from "../../shared/ui/Button";
import { DateField } from "../../shared/ui/DateField";
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { ResetButton } from "../../shared/ui/ResetButton";
import { SearchableSelectField } from "../../shared/ui/SearchableSelectField";
import { SelectField } from "../../shared/ui/SelectField";
import { TableFrame } from "../../shared/ui/TableFrame";
import { TextField } from "../../shared/ui/TextField";
import { Toast } from "../../shared/ui/Toast";
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

type PurchaseRequestForm = Omit<PurchaseRequestCreatePayload, "quantity" | "unitPrice"> & {
  quantity: string;
  unitPrice: string;
};

const initialPurchaseForm: PurchaseRequestForm = {
  supplierId: 0,
  itemId: 0,
  quantity: "",
  unitPrice: "",
  memo: ""
};

type SupplierEditForm = SupplierUpdatePayload & {
  id: number;
};

type CustomerEditForm = CustomerUpdatePayload & {
  id: number;
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
                <TextField
                  label="수량"
                  min={1}
                  type="number"
                  placeholder="수량 입력"
                  value={purchaseForm.quantity}
                  onChange={(event) => setPurchaseForm((current) => ({ ...current, quantity: event.target.value }))}
                  required
                />
                <TextField
                  label="단가"
                  min={1}
                  type="number"
                  placeholder="단가 입력"
                  value={purchaseForm.unitPrice}
                  onChange={(event) => setPurchaseForm((current) => ({ ...current, unitPrice: event.target.value }))}
                  required
                />
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

        <Panel title="구매 발주 목록" description="승인된 구매 요청에서 전환된 발주 기록을 확인합니다.">
          <div className="mb-4 grid min-w-0 items-end gap-3 xl:grid-cols-[1fr_180px_180px_auto_auto]">
            <TextField
              label="검색"
              placeholder="발주번호, 요청번호, 공급사, 품목, 담당자"
              value={orderSearchInput}
              leftIcon={<Search size={17} strokeWidth={2.2} />}
              onChange={(event) => setOrderSearchInput(event.target.value)}
              onEnter={handleApplyOrderSearch}
            />
            <DateField label="시작일" value={orderFromDateInput} onChange={setOrderFromDateInput} />
            <DateField label="종료일" value={orderToDateInput} onChange={setOrderToDateInput} />
            <Button className="h-11" type="button" variant="secondary" onClick={handleApplyOrderSearch}>
              검색 적용
            </Button>
            <ResetButton onClick={resetOrderFilters} />
          </div>

          {ordersLoading ? (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">구매 발주를 불러오는 중입니다.</p>
          ) : (
            <TableFrame>
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                  <tr>
                    <th className="px-4 py-3">발주</th>
                    <th className="px-4 py-3">연결 요청</th>
                    <th className="px-4 py-3">공급사</th>
                    <th className="px-4 py-3">품목</th>
                    <th className="px-4 py-3">수량</th>
                    <th className="px-4 py-3">금액</th>
                    <th className="px-4 py-3">상태</th>
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
                      <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{order.request.requestNo}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-axis-ink">{order.request.supplier.name}</p>
                        <p className="mt-1 text-xs font-semibold text-axis-muted">{order.request.supplier.code}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-axis-ink">{order.request.item.name}</p>
                        <p className="mt-1 text-xs font-semibold text-axis-muted">{order.request.item.sku}</p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{order.request.quantity.toLocaleString("ko-KR")} {order.request.item.unit}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-4"><ReceiveStatusBadge received={order.receivedAt !== null} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => setSelectedOrderId(order.id)}>
                            <Eye size={14} strokeWidth={2.2} />
                            상세
                          </Button>
                          {order.receivedAt ? (
                            <div className="text-xs font-semibold text-axis-muted">
                              <p>{order.receivedWarehouse?.name ?? "입고 창고"}</p>
                              <p className="mt-1">{formatDateTime(order.receivedAt)} · {order.receivedBy}</p>
                            </div>
                          ) : canCancelPurchase ? (
                            <Button
                              className="h-8 gap-1.5 px-3 text-xs"
                              disabled={receiveOrder.isPending || cancelReceiveOrder.isPending || warehouses.length === 0}
                              type="button"
                              variant="secondary"
                              onClick={() => openReceiveModal(order)}
                            >
                              <PackageCheck size={14} strokeWidth={2.2} />
                              입고 처리
                            </Button>
                          ) : (
                            <span className="text-xs font-semibold text-axis-muted">입고 대기</span>
                          )}
                          {order.receivedAt && canCancelPurchase ? (
                              <Button
                                className="h-8 gap-1.5 px-3 text-xs text-rose-700"
                                disabled={cancelReceiveOrder.isPending}
                                type="button"
                                variant="secondary"
                                onClick={() => handleCancelReceiveOrder(order.id)}
                              >
                                <RotateCcw size={14} strokeWidth={2.2} />
                                입고 취소
                              </Button>
                          ) : null}
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
              <Pagination page={orderPage} pageSize={PAGE_SIZE} totalItems={totalOrders} onPageChange={setOrderPage} />
            </TableFrame>
          )}
        </Panel>
      </div>

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
            <Button disabled={!cancelReasonReady || cancelRequest.isPending} type="submit" form="purchase-request-cancel-form">
              {cancelRequest.isPending ? "반려 중" : "반려"}
            </Button>
          </>
        }
        onClose={() => {
          setCancelingRequest(null);
          setCancelReason("");
        }}
      >
        {cancelingRequest ? (
          <form id="purchase-request-cancel-form" className="space-y-4" onSubmit={handleCancelPurchase}>
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
            <Button disabled={selectedReceiveWarehouseId <= 0 || receiveOrder.isPending} type="submit" form="purchase-order-receive-form">
              {receiveOrder.isPending ? "처리 중" : "입고 처리"}
            </Button>
          </>
        }
        onClose={() => {
          setReceivingOrder(null);
          setReceiveWarehouseId(0);
        }}
      >
        {receivingOrder ? (
          <form id="purchase-order-receive-form" className="space-y-4" onSubmit={handleReceiveOrder}>
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
            <Button type="button" variant="secondary" onClick={handleCloseCustomerCreate}>취소</Button>
            <Button disabled={!customerFormReady || createCustomer.isPending} type="submit" form="customer-create-form">
              {createCustomer.isPending ? "등록 중" : "등록"}
            </Button>
          </>
        }
        onClose={handleCloseCustomerCreate}
      >
        <form id="customer-create-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCustomer}>
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
        open={editingCustomer !== null}
        title="고객사 정보 수정"
        description="고객 거래처의 기본 정보와 사용 상태를 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditingCustomer(null)}>취소</Button>
            <Button disabled={updateCustomer.isPending} type="submit" form="customer-edit-form">{updateCustomer.isPending ? "저장 중" : "저장"}</Button>
          </>
        }
        onClose={() => setEditingCustomer(null)}
      >
        {editingCustomer ? (
          <form id="customer-edit-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateCustomer}>
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
  const label = purchaseStatusLabel(status);
  const className =
    status === "ORDERED"
      ? "bg-violet-50 text-violet-700"
      : status === "APPROVED"
        ? "bg-emerald-50 text-emerald-700"
        : status === "CANCELED"
          ? "bg-axis-bg text-axis-muted"
          : "bg-blue-50 text-blue-700";

  return <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", className].join(" ")}>{label}</span>;
}

function purchaseStatusLabel(status: string) {
  return status === "ORDERED" ? "발주" : status === "APPROVED" ? "승인" : status === "CANCELED" ? "반려" : "요청";
}

function ReceiveStatusBadge({ received }: { received: boolean }) {
  return (
    <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", received ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"].join(" ")}>
      {received ? "입고 완료" : "입고 대기"}
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
