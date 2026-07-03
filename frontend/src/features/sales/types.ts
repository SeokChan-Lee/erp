import type { SalesOrderCreatePayload } from "./api/dto";

export type SalesOrderForm = Omit<SalesOrderCreatePayload, "quantity" | "unitPrice"> & {
  quantity: string;
  unitPrice: string;
};
