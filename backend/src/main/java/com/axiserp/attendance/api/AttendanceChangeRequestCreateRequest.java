package com.axiserp.attendance.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceChangeRequestCreateRequest(
        @NotNull LocalDate workDate,
        @NotNull LocalTime requestedCheckInAt,
        @NotNull LocalTime requestedCheckOutAt,
        @NotBlank @Size(max = 1000) String reason
) {
}
