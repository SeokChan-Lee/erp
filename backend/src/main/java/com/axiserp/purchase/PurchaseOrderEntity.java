package com.axiserp.purchase;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_orders")
public class PurchaseOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String orderNo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private PurchaseRequestEntity request;

    @Column(nullable = false, length = 80)
    private String orderedBy;

    @Column(nullable = false)
    private LocalDateTime orderedAt;

    protected PurchaseOrderEntity() {
    }

    public PurchaseOrderEntity(String orderNo, PurchaseRequestEntity request, String orderedBy) {
        this.orderNo = orderNo;
        this.request = request;
        this.orderedBy = orderedBy;
        this.orderedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public PurchaseRequestEntity getRequest() {
        return request;
    }

    public String getOrderedBy() {
        return orderedBy;
    }

    public LocalDateTime getOrderedAt() {
        return orderedAt;
    }
}
