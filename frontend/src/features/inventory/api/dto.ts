export type ItemStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type Item = {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  active: boolean;
};

export type Warehouse = {
  id: number;
  code: string;
  name: string;
};

export type InventoryStock = {
  id: number;
  item: Item;
  warehouse: Warehouse;
  quantity: number;
  safetyStock: number;
  belowSafetyStock: boolean;
};

export type InventoryMovement = {
  id: number;
  item: Item;
  warehouse: Warehouse;
  quantityDelta: number;
  reason: string;
  sourceType: "PURCHASE_RECEIPT" | "PURCHASE_RECEIPT_CANCEL" | "SALES_SHIPMENT" | "SALES_SHIPMENT_CANCEL" | "MANUAL_ADJUSTMENT";
  sourceLabel: string;
  sourceReferenceNo: string;
  processedBy: string;
  processedAt: string;
};

export type InventoryOverview = {
  totalItems: number;
  activeItems: number;
  belowSafetyStocks: number;
  warehouses: number;
};

export type ItemQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: ItemStatusFilter;
};

export type InventoryMovementQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  warehouseId: number;
  startDate: string;
  endDate: string;
};

export type ItemCreatePayload = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
};

export type ItemUpdatePayload = {
  name: string;
  category: string;
  unit: string;
  safetyStock: number;
  active: boolean;
};

export type InventoryAdjustmentPayload = {
  itemId: number;
  warehouseId: number;
  quantityDelta: number;
  reason: string;
};
