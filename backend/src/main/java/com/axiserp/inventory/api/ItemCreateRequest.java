package com.axiserp.inventory.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ItemCreateRequest(
        @NotBlank @Size(max = 60) String sku,
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Size(max = 80) String category,
        @NotBlank @Size(max = 20) String unit,
        @Min(0) int safetyStock
) {
}
