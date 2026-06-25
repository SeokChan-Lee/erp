package com.axiserp.inventory.api;

import com.axiserp.inventory.ItemEntity;

public record ItemResponse(
        Long id,
        String sku,
        String name,
        String category,
        String unit,
        int safetyStock,
        boolean active
) {
    public static ItemResponse from(ItemEntity item) {
        return new ItemResponse(
                item.getId(),
                item.getSku(),
                item.getName(),
                item.getCategory(),
                item.getUnit(),
                item.getSafetyStock(),
                item.isActive()
        );
    }
}
