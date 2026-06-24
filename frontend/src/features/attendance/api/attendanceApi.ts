import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { http } from "../../../shared/api/http";
import type { AttendanceRecord } from "./dto";

export const attendanceKeys = {
  today: ["attendance", "today"] as const
};

export function useTodayAttendanceQuery() {
  return useQuery({
    queryKey: attendanceKeys.today,
    queryFn: () => http<AttendanceRecord>("/attendance/me/today")
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
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });
}
