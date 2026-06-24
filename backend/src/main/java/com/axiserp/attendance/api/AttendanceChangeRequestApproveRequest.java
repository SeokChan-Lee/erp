package com.axiserp.attendance.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AttendanceChangeRequestApproveRequest(
        @NotNull @Size(min = 1) List<Long> requestIds
) {
}
