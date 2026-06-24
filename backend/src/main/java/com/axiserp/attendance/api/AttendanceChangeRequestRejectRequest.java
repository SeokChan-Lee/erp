package com.axiserp.attendance.api;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AttendanceChangeRequestRejectRequest(
        @NotEmpty List<Long> requestIds,
        @Size(max = 1000) String rejectReason
) {
}
