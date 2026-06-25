package com.axiserp.inventory.api;

import com.axiserp.inventory.InventoryMovementEntity;

import java.time.LocalDateTime;

public record InventoryMovementResponse(
        Long id,
        ItemResponse item,
        WarehouseResponse warehouse,
        int quantityDelta,
        String reason,
        String processedBy,
        LocalDateTime processedAt
) {
    public static InventoryMovementResponse from(InventoryMovementEntity movement) {
        return new InventoryMovementResponse(
                movement.getId(),
                ItemResponse.from(movement.getItem()),
                WarehouseResponse.from(movement.getWarehouse()),
                movement.getQuantityDelta(),
                movement.getReason(),
                movement.getProcessedBy(),
                movement.getProcessedAt()
        );
    }
}
