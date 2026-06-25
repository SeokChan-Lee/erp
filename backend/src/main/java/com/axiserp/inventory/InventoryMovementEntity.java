package com.axiserp.inventory;

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

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovementEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ItemEntity item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private WarehouseEntity warehouse;

    @Column(nullable = false)
    private int quantityDelta;

    @Column(nullable = false, length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private InventoryMovementSourceType sourceType;

    @Column(nullable = false, length = 80)
    private String sourceReferenceNo;

    @Column(nullable = false, length = 80)
    private String processedBy;

    @Column(nullable = false)
    private LocalDateTime processedAt;

    protected InventoryMovementEntity() {
    }

    public InventoryMovementEntity(
            ItemEntity item,
            WarehouseEntity warehouse,
            int quantityDelta,
            String reason,
            InventoryMovementSourceType sourceType,
            String sourceReferenceNo,
            String processedBy
    ) {
        this.item = item;
        this.warehouse = warehouse;
        this.quantityDelta = quantityDelta;
        this.reason = reason;
        this.sourceType = sourceType;
        this.sourceReferenceNo = sourceReferenceNo == null ? "" : sourceReferenceNo;
        this.processedBy = processedBy;
        this.processedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public ItemEntity getItem() {
        return item;
    }

    public WarehouseEntity getWarehouse() {
        return warehouse;
    }

    public int getQuantityDelta() {
        return quantityDelta;
    }

    public String getReason() {
        return reason;
    }

    public InventoryMovementSourceType getSourceType() {
        return sourceType;
    }

    public String getSourceReferenceNo() {
        return sourceReferenceNo;
    }

    public String getProcessedBy() {
        return processedBy;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }
}
