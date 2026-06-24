package com.axiserp.attendance;

import com.axiserp.attendance.api.AttendanceRecordResponse;
import com.axiserp.attendance.api.AttendanceChangeRequestCreateRequest;
import com.axiserp.attendance.api.AttendanceChangeRequestResponse;
import com.axiserp.attendance.api.AttendanceUpdateRequest;
import com.axiserp.common.api.PageResponse;
import com.axiserp.user.UserAccountRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttendanceService {

    private static final LocalTime LATE_AFTER = LocalTime.of(9, 10);

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceChangeRequestRepository attendanceChangeRequestRepository;
    private final UserAccountRepository userAccountRepository;

    public AttendanceService(
            AttendanceRecordRepository attendanceRecordRepository,
            AttendanceChangeRequestRepository attendanceChangeRequestRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceChangeRequestRepository = attendanceChangeRequestRepository;
        this.userAccountRepository = userAccountRepository;
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

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> monthlyFor(String username, int year, int month) {
        YearMonth targetMonth;
        try {
            targetMonth = YearMonth.of(year, month);
        } catch (DateTimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회 월이 올바르지 않습니다.");
        }

        return attendanceRecordRepository
                .findByUsernameAndWorkDateBetweenOrderByWorkDateAsc(
                        username,
                        targetMonth.atDay(1),
                        targetMonth.atEndOfMonth()
                )
                .stream()
                .map(this::toRecord)
                .toList();
    }

    @Transactional
    public AttendanceChangeRequestResponse createChangeRequest(String username, AttendanceChangeRequestCreateRequest request) {
        if (!request.requestedCheckOutAt().isAfter(request.requestedCheckInAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "퇴근 시간은 출근 시간보다 늦어야 합니다.");
        }
        if (attendanceChangeRequestRepository.existsByUsernameAndWorkDateAndStatus(
                username,
                request.workDate(),
                AttendanceChangeRequestStatus.PENDING
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 대기 중인 근태 수정 요청이 있습니다.");
        }

        AttendanceChangeRequestEntity savedRequest = attendanceChangeRequestRepository.save(new AttendanceChangeRequestEntity(
                username,
                request.workDate(),
                request.requestedCheckInAt(),
                request.requestedCheckOutAt(),
                request.reason()
        ));
        return toChangeRequest(savedRequest);
    }

    @Transactional
    public AttendanceRecordResponse updateSelf(String username, AttendanceUpdateRequest request) {
        validateAttendanceTime(request.requestedCheckInAt(), request.requestedCheckOutAt());
        return toRecord(applyAttendance(
                username,
                request.workDate(),
                request.requestedCheckInAt(),
                request.requestedCheckOutAt()
        ));
    }

    @Transactional(readOnly = true)
    public List<AttendanceChangeRequestResponse> pendingChangeRequests() {
        return attendanceChangeRequestRepository.findByStatusOrderByRequestedAtAsc(AttendanceChangeRequestStatus.PENDING).stream()
                .map(this::toChangeRequest)
                .toList();
    }

    @Transactional
    public List<AttendanceChangeRequestResponse> approveChangeRequests(String processedBy, List<Long> requestIds) {
        Map<Long, AttendanceChangeRequestEntity> requestsById = new LinkedHashMap<>();
        for (AttendanceChangeRequestEntity request : attendanceChangeRequestRepository.findAllById(requestIds)) {
            requestsById.put(request.getId(), request);
        }
        if (requestsById.size() != requestIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "근태 수정 요청을 찾을 수 없습니다.");
        }

        return requestIds.stream()
                .map((requestId) -> approveChangeRequest(processedBy, requestsById.get(requestId)))
                .toList();
    }

    @Transactional
    public List<AttendanceChangeRequestResponse> rejectChangeRequests(String processedBy, List<Long> requestIds, String rejectReason) {
        Map<Long, AttendanceChangeRequestEntity> requestsById = new LinkedHashMap<>();
        for (AttendanceChangeRequestEntity request : attendanceChangeRequestRepository.findAllById(requestIds)) {
            requestsById.put(request.getId(), request);
        }
        if (requestsById.size() != requestIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "근태 수정 요청을 찾을 수 없습니다.");
        }

        String reason = rejectReason == null || rejectReason.isBlank()
                ? "관리자 반려"
                : rejectReason.trim();
        return requestIds.stream()
                .map((requestId) -> rejectChangeRequest(processedBy, requestsById.get(requestId), reason))
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<AttendanceChangeRequestResponse> changeRequestHistory(
            AttendanceChangeRequestStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            int page,
            int pageSize
    ) {
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("requestedAt").descending()
        );
        return PageResponse.from(
                attendanceChangeRequestRepository.findAll(changeRequestSpecification(status, startDate, endDate, search), pageRequest),
                this::toChangeRequest
        );
    }

    private AttendanceChangeRequestResponse approveChangeRequest(String processedBy, AttendanceChangeRequestEntity request) {
        if (request.getStatus() != AttendanceChangeRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 근태 수정 요청입니다.");
        }

        applyAttendance(
                request.getUsername(),
                request.getWorkDate(),
                request.getRequestedCheckInAt(),
                request.getRequestedCheckOutAt()
        );

        request.approve(processedBy);
        return toChangeRequest(request);
    }

    private AttendanceChangeRequestResponse rejectChangeRequest(String processedBy, AttendanceChangeRequestEntity request, String rejectReason) {
        if (request.getStatus() != AttendanceChangeRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 근태 수정 요청입니다.");
        }

        request.reject(processedBy, rejectReason);
        return toChangeRequest(request);
    }

    private void validateAttendanceTime(LocalTime checkInAt, LocalTime checkOutAt) {
        if (!checkOutAt.isAfter(checkInAt)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "퇴근 시간은 출근 시간보다 늦어야 합니다.");
        }
    }

    private AttendanceRecordEntity applyAttendance(String username, LocalDate workDate, LocalTime checkInAt, LocalTime checkOutAt) {
        validateAttendanceTime(checkInAt, checkOutAt);
        AttendanceStatus status = checkInAt.isAfter(LATE_AFTER)
                ? AttendanceStatus.LATE
                : AttendanceStatus.NORMAL;
        AttendanceRecordEntity record = attendanceRecordRepository
                .findByUsernameAndWorkDate(username, workDate)
                .orElseGet(() -> new AttendanceRecordEntity(
                        username,
                        workDate,
                        null,
                        null,
                        status
                ));
        record.checkIn(workDate.atTime(checkInAt), status);
        record.checkOut(workDate.atTime(checkOutAt), status);
        return attendanceRecordRepository.save(record);
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

    private AttendanceChangeRequestResponse toChangeRequest(AttendanceChangeRequestEntity request) {
        String requesterName = userAccountRepository.findByUsername(request.getUsername())
                .map((account) -> account.getDisplayName())
                .orElse("사용자");
        return AttendanceChangeRequestResponse.from(request, requesterName);
    }

    private Specification<AttendanceChangeRequestEntity> changeRequestSpecification(
            AttendanceChangeRequestStatus status,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            if (startDate != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("workDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("workDate"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("username")), keyword),
                        builder.like(builder.lower(root.get("reason")), keyword),
                        builder.like(builder.lower(root.get("rejectReason")), keyword),
                        builder.like(builder.lower(root.get("processedBy")), keyword)
                ));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private int normalizedPage(int page) {
        return Math.max(0, page - 1);
    }

    private int normalizedPageSize(int pageSize) {
        return Math.min(Math.max(pageSize, 1), 100);
    }
}
