package com.axiserp.audit.api;

import com.axiserp.audit.AuditLogEntity;
import com.axiserp.audit.AuditLogRepository;
import com.axiserp.auth.AuthService;
import com.axiserp.common.api.PageResponse;
import com.axiserp.permission.Permission;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuthService authService;
    private final AuditLogRepository auditLogRepository;

    public AuditLogController(AuthService authService, AuditLogRepository auditLogRepository) {
        this.authService = authService;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> auditLogs(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String domainType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        authService.requirePermission(sessionId, Permission.APPROVAL_READ);
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시작일은 종료일보다 늦을 수 없습니다.");
        }
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("occurredAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(
                auditLogRepository.findAll(auditLogSpecification(search, domainType, startDate, endDate), pageRequest),
                AuditLogResponse::from
        );
    }

    private Specification<AuditLogEntity> auditLogSpecification(String search, String domainType, LocalDate startDate, LocalDate endDate) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if ("WORK".equals(domainType)) {
                predicates.add(builder.notEqual(root.get("domainType"), "AUTH"));
            } else if (!"ALL".equals(domainType)) {
                predicates.add(builder.equal(root.get("domainType"), domainType));
            }
            if (startDate != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("occurredAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("occurredAt"), endDate.atTime(LocalTime.MAX)));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("eventType")), keyword),
                        builder.like(builder.lower(root.get("referenceNo")), keyword),
                        builder.like(builder.lower(root.get("summary")), keyword),
                        builder.like(builder.lower(root.get("detail")), keyword),
                        builder.like(builder.lower(root.get("actor")), keyword)
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
