package com.axiserp.attendance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "attendance_settings")
public class AttendanceSettingsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalTime standardCheckInAt;

    @Column(nullable = false)
    private LocalTime standardCheckOutAt;

    @Column(nullable = false)
    private LocalTime lateAfterAt;

    protected AttendanceSettingsEntity() {
    }

    public AttendanceSettingsEntity(LocalTime standardCheckInAt, LocalTime standardCheckOutAt, LocalTime lateAfterAt) {
        this.standardCheckInAt = standardCheckInAt;
        this.standardCheckOutAt = standardCheckOutAt;
        this.lateAfterAt = lateAfterAt;
    }

    public LocalTime getStandardCheckInAt() {
        return standardCheckInAt;
    }

    public LocalTime getStandardCheckOutAt() {
        return standardCheckOutAt;
    }

    public LocalTime getLateAfterAt() {
        return lateAfterAt;
    }

    public void update(LocalTime standardCheckInAt, LocalTime standardCheckOutAt, LocalTime lateAfterAt) {
        this.standardCheckInAt = standardCheckInAt;
        this.standardCheckOutAt = standardCheckOutAt;
        this.lateAfterAt = lateAfterAt;
    }
}
