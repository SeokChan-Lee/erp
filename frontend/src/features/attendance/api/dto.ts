export type AttendanceStatus = "NOT_CHECKED_IN" | "WORKING" | "NORMAL" | "LATE" | "EARLY_LEAVE" | "ABSENT";

export type AttendanceRecord = {
  username: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
};
