package com.axiserp.inventory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

@Entity
@Table(
        name = "inventory_stocks",
        uniqueConstraints = @UniqueConstraint(name = "uk_inventory_stocks_item_warehouse", columnNames = {"item_id", "warehouse_id"})
)
public class InventoryStockEntity {

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
    private int quantity;

    @Version
    @Column(nullable = false)
    private long version;

    protected InventoryStockEntity() {
    }

    public InventoryStockEntity(ItemEntity item, WarehouseEntity warehouse, int quantity) {
        this.item = item;
        this.warehouse = warehouse;
        this.quantity = quantity;
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

    public int getQuantity() {
        return quantity;
    }

    public void adjust(int quantityDelta) {
        this.quantity += quantityDelta;
    }
}
