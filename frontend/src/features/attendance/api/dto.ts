export type AttendanceStatus = "NOT_CHECKED_IN" | "WORKING" | "NORMAL" | "LATE" | "EARLY_LEAVE" | "ABSENT";

export type AttendanceRecord = {
  username: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
};

export type AttendanceChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AttendanceChangeRequest = {
  id: number;
  username: string;
  requesterName: string;
  workDate: string;
  requestedCheckInAt: string;
  requestedCheckOutAt: string;
  reason: string;
  status: AttendanceChangeRequestStatus;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  rejectReason: string | null;
};

export type AttendanceChangeRequestPayload = {
  workDate: string;
  requestedCheckInAt: string;
  requestedCheckOutAt: string;
  reason: string;
};

export type AttendanceUpdatePayload = {
  workDate: string;
  requestedCheckInAt: string;
  requestedCheckOutAt: string;
};

export type AttendanceChangeRequestApprovePayload = {
  requestIds: number[];
};

export type AttendanceChangeRequestRejectPayload = {
  requestIds: number[];
  rejectReason: string;
};

export type AttendanceChangeRequestHistoryParams = {
  page: number;
  pageSize: number;
  search: string;
  status: "ALL" | AttendanceChangeRequestStatus;
  startDate: string;
  endDate: string;
};
