package com.axiserp.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String domainType;

    @Column(nullable = false, length = 80)
    private String eventType;

    @Column(nullable = false, length = 120)
    private String referenceNo;

    @Column(nullable = false, length = 255)
    private String summary;

    @Column(length = 500)
    private String detail;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    protected AuditLogEntity() {
    }

    public AuditLogEntity(String domainType, String eventType, String referenceNo, String summary, String detail, String actor) {
        this.domainType = domainType;
        this.eventType = eventType;
        this.referenceNo = referenceNo == null ? "" : referenceNo;
        this.summary = summary;
        this.detail = detail;
        this.actor = actor;
        this.occurredAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getDomainType() {
        return domainType;
    }

    public String getEventType() {
        return eventType;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public String getSummary() {
        return summary;
    }

    public String getDetail() {
        return detail;
    }

    public String getActor() {
        return actor;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
}
