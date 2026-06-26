package com.axiserp.purchase.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PurchaseRequestCancelRequest(
        @NotBlank @Size(max = 255) String reason
) {
}
