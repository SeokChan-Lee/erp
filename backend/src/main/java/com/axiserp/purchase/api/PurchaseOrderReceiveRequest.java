package com.axiserp.purchase.api;

import jakarta.validation.constraints.NotNull;

public record PurchaseOrderReceiveRequest(
        @NotNull Long warehouseId
) {
}
