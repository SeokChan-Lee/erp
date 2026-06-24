export type AttendanceStatus = "NOT_CHECKED_IN" | "WORKING" | "NORMAL" | "LATE" | "EARLY_LEAVE" | "ABSENT";

export type AttendanceRecord = {
  username: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
};

export type AttendanceChangeRequestStatus = "PENDING" | "APPROVED";

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
