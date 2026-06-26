package com.axiserp.attendance.api;

import com.axiserp.attendance.AttendanceSettingsEntity;

import java.time.LocalTime;

public record AttendanceSettingsResponse(
        LocalTime standardCheckInAt,
        LocalTime standardCheckOutAt,
        LocalTime lateAfterAt
) {
    public static AttendanceSettingsResponse from(AttendanceSettingsEntity settings) {
        return new AttendanceSettingsResponse(
                settings.getStandardCheckInAt(),
                settings.getStandardCheckOutAt(),
                settings.getLateAfterAt()
        );
    }
}
