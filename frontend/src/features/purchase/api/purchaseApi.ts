import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  Customer,
  CustomerCreatePayload,
  CustomerQueryParams,
  CustomerUpdatePayload,
  PurchaseOrder,
  PurchaseOrderQueryParams,
  PurchaseOrderReceivePayload,
  PurchaseRequest,
  PurchaseRequestCancelPayload,
  PurchaseRequestCreatePayload,
  PurchaseRequestQueryParams,
  Supplier,
  SupplierCreatePayload,
  SupplierQueryParams,
  SupplierUpdatePayload
} from "./dto";

export const purchaseKeys = {
  customerRoot: ["purchase", "customers"] as const,
  customers: (params: CustomerQueryParams) => ["purchase", "customers", params] as const,
  supplierRoot: ["purchase", "suppliers"] as const,
  suppliers: (params: SupplierQueryParams) => ["purchase", "suppliers", params] as const,
  requestRoot: ["purchase", "requests"] as const,
  requests: (params: PurchaseRequestQueryParams) => ["purchase", "requests", params] as const,
  orderRoot: ["purchase", "orders"] as const,
  orders: (params: PurchaseOrderQueryParams) => ["purchase", "orders", params] as const,
  orderDetail: (orderId: number) => ["purchase", "orders", orderId] as const
};

export function useCustomersQuery(params: CustomerQueryParams, enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.customers(params),
    enabled,
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
      return http<PageResponse<Customer>>(`/customers?${query.toString()}`);
    }
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomerCreatePayload) =>
      http<Customer>("/customers", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.customerRoot });
    }
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, payload }: { customerId: number; payload: CustomerUpdatePayload }) =>
      http<Customer>(`/customers/${customerId}`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.customerRoot });
    }
  });
}

export function useSuppliersQuery(params: SupplierQueryParams, enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.suppliers(params),
    enabled,
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
      return http<PageResponse<Supplier>>(`/suppliers?${query.toString()}`);
    }
  });
}

export function usePurchaseRequestsQuery(params: PurchaseRequestQueryParams, enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.requests(params),
    enabled,
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
      return http<PageResponse<PurchaseRequest>>(`/purchases/requests?${query.toString()}`);
    }
  });
}

export function usePurchaseOrdersQuery(params: PurchaseOrderQueryParams, enabled = true) {
  return useQuery({
    queryKey: purchaseKeys.orders(params),
    enabled,
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(params.page),
        pageSize: String(params.pageSize)
      });
      if (params.search.trim()) {
        query.set("search", params.search.trim());
      }
      if (params.fromDate) {
        query.set("fromDate", params.fromDate);
      }
      if (params.toDate) {
        query.set("toDate", params.toDate);
      }
      return http<PageResponse<PurchaseOrder>>(`/purchases/orders?${query.toString()}`);
    }
  });
}

export function usePurchaseOrderQuery(orderId: number | null) {
  return useQuery({
    queryKey: purchaseKeys.orderDetail(orderId ?? 0),
    enabled: orderId !== null,
    queryFn: () => http<PurchaseOrder>(`/purchases/orders/${orderId}`)
  });
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SupplierCreatePayload) =>
      http<Supplier>("/suppliers", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.supplierRoot });
    }
  });
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: number; payload: SupplierUpdatePayload }) =>
      http<Supplier>(`/suppliers/${supplierId}`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.supplierRoot });
    }
  });
}

export function useCreatePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchaseRequestCreatePayload) =>
      http<PurchaseRequest>("/purchases/requests", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.requestRoot });
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useApprovePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) =>
      http<PurchaseRequest>(`/purchases/requests/${requestId}/approve`, {
        method: "PATCH"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.requestRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCancelPurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, payload }: { requestId: number; payload: PurchaseRequestCancelPayload }) =>
      http<PurchaseRequest>(`/purchases/requests/${requestId}/cancel`, {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.requestRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCreatePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) =>
      http<PurchaseOrder>(`/purchases/requests/${requestId}/order`, {
        method: "POST"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.requestRoot });
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useReceivePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: number; payload: PurchaseOrderReceivePayload }) =>
      http<PurchaseOrder>(`/purchases/orders/${orderId}/receive`, {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}

export function useCancelReceivePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) =>
      http<PurchaseOrder>(`/purchases/orders/${orderId}/receive/cancel`, {
        method: "POST"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.orderRoot });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });
}
