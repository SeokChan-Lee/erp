export type SalesCustomer = {
  id: number;
  code: string;
  name: string;
  businessNumber: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
};

export type SalesItem = {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  active: boolean;
};

export type SalesOrderStatus = "REGISTERED" | "CANCELED";
export type SalesOrderStatusFilter = "ALL" | SalesOrderStatus;

export type SalesOrder = {
  id: number;
  orderNo: string;
  customer: SalesCustomer;
  item: SalesItem;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: SalesOrderStatus;
  memo: string | null;
  orderedBy: string;
  orderedAt: string;
  processedBy: string | null;
  processedAt: string | null;
  shippedWarehouse: {
    id: number;
    code: string;
    name: string;
  } | null;
  shippedBy: string | null;
  shippedAt: string | null;
};

export type SalesOrderQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: SalesOrderStatusFilter;
};

export type SalesOrderCreatePayload = {
  customerId: number;
  itemId: number;
  quantity: number;
  unitPrice: number;
  memo: string;
};

export type SalesOrderShipPayload = {
  warehouseId: number;
};
