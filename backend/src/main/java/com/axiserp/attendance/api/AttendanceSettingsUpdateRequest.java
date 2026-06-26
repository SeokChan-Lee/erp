package com.axiserp.attendance.api;

import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record AttendanceSettingsUpdateRequest(
        @NotNull LocalTime standardCheckInAt,
        @NotNull LocalTime standardCheckOutAt,
        @NotNull LocalTime lateAfterAt
) {
}
