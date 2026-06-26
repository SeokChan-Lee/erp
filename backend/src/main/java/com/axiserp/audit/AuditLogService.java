package com.axiserp.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void record(String domainType, String eventType, String referenceNo, String summary, String detail, String actor) {
        auditLogRepository.save(new AuditLogEntity(
                domainType,
                eventType,
                referenceNo,
                summary,
                detail,
                actor == null || actor.isBlank() ? "시스템" : actor
        ));
    }
}
