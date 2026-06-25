package com.axiserp.inventory.api;

public record InventoryOverviewResponse(
        long totalItems,
        long activeItems,
        long belowSafetyStocks,
        long warehouses
) {
}
