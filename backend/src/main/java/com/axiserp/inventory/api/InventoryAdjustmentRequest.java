package com.axiserp.inventory.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(
        @NotNull Long itemId,
        @NotNull Long warehouseId,
        int quantityDelta,
        @NotBlank @Size(max = 255) String reason
) {
}
