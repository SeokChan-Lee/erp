import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  InventoryAdjustmentPayload,
  InventoryMovement,
  InventoryMovementQueryParams,
  InventoryOverview,
  InventoryStock,
  Item,
  ItemCreatePayload,
  ItemQueryParams,
  ItemUpdatePayload,
  Warehouse
} from "./dto";

export const inventoryKeys = {
  overview: ["inventory", "overview"] as const,
  warehouses: ["inventory", "warehouses"] as const,
  itemRoot: ["inventory", "items"] as const,
  items: (params: ItemQueryParams) => ["inventory", "items", params] as const,
  stocks: (params: { search: string; warehouseId: number }) => ["inventory", "stocks", params] as const,
  movementRoot: ["inventory", "movements"] as const,
  movements: (params: InventoryMovementQueryParams) => ["inventory", "movements", params] as const
};

export function useInventoryOverviewQuery() {
  return useQuery({
    queryKey: inventoryKeys.overview,
    queryFn: () => http<InventoryOverview>("/inventory/overview")
  });
}

export function useWarehousesQuery() {
  return useQuery({
    queryKey: inventoryKeys.warehouses,
    queryFn: () => http<Warehouse[]>("/inventory/warehouses")
  });
}

export function useItemsQuery(params: ItemQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.items(params),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.status !== "ALL") {
        query.set("status", params.status);
      }
      return http<PageResponse<Item>>(`/items?${query.toString()}`);
    }
  });
}

export function useInventoryStocksQuery(params: { search: string; warehouseId: number }) {
  return useQuery({
    queryKey: inventoryKeys.stocks(params),
    queryFn: () => {
      const query = new URLSearchParams();
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.warehouseId > 0) {
        query.set("warehouseId", String(params.warehouseId));
      }
      const queryString = query.toString();
      return http<InventoryStock[]>(`/inventory/stocks${queryString ? `?${queryString}` : ""}`);
    }
  });
}

export function useInventoryMovementsQuery(params: InventoryMovementQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.warehouseId > 0) {
        query.set("warehouseId", String(params.warehouseId));
      }
      if (params.startDate) {
        query.set("startDate", params.startDate);
      }
      if (params.endDate) {
        query.set("endDate", params.endDate);
      }
      return http<PageResponse<InventoryMovement>>(`/inventory/movements?${query.toString()}`);
    }
  });
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ItemCreatePayload) =>
      http<Item>("/items", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.itemRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory", "stocks"] });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.overview });
    }
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: ItemUpdatePayload }) =>
      http<Item>(`/items/${itemId}`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.itemRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory", "stocks"] });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.overview });
    }
  });
}

export function useAdjustInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InventoryAdjustmentPayload) =>
      http<InventoryStock>("/inventory/adjustments", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory", "stocks"] });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.movementRoot });
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.overview });
    }
  });
}
