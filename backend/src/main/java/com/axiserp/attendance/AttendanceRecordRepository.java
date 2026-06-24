package com.axiserp.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecordEntity, Long> {

    Optional<AttendanceRecordEntity> findByUsernameAndWorkDate(String username, LocalDate workDate);

    List<AttendanceRecordEntity> findByUsernameAndWorkDateBetweenOrderByWorkDateAsc(String username, LocalDate startDate, LocalDate endDate);

    List<AttendanceRecordEntity> findByWorkDate(LocalDate workDate);
}
