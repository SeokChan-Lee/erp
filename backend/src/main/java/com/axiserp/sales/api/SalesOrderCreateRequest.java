package com.axiserp.sales.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SalesOrderCreateRequest(
        @NotNull Long customerId,
        @NotNull Long itemId,
        @Min(1) int quantity,
        @NotNull @DecimalMin("1.00") BigDecimal unitPrice,
        String memo
) {
}
