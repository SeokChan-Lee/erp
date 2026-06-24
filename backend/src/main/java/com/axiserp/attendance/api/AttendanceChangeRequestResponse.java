package com.axiserp.attendance.api;

import com.axiserp.attendance.AttendanceChangeRequestEntity;
import com.axiserp.attendance.AttendanceChangeRequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record AttendanceChangeRequestResponse(
        Long id,
        String username,
        String requesterName,
        LocalDate workDate,
        LocalTime requestedCheckInAt,
        LocalTime requestedCheckOutAt,
        String reason,
        AttendanceChangeRequestStatus status,
        LocalDateTime requestedAt
) {
    public static AttendanceChangeRequestResponse from(AttendanceChangeRequestEntity request, String requesterName) {
        return new AttendanceChangeRequestResponse(
                request.getId(),
                request.getUsername(),
                requesterName,
                request.getWorkDate(),
                request.getRequestedCheckInAt(),
                request.getRequestedCheckOutAt(),
                request.getReason(),
                request.getStatus(),
                request.getRequestedAt()
        );
    }
}
