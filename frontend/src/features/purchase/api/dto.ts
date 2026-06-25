export type SupplierStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

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

export type PurchaseRequestStatus = "REQUESTED" | "APPROVED" | "CANCELED";
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
