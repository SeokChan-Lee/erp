package com.axiserp.purchase;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import com.axiserp.inventory.WarehouseEntity;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_warehouse_id")
    private WarehouseEntity receivedWarehouse;

    @Column(length = 80)
    private String receivedBy;

    private LocalDateTime receivedAt;

    @Version
    @Column(nullable = false)
    private long version;

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

    public WarehouseEntity getReceivedWarehouse() {
        return receivedWarehouse;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }

    public boolean isReceived() {
        return receivedAt != null;
    }

    public void receive(WarehouseEntity warehouse, String receivedBy) {
        if (isReceived()) {
            throw new IllegalStateException("이미 입고 처리된 발주입니다.");
        }
        this.receivedWarehouse = warehouse;
        this.receivedBy = receivedBy;
        this.receivedAt = LocalDateTime.now();
    }

    public void cancelReceive() {
        if (!isReceived()) {
            throw new IllegalStateException("입고 처리되지 않은 발주입니다.");
        }
        this.receivedWarehouse = null;
        this.receivedBy = null;
        this.receivedAt = null;
    }
}
