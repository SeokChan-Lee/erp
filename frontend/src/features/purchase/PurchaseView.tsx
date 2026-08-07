import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useItemsQuery, useWarehousesQuery } from "../inventory/api/inventoryApi";
import type { ItemQueryParams } from "../inventory/api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { Toast } from "../../shared/ui/Toast";
import { CustomerListPanel } from "./components/CustomerListPanel";
import { PurchaseModals } from "./components/PurchaseModals";
import { PurchaseOrderListPanel } from "./components/PurchaseOrderListPanel";
import { PurchaseRequestCreatePanel } from "./components/PurchaseRequestCreatePanel";
import { PurchaseRequestListPanel } from "./components/PurchaseRequestListPanel";
import { SupplierListPanel } from "./components/SupplierListPanel";
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
  const canReadSupplier = permissions.includes("SUPPLIER_READ");
  const canReadPurchase = permissions.includes("PURCHASE_READ");
  const canReadItems = permissions.includes("ITEM_READ");
  const canReadInventory = permissions.includes("INVENTORY_READ");
  const canCreateCustomer = permissions.includes("CUSTOMER_CREATE");
  const canUpdateCustomer = permissions.includes("CUSTOMER_UPDATE");
  const canCreateSupplier = permissions.includes("SUPPLIER_CREATE");
  const canUpdateSupplier = permissions.includes("SUPPLIER_UPDATE");
  const canCreatePurchase = permissions.includes("PURCHASE_CREATE") && canReadSupplier && canReadItems;
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
  const { data: suppliersPage, error: suppliersError, isLoading: suppliersLoading } = useSuppliersQuery(supplierParams, canReadSupplier);
  const { data: activeSuppliersPage, error: activeSuppliersError } = useSuppliersQuery(allSupplierParams, canCreatePurchase);
  const { data: requestsPage, error: requestsError, isLoading: requestsLoading } = usePurchaseRequestsQuery(requestParams, canReadPurchase);
  const { data: ordersPage, error: ordersError, isLoading: ordersLoading } = usePurchaseOrdersQuery(orderParams, canReadPurchase);
  const { data: selectedOrder, error: selectedOrderError, isLoading: selectedOrderLoading } = usePurchaseOrderQuery(selectedOrderId);
  const { data: itemsPage, error: itemsError } = useItemsQuery(itemParams, canCreatePurchase);
  const { data: warehouses = [], error: warehousesError } = useWarehousesQuery(canReadPurchase && canCancelPurchase && canReadInventory);
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
        <CustomerListPanel
          customers={customers}
          totalCustomers={totalCustomers}
          page={customerPage}
          pageSize={PAGE_SIZE}
          searchInput={customerSearchInput}
          status={customerStatus}
          statusOptions={customerStatusOptions}
          loading={customersLoading}
          canCreate={canCreateCustomer}
          canUpdate={canUpdateCustomer}
          onCreateClick={() => setCustomerCreateOpen(true)}
          onSearchInputChange={setCustomerSearchInput}
          onApplySearch={() => {
            setCustomerSearch(customerSearchInput.trim());
            setCustomerPage(1);
          }}
          onStatusChange={(status) => {
            setCustomerStatus(status);
            setCustomerPage(1);
          }}
          onResetFilters={resetCustomerFilters}
          onPageChange={setCustomerPage}
          onEdit={handleEditCustomer}
        />
      ) : null}

      {canReadSupplier ? <SupplierListPanel
        suppliers={suppliers}
        totalSuppliers={totalSuppliers}
        page={supplierPage}
        pageSize={PAGE_SIZE}
        searchInput={supplierSearchInput}
        status={supplierStatus}
        statusOptions={supplierStatusOptions}
        loading={suppliersLoading}
        canCreate={canCreateSupplier}
        canUpdate={canUpdateSupplier}
        onCreateClick={() => setSupplierCreateOpen(true)}
        onSearchInputChange={setSupplierSearchInput}
        onApplySearch={() => {
          setSupplierSearch(supplierSearchInput.trim());
          setSupplierPage(1);
        }}
        onStatusChange={(status) => {
          setSupplierStatus(status);
          setSupplierPage(1);
        }}
        onResetFilters={resetSupplierFilters}
        onPageChange={setSupplierPage}
        onEdit={handleEditSupplier}
      /> : null}

      {canReadPurchase ? <div className="grid min-w-0 gap-6">
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

        <PurchaseRequestListPanel
          requests={requests}
          totalRequests={totalRequests}
          page={requestPage}
          pageSize={PAGE_SIZE}
          searchInput={requestSearchInput}
          status={requestStatus}
          statusOptions={requestStatusOptions}
          loading={requestsLoading}
          canApprove={canApprovePurchase}
          canUpdate={canCancelPurchase}
          approvePending={approveRequest.isPending}
          cancelPending={cancelRequest.isPending}
          createOrderPending={createOrder.isPending}
          onSearchInputChange={setRequestSearchInput}
          onApplySearch={() => {
            setRequestSearch(requestSearchInput.trim());
            setRequestPage(1);
          }}
          onStatusChange={(status) => {
            setRequestStatus(status);
            setRequestPage(1);
          }}
          onResetFilters={resetRequestFilters}
          onPageChange={setRequestPage}
          onSelectRequest={setSelectedRequest}
          onApprove={handleApprovePurchase}
          onCancel={openCancelRequestModal}
          onCreateOrder={handleCreateOrder}
        />

        <PurchaseOrderListPanel
          orders={orders}
          totalOrders={totalOrders}
          page={orderPage}
          pageSize={PAGE_SIZE}
          searchInput={orderSearchInput}
          fromDateInput={orderFromDateInput}
          toDateInput={orderToDateInput}
          loading={ordersLoading}
          canReceiveOrder={canCancelPurchase && canReadInventory}
          canCancelReceive={canCancelPurchase}
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
      </div> : null}

      <PurchaseModals
        request={{
          selectedRequest,
          setSelectedRequest,
          cancelingRequest,
          setCancelingRequest,
          cancelReason,
          setCancelReason,
          cancelReasonReady,
          cancelRequestPending: cancelRequest.isPending,
          onCancelPurchase: handleCancelPurchase
        }}
        order={{
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
          receiveOrderPending: receiveOrder.isPending,
          onReceiveOrder: handleReceiveOrder
        }}
        customer={{
          customerCreateOpen,
          onCloseCustomerCreate: handleCloseCustomerCreate,
          customerForm,
          setCustomerForm,
          customerFormReady,
          createCustomerPending: createCustomer.isPending,
          onCreateCustomer: handleCreateCustomer,
          editingCustomer,
          setEditingCustomer,
          updateCustomerPending: updateCustomer.isPending,
          onUpdateCustomer: handleUpdateCustomer
        }}
        supplier={{
          supplierCreateOpen,
          onCloseSupplierCreate: handleCloseSupplierCreate,
          supplierForm,
          setSupplierForm,
          supplierFormReady,
          createSupplierPending: createSupplier.isPending,
          onCreateSupplier: handleCreateSupplier,
          editingSupplier,
          setEditingSupplier,
          updateSupplierPending: updateSupplier.isPending,
          onUpdateSupplier: handleUpdateSupplier
        }}
      />
    </div>
  );
}
