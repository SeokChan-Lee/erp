package com.axiserp.purchase.api;

import com.axiserp.purchase.PurchaseOrderEntity;
import com.axiserp.inventory.api.WarehouseResponse;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PurchaseOrderResponse(
        Long id,
        String orderNo,
        PurchaseRequestResponse request,
        BigDecimal totalAmount,
        String orderedBy,
        LocalDateTime orderedAt,
        WarehouseResponse receivedWarehouse,
        String receivedBy,
        LocalDateTime receivedAt
) {
    public static PurchaseOrderResponse from(PurchaseOrderEntity order) {
        return new PurchaseOrderResponse(
                order.getId(),
                order.getOrderNo(),
                PurchaseRequestResponse.from(order.getRequest()),
                order.getRequest().getUnitPrice().multiply(BigDecimal.valueOf(order.getRequest().getQuantity())),
                order.getOrderedBy(),
                order.getOrderedAt(),
                order.getReceivedWarehouse() == null ? null : WarehouseResponse.from(order.getReceivedWarehouse()),
                order.getReceivedBy(),
                order.getReceivedAt()
        );
    }
}
