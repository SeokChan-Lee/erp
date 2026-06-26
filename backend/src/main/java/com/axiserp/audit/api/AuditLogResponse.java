package com.axiserp.audit.api;

import com.axiserp.audit.AuditLogEntity;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Long id,
        String domainType,
        String eventType,
        String referenceNo,
        String summary,
        String detail,
        String actor,
        LocalDateTime occurredAt
) {
    public static AuditLogResponse from(AuditLogEntity auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getDomainType(),
                auditLog.getEventType(),
                auditLog.getReferenceNo(),
                auditLog.getSummary(),
                auditLog.getDetail(),
                auditLog.getActor(),
                auditLog.getOccurredAt()
        );
    }
}
