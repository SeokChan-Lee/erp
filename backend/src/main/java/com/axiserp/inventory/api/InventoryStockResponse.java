package com.axiserp.inventory.api;

import com.axiserp.inventory.InventoryStockEntity;

public record InventoryStockResponse(
        Long id,
        ItemResponse item,
        WarehouseResponse warehouse,
        int quantity,
        int safetyStock,
        boolean belowSafetyStock
) {
    public static InventoryStockResponse from(InventoryStockEntity stock) {
        int safetyStock = stock.getItem().getSafetyStock();
        return new InventoryStockResponse(
                stock.getId(),
                ItemResponse.from(stock.getItem()),
                WarehouseResponse.from(stock.getWarehouse()),
                stock.getQuantity(),
                safetyStock,
                stock.getQuantity() < safetyStock
        );
    }
}
