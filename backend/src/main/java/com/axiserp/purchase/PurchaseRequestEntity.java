package com.axiserp.purchase;

import com.axiserp.inventory.ItemEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_requests")
public class PurchaseRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String requestNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private SupplierEntity supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ItemEntity item;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PurchaseRequestStatus status;

    @Column(length = 255)
    private String memo;

    @Column(nullable = false, length = 80)
    private String requestedBy;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    protected PurchaseRequestEntity() {
    }

    public PurchaseRequestEntity(String requestNo, SupplierEntity supplier, ItemEntity item, int quantity, BigDecimal unitPrice, String memo, String requestedBy) {
        this.requestNo = requestNo;
        this.supplier = supplier;
        this.item = item;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.status = PurchaseRequestStatus.REQUESTED;
        this.memo = memo;
        this.requestedBy = requestedBy;
        this.requestedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getRequestNo() {
        return requestNo;
    }

    public SupplierEntity getSupplier() {
        return supplier;
    }

    public ItemEntity getItem() {
        return item;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public PurchaseRequestStatus getStatus() {
        return status;
    }

    public String getMemo() {
        return memo;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }
}
