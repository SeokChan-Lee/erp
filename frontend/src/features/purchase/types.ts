import type { CustomerCreatePayload, CustomerUpdatePayload, PurchaseRequestCreatePayload, SupplierCreatePayload, SupplierUpdatePayload } from "./api/dto";

export type PurchaseRequestForm = Omit<PurchaseRequestCreatePayload, "quantity" | "unitPrice"> & {
  quantity: string;
  unitPrice: string;
};

export type SupplierEditForm = SupplierUpdatePayload & {
  id: number;
};

export type CustomerEditForm = CustomerUpdatePayload & {
  id: number;
};

export type CustomerForm = CustomerCreatePayload;
export type SupplierForm = SupplierCreatePayload;
