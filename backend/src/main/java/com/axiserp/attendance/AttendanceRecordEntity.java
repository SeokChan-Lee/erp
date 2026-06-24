package com.axiserp.attendance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendance_records",
        uniqueConstraints = @UniqueConstraint(name = "uk_attendance_username_work_date", columnNames = {"username", "work_date"})
)
public class AttendanceRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String username;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_at")
    private LocalDateTime checkInAt;

    @Column(name = "check_out_at")
    private LocalDateTime checkOutAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AttendanceStatus status;

    protected AttendanceRecordEntity() {
    }

    public AttendanceRecordEntity(String username, LocalDate workDate, LocalDateTime checkInAt, LocalDateTime checkOutAt, AttendanceStatus status) {
        this.username = username;
        this.workDate = workDate;
        this.checkInAt = checkInAt;
        this.checkOutAt = checkOutAt;
        this.status = status;
    }

    public String getUsername() {
        return username;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public LocalDateTime getCheckInAt() {
        return checkInAt;
    }

    public LocalDateTime getCheckOutAt() {
        return checkOutAt;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void checkIn(LocalDateTime checkInAt, AttendanceStatus status) {
        this.checkInAt = checkInAt;
        this.status = status;
    }

    public void checkOut(LocalDateTime checkOutAt, AttendanceStatus status) {
        this.checkOutAt = checkOutAt;
        this.status = status;
    }
}
