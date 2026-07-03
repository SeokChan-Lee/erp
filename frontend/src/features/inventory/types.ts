import type { InventoryAdjustmentPayload, ItemCreatePayload, ItemUpdatePayload } from "./api/dto";

export type ItemCreateForm = Omit<ItemCreatePayload, "safetyStock"> & {
  safetyStock: string;
};

export type InventoryAdjustmentForm = Omit<InventoryAdjustmentPayload, "quantityDelta"> & {
  targetQuantity: number;
};

export type ItemEditForm = ItemUpdatePayload & {
  id: number;
};
