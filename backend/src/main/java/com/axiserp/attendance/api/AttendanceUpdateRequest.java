package com.axiserp.attendance.api;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AttendanceUpdateRequest(
        @NotNull LocalDate workDate,
        @NotNull LocalTime requestedCheckInAt,
        @NotNull LocalTime requestedCheckOutAt
) {
}
