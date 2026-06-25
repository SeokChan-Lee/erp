import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  PurchaseOrder,
  PurchaseRequest,
  PurchaseRequestCreatePayload,
  PurchaseRequestQueryParams,
  Supplier,
  SupplierCreatePayload,
  SupplierQueryParams,
  SupplierUpdatePayload
} from "./dto";

export const purchaseKeys = {
  supplierRoot: ["purchase", "suppliers"] as const,
  suppliers: (params: SupplierQueryParams) => ["purchase", "suppliers", params] as const,
  requestRoot: ["purchase", "requests"] as const,
  requests: (params: PurchaseRequestQueryParams) => ["purchase", "requests", params] as const
};

export function useSuppliersQuery(params: SupplierQueryParams) {
  return useQuery({
    queryKey: purchaseKeys.suppliers(params),
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

export function usePurchaseRequestsQuery(params: PurchaseRequestQueryParams) {
  return useQuery({
    queryKey: purchaseKeys.requests(params),
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
    }
  });
}

export function useCancelPurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) =>
      http<PurchaseRequest>(`/purchases/requests/${requestId}/cancel`, {
        method: "PATCH"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: purchaseKeys.requestRoot });
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
    }
  });
}
