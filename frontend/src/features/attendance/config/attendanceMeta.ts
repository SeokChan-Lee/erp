import type { AttendanceStatus } from "../api/dto";

export const attendanceStatusMeta: Record<AttendanceStatus, { label: string; className: string; dotClassName: string }> = {
  NOT_CHECKED_IN: {
    label: "출근 전",
    className: "bg-axis-bg text-axis-muted",
    dotClassName: "bg-axis-muted"
  },
  WORKING: {
    label: "근무 중",
    className: "bg-sky-50 text-sky-700",
    dotClassName: "bg-sky-500"
  },
  NORMAL: {
    label: "정상",
    className: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500"
  },
  LATE: {
    label: "지각",
    className: "bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500"
  },
  EARLY_LEAVE: {
    label: "조퇴",
    className: "bg-orange-50 text-orange-700",
    dotClassName: "bg-orange-500"
  },
  ABSENT: {
    label: "결근",
    className: "bg-rose-50 text-rose-700",
    dotClassName: "bg-rose-500"
  }
};
