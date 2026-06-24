package com.axiserp.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceChangeRequestRepository extends JpaRepository<AttendanceChangeRequestEntity, Long> {

    boolean existsByUsernameAndWorkDateAndStatus(String username, LocalDate workDate, AttendanceChangeRequestStatus status);

    List<AttendanceChangeRequestEntity> findByStatusOrderByRequestedAtAsc(AttendanceChangeRequestStatus status);

    List<AttendanceChangeRequestEntity> findAllByOrderByRequestedAtDesc();
}
