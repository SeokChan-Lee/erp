package com.axiserp.inventory;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "items")
public class ItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(nullable = false)
    private int safetyStock;

    @Column(nullable = false)
    private boolean active = true;

    protected ItemEntity() {
    }

    public ItemEntity(String sku, String name, String category, String unit, int safetyStock) {
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.safetyStock = safetyStock;
    }

    public Long getId() {
        return id;
    }

    public String getSku() {
        return sku;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getUnit() {
        return unit;
    }

    public int getSafetyStock() {
        return safetyStock;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, String category, String unit, int safetyStock, boolean active) {
        this.name = name;
        this.category = category;
        this.unit = unit;
        this.safetyStock = safetyStock;
        this.active = active;
    }
}
