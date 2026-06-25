package com.axiserp.sales.api;

import jakarta.validation.constraints.NotNull;

public record SalesOrderShipRequest(
        @NotNull Long warehouseId
) {
}
