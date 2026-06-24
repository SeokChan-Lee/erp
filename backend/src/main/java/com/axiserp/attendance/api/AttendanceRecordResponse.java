package com.axiserp.attendance.api;

import com.axiserp.attendance.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceRecordResponse(
        String username,
        LocalDate workDate,
        LocalDateTime checkInAt,
        LocalDateTime checkOutAt,
        AttendanceStatus status
) {
}
