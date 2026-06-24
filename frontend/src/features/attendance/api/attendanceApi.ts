import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type {
  AttendanceChangeRequest,
  AttendanceChangeRequestApprovePayload,
  AttendanceChangeRequestPayload,
  AttendanceRecord,
  AttendanceUpdatePayload
} from "./dto";

export const attendanceKeys = {
  today: ["attendance", "today"] as const,
  monthly: (year: number, month: number) => ["attendance", "monthly", year, month] as const,
  changeRequests: ["attendance", "change-requests"] as const
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
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.today });
      void queryClient.invalidateQueries({ queryKey: attendanceKeys.monthly(year, month) });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}
