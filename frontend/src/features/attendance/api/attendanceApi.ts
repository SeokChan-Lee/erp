import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { PageResponse } from "../../../shared/api/page";
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestApprovePayload,
  AttendanceChangeRequestHistoryParams,
  AttendanceChangeRequestPayload,
  AttendanceChangeRequestRejectPayload,
  AttendanceRecord,
  AttendanceUpdatePayload
} from "./dto";

export const attendanceKeys = {
  today: ["attendance", "today"] as const,
  monthly: (year: number, month: number) => ["attendance", "monthly", year, month] as const,
  changeRequests: ["attendance", "change-requests"] as const,
  changeRequestHistoryRoot: ["attendance", "change-requests", "history"] as const,
  changeRequestHistory: (params: AttendanceChangeRequestHistoryParams) =>
    ["attendance", "change-requests", "history", params] as const
};

export function useTodayAttendanceQuery() {
  return useQuery({
    queryKey: attendanceKeys.today,
    queryFn: () => http<AttendanceRecord>("/attendance/me/today")
  });
}

export function useMonthlyAttendanceQuery(year: number, month: number) {
  return useQuery({
    queryKey: attendanceKeys.monthly(year, month),
    queryFn: () => http<AttendanceRecord[]>(`/attendance/me/monthly?year=${year}&month=${month}`)
  });
}

export function useAttendanceMutation(type: "check-in" | "check-out") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      http<AttendanceRecord>(`/attendance/${type}`, {
        method: "POST"
      }),
    onSuccess: (record) => {
      queryClient.setQueryData(attendanceKeys.today, record);
      void queryClient.invalidateQueries({ queryKey: ["attendance", "monthly"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}

export function useCreateAttendanceChangeRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceChangeRequestPayload) =>
      http<AttendanceChangeRequest>("/attendance/change-requests", {
        method: "POST",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.changeRequests });
    }
  });
}

export function useUpdateAttendanceMutation(year: number, month: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceUpdatePayload) =>
      http<AttendanceRecord>("/attendance/me", {
        method: "PATCH",
        json: payload
      }),
    onSuccess: (record) => {
      queryClient.setQueryData(attendanceKeys.today, record);
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.monthly(year, month) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}

export function usePendingAttendanceChangeRequestsQuery(enabled: boolean) {
  return useQuery({
    queryKey: attendanceKeys.changeRequests,
    queryFn: () => http<AttendanceChangeRequest[]>("/admin/attendance/change-requests"),
    enabled
  });
}

export function useAttendanceChangeRequestHistoryQuery(params: AttendanceChangeRequestHistoryParams, enabled: boolean) {
  return useQuery({
    queryKey: attendanceKeys.changeRequestHistory(params),
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
      if (params.startDate) {
        query.set("startDate", params.startDate);
      }
      if (params.endDate) {
        query.set("endDate", params.endDate);
      }
      return http<PageResponse<AttendanceChangeRequest>>(`/admin/attendance/change-requests/history?${query.toString()}`);
    },
    enabled
  });
}

export function useApproveAttendanceChangeRequestsMutation(year: number, month: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceChangeRequestApprovePayload) =>
      http<AttendanceChangeRequest[]>("/admin/attendance/change-requests/approve", {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.changeRequests });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.changeRequestHistoryRoot });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.today });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.monthly(year, month) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}

export function useRejectAttendanceChangeRequestsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AttendanceChangeRequestRejectPayload) =>
      http<AttendanceChangeRequest[]>("/admin/attendance/change-requests/reject", {
        method: "PATCH",
        json: payload
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.changeRequests });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.changeRequestHistoryRoot });
    }
  });
}
