export type SupplierStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type CustomerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type Supplier = {
  id: number;
  code: string;
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
};

export type SupplierQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: SupplierStatusFilter;
};

export type SupplierCreatePayload = {
  code: string;
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
};

export type SupplierUpdatePayload = {
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
};

export type Customer = {
  id: number;
  code: string;
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
};

export type CustomerQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: CustomerStatusFilter;
};

export type CustomerCreatePayload = {
  code: string;
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
};

export type CustomerUpdatePayload = {
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
};

export type PurchaseRequestStatus = "REQUESTED" | "APPROVED" | "CANCELED" | "ORDERED";
export type PurchaseRequestStatusFilter = "ALL" | PurchaseRequestStatus;

export type PurchaseItem = {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  active: boolean;
};

export type PurchaseRequest = {
  id: number;
  requestNo: string;
  supplier: Supplier;
  item: PurchaseItem;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: PurchaseRequestStatus;
  memo: string | null;
  requestedBy: string;
  requestedAt: string;
  processedBy: string | null;
  processedAt: string | null;
  processedReason: string | null;
};

export type PurchaseRequestQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: PurchaseRequestStatusFilter;
};

export type PurchaseRequestCreatePayload = {
  supplierId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  memo: string;
};

export type PurchaseRequestCancelPayload = {
  reason: string;
};

export type PurchaseOrder = {
  id: number;
  orderNo: string;
  request: PurchaseRequest;
  totalAmount: number;
  orderedBy: string;
  orderedAt: string;
  receivedWarehouse: {
    id: number;
    code: string;
    name: string;
  } | null;
  receivedBy: string | null;
  receivedAt: string | null;
};

export type PurchaseOrderQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  fromDate: string;
  toDate: string;
};

export type PurchaseOrderReceivePayload = {
  warehouseId: number;
};
