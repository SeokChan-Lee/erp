import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  SalesCustomer,
  SalesOrder,
  SalesOrderCreatePayload,
  SalesOrderQueryParams,
  SalesOrderShipPayload
} from "./dto";

export const salesKeys = {
  customerRoot: ["sales", "customers"] as const,
  activeCustomers: ["sales", "customers", "active"] as const,
  orderRoot: ["sales", "orders"] as const,
  orders: (params: SalesOrderQueryParams) => ["sales", "orders", params] as const,
  orderDetail: (orderId: number) => ["sales", "orders", orderId] as const
};

export function useActiveSalesCustomersQuery() {
  return useQuery({
    queryKey: salesKeys.activeCustomers,
    queryFn: () =>
      http<PageResponse<SalesCustomer>>("/customers?page=1&pageSize=100&status=ACTIVE")
  });
}

export function useSalesOrdersQuery(params: SalesOrderQueryParams) {
  return useQuery({
    queryKey: salesKeys.orders(params),
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
      return http<PageResponse<SalesOrder>>(`/sales/orders?${query.toString()}`);
    }
  });
}

export function useSalesOrderQuery(orderId: number | null) {
  return useQuery({
    queryKey: salesKeys.orderDetail(orderId ?? 0),
    enabled: orderId !== null,
    queryFn: () => http<SalesOrder>(`/sales/orders/${orderId}`)
  });
}

export function useCreateSalesOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SalesOrderCreatePayload) =>
      http<SalesOrder>("/sales/orders", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCancelSalesOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) =>
      http<SalesOrder>(`/sales/orders/${orderId}/cancel`, {
        method: "PATCH"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useShipSalesOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: SalesOrderShipPayload }) =>
      http<SalesOrder>(`/sales/orders/${orderId}/ship`, {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCancelShipSalesOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) =>
      http<SalesOrder>(`/sales/orders/${orderId}/ship/cancel`, {
        method: "POST"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: salesKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}
