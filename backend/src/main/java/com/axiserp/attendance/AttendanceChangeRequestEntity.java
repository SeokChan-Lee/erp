package com.axiserp.attendance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "attendance_change_requests")
public class AttendanceChangeRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String username;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "requested_check_in_at", nullable = false)
    private LocalTime requestedCheckInAt;

    @Column(name = "requested_check_out_at", nullable = false)
    private LocalTime requestedCheckOutAt;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceChangeRequestStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    protected AttendanceChangeRequestEntity() {
    }

    public AttendanceChangeRequestEntity(
            String username,
            LocalDate workDate,
            LocalTime requestedCheckInAt,
            LocalTime requestedCheckOutAt,
            String reason
    ) {
        this.username = username;
        this.workDate = workDate;
        this.requestedCheckInAt = requestedCheckInAt;
        this.requestedCheckOutAt = requestedCheckOutAt;
        this.reason = reason;
        this.status = AttendanceChangeRequestStatus.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public LocalTime getRequestedCheckInAt() {
        return requestedCheckInAt;
    }

    public LocalTime getRequestedCheckOutAt() {
        return requestedCheckOutAt;
    }

    public String getReason() {
        return reason;
    }

    public AttendanceChangeRequestStatus getStatus() {
        return status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void approve() {
        this.status = AttendanceChangeRequestStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
    }
}
