package com.axiserp.purchase.api;

import com.axiserp.inventory.api.ItemResponse;
import com.axiserp.purchase.PurchaseRequestEntity;
import com.axiserp.purchase.PurchaseRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseRequestResponse(
        Long id,
        String requestNo,
        SupplierResponse supplier,
        ItemResponse item,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        PurchaseRequestStatus status,
        String memo,
        String requestedBy,
        LocalDateTime requestedAt,
        String processedBy,
        LocalDateTime processedAt,
        String processedReason
) {
    public static PurchaseRequestResponse from(PurchaseRequestEntity request) {
        return new PurchaseRequestResponse(
                request.getId(),
                request.getRequestNo(),
                SupplierResponse.from(request.getSupplier()),
                ItemResponse.from(request.getItem()),
                request.getQuantity(),
                request.getUnitPrice(),
                request.getUnitPrice().multiply(BigDecimal.valueOf(request.getQuantity())),
                request.getStatus(),
                request.getMemo(),
                request.getRequestedBy(),
                request.getRequestedAt(),
                request.getProcessedBy(),
                request.getProcessedAt(),
                request.getProcessedReason()
        );
    }
}
