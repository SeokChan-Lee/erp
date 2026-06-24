package com.axiserp.attendance;

import com.axiserp.attendance.api.AttendanceRecordResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AttendanceService {

    private static final LocalTime LATE_AFTER = LocalTime.of(9, 10);

    private final AttendanceRecordRepository attendanceRecordRepository;

    public AttendanceService(AttendanceRecordRepository attendanceRecordRepository) {
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Transactional
    public AttendanceRecordResponse checkIn(String username) {
        LocalDate today = LocalDate.now();
        AttendanceRecordEntity current = attendanceRecordRepository.findByUsernameAndWorkDate(username, today).orElse(null);
        if (current != null && current.getCheckInAt() != null) {
            return toRecord(current);
        }

        LocalDateTime now = LocalDateTime.now();
        AttendanceStatus status = now.toLocalTime().isAfter(LATE_AFTER)
                ? AttendanceStatus.LATE
                : AttendanceStatus.WORKING;
        AttendanceRecordEntity next = current == null
                ? new AttendanceRecordEntity(username, today, now, null, status)
                : current;
        if (current != null) {
            current.checkIn(now, status);
        }
        return toRecord(attendanceRecordRepository.save(next));
    }

    @Transactional
    public AttendanceRecordResponse checkOut(String username) {
        LocalDate today = LocalDate.now();
        AttendanceRecordEntity current = attendanceRecordRepository.findByUsernameAndWorkDate(username, today).orElse(null);
        LocalDateTime now = LocalDateTime.now();

        AttendanceRecordEntity next;
        if (current == null) {
            next = new AttendanceRecordEntity(username, today, null, now, AttendanceStatus.EARLY_LEAVE);
        } else {
            AttendanceStatus status = current.getStatus() == AttendanceStatus.LATE
                    ? AttendanceStatus.LATE
                    : AttendanceStatus.NORMAL;
            current.checkOut(now, status);
            next = current;
        }
        return toRecord(attendanceRecordRepository.save(next));
    }

    @Transactional(readOnly = true)
    public AttendanceRecordResponse todayFor(String username) {
        LocalDate today = LocalDate.now();
        return attendanceRecordRepository.findByUsernameAndWorkDate(username, today)
                .map(this::toRecord)
                .orElseGet(() -> new AttendanceRecordResponse(username, today, null, null, AttendanceStatus.NOT_CHECKED_IN));
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> todayAll() {
        LocalDate today = LocalDate.now();
        return attendanceRecordRepository.findByWorkDate(today).stream()
                .map(this::toRecord)
                .toList();
    }

    private AttendanceRecordResponse toRecord(AttendanceRecordEntity entity) {
        return new AttendanceRecordResponse(
                entity.getUsername(),
                entity.getWorkDate(),
                entity.getCheckInAt(),
                entity.getCheckOutAt(),
                entity.getStatus()
        );
    }
}
