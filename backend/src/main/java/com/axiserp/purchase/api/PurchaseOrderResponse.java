package com.axiserp.purchase.api;

import com.axiserp.purchase.PurchaseOrderEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseOrderResponse(
        Long id,
        String orderNo,
        PurchaseRequestResponse request,
        BigDecimal totalAmount,
        String orderedBy,
        LocalDateTime orderedAt
) {
    public static PurchaseOrderResponse from(PurchaseOrderEntity order) {
        return new PurchaseOrderResponse(
                order.getId(),
                order.getOrderNo(),
                PurchaseRequestResponse.from(order.getRequest()),
                order.getRequest().getUnitPrice().multiply(BigDecimal.valueOf(order.getRequest().getQuantity())),
                order.getOrderedBy(),
                order.getOrderedAt()
        );
    }
}
